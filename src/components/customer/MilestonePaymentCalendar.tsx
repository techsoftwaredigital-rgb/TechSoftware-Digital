import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  DollarSign,
  TrendingUp,
  Filter,
  ArrowUpRight,
  Download,
  CalendarPlus,
  Layers,
  Cpu,
  Building,
  User,
  ExternalLink,
  MessageCircle,
  FileText,
  AlertOctagon,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { Quotation, ProjectMilestone, MilestoneStatus, PaymentStatus } from '../../types';
import { deriveMilestonesFromQuotations, generateGoogleCalendarUrl } from '../../utils/milestoneGenerator';

export type CalendarEventType = 'milestone' | 'payment';

export interface CalendarEventItem {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  endDate?: string;
  quotationId: string;
  quotationNumber: string;
  projectName: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'delayed' | 'paid' | 'pending' | 'overdue';
  
  // Milestone specific
  milestone?: ProjectMilestone;
  phase?: string;
  moduleName?: string;
  deliverables?: string[];
  assignedLead?: string;
  progressPercent?: number;

  // Payment specific
  amount?: number;
  paymentStage?: '50% Advance' | 'Sprint Milestone' | 'Final Balance' | 'AMC Annual' | 'Custom';
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
  notes?: string;
  invoiceLink?: string;
}

interface MilestonePaymentCalendarProps {
  quotations: Quotation[];
  customMilestones?: ProjectMilestone[];
  onSelectMilestone?: (milestone: ProjectMilestone) => void;
  onViewQuotation?: (quotation: Quotation) => void;
}

export const MilestonePaymentCalendar: React.FC<MilestonePaymentCalendarProps> = ({
  quotations,
  customMilestones = [],
  onSelectMilestone,
  onViewQuotation
}) => {
  // Calendar View mode: 'month' (Interactive Grid) | 'agenda' (Chronological Feed) | 'payments' (Dedicated Financials)
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'payments'>('month');

  // Month navigation
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'milestone' | 'payment'>('all');
  const [selectedQuoteFilter, setSelectedQuoteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Selected Day & Event Details Modal
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEventItem[] } | null>(null);
  const [activeModalEvent, setActiveModalEvent] = useState<CalendarEventItem | null>(null);

  // Active quotations (In Progress, Booked, Completed, Sent)
  const activeQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
    );
  }, [quotations]);

  // Derive milestones
  const allDerivedMilestones = useMemo(() => {
    return deriveMilestonesFromQuotations(activeQuotations.length > 0 ? activeQuotations : quotations, customMilestones);
  }, [activeQuotations, quotations, customMilestones]);

  // Combine Milestones and Payment Dues into unified events list
  const allEvents: CalendarEventItem[] = useMemo(() => {
    const events: CalendarEventItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Process Milestones
    allDerivedMilestones.forEach((m) => {
      const eventDate = m.estimatedCompletionDate || m.targetDate;
      const isOverdue = eventDate < todayStr && m.status !== 'completed';

      events.push({
        id: `event-ms-${m.id}`,
        type: 'milestone',
        title: m.title,
        date: eventDate,
        endDate: m.targetDate,
        quotationId: m.quotationId,
        quotationNumber: m.quotationNumber,
        projectName: m.projectName,
        status: isOverdue ? 'delayed' : m.status,
        milestone: m,
        phase: m.phase,
        moduleName: m.moduleName,
        deliverables: m.deliverables,
        assignedLead: m.assignedLead,
        progressPercent: m.progressPercent
      });
    });

    // 2. Process Payment Due Dates from Quotations
    const quotesToProcess = activeQuotations.length > 0 ? activeQuotations : quotations;

    quotesToProcess.forEach((quote) => {
      const projectName = quote.customer.companyName || quote.customer.name || 'Software Project';
      const quoteStartDate = quote.date || quote.createdAt.split('T')[0];
      
      // A. 50% Advance Payment Due Date
      const isAdvancePaid = quote.paymentStatus === 'Paid' || quote.paymentStatus === 'Partial' || quote.status === 'In Progress' || quote.status === 'Completed';
      events.push({
        id: `event-pay-adv-${quote.id}`,
        type: 'payment',
        title: `50% Advance Kickoff Payment (#${quote.quotationNumber})`,
        date: quoteStartDate,
        quotationId: quote.id,
        quotationNumber: quote.quotationNumber,
        projectName,
        status: isAdvancePaid ? 'paid' : (quoteStartDate < todayStr ? 'overdue' : 'pending'),
        amount: quote.advancePayable50 || Math.round(quote.grandTotal * 0.5),
        paymentStage: '50% Advance',
        paymentStatus: isAdvancePaid ? 'Paid' : 'Pending',
        notes: 'Required for technical kickoff, Git repo setup, and architecture sprint reservation.'
      });

      // B. Final 50% Balance Payment Due Date
      // Defaults to the final milestone target date, or validUntil / 30 days after start
      const finalMilestone = allDerivedMilestones
        .filter((m) => m.quotationId === quote.id || m.quotationNumber === quote.quotationNumber)
        .slice(-1)[0];
      
      const balanceDueDate = finalMilestone?.targetDate || quote.validUntil || (
        new Date(new Date(quoteStartDate).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      const isBalancePaid = quote.paymentStatus === 'Paid' || quote.status === 'Completed';
      events.push({
        id: `event-pay-bal-${quote.id}`,
        type: 'payment',
        title: `Final 50% Balance Settlement & Handover (#${quote.quotationNumber})`,
        date: balanceDueDate,
        quotationId: quote.id,
        quotationNumber: quote.quotationNumber,
        projectName,
        status: isBalancePaid ? 'paid' : (balanceDueDate < todayStr ? 'overdue' : 'pending'),
        amount: quote.balancePayable || Math.round(quote.grandTotal * 0.5),
        paymentStage: 'Final Balance',
        paymentStatus: isBalancePaid ? 'Paid' : 'Pending',
        notes: 'Payable upon UAT approval, prior to production server credentials and DNS deployment.'
      });

      // C. AMC Annual Maintenance Renewal (if AMC contracted)
      if (quote.amcOption && quote.amcOption !== 'none' && quote.amcAmount > 0) {
        const amcDueDate = new Date(new Date(balanceDueDate).getTime() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        
        events.push({
          id: `event-pay-amc-${quote.id}`,
          type: 'payment',
          title: `AMC Annual Renewal (${quote.amcDetails?.tierName || 'Standard Support'})`,
          date: amcDueDate,
          quotationId: quote.id,
          quotationNumber: quote.quotationNumber,
          projectName,
          status: 'pending',
          amount: quote.amcAmount,
          paymentStage: 'AMC Annual',
          paymentStatus: 'Pending',
          notes: 'Annual comprehensive maintenance, security patches, SLA uptime, and bug fixes.'
        });
      }
    });

    // Sort chronologically ascending
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allDerivedMilestones, activeQuotations, quotations]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      const matchType = typeFilter === 'all' || item.type === typeFilter;
      const matchQuote = selectedQuoteFilter === 'all' || item.quotationNumber === selectedQuoteFilter || item.quotationId === selectedQuoteFilter;
      
      let matchStatus = true;
      if (statusFilter === 'pending') {
        matchStatus = item.status !== 'completed' && item.status !== 'paid';
      } else if (statusFilter === 'completed') {
        matchStatus = item.status === 'completed' || item.status === 'paid';
      }

      return matchType && matchQuote && matchStatus;
    });
  }, [allEvents, typeFilter, selectedQuoteFilter, statusFilter]);

  // Events grouped by Date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Next Upcoming Milestone & Next Payment Due
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMilestone = useMemo(() => {
    return allEvents.find((e) => e.type === 'milestone' && e.date >= todayStr && e.status !== 'completed');
  }, [allEvents, todayStr]);

  const nextPayment = useMemo(() => {
    return allEvents.find((e) => e.type === 'payment' && e.status !== 'paid');
  }, [allEvents]);

  const totalOutstandingBalance = useMemo(() => {
    return allEvents
      .filter((e) => e.type === 'payment' && e.status !== 'paid' && e.amount)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [allEvents]);

  // Calendar calculations for Monthly View
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleJumpToToday = () => setCurrentDate(new Date());

  // Generate Google Calendar Link for Payment Event
  const generatePaymentGoogleCalendarUrl = (item: CalendarEventItem): string => {
    const cleanDate = item.date.replace(/-/g, '');
    const dates = `${cleanDate}/${cleanDate}`;
    const title = encodeURIComponent(`[Payment Due] ${item.title} - ₹${item.amount?.toLocaleString('en-IN')}`);
    const details = encodeURIComponent(
      `TechSoftware.digital Payment Checkpoint\nProject: ${item.projectName}\nQuotation: #${item.quotationNumber}\nAmount Due: ₹${item.amount?.toLocaleString('en-IN')}\nStage: ${item.paymentStage}\nNotes: ${item.notes || 'Please settle via UPI or Net Banking.'}`
    );
    const location = encodeURIComponent('TechSoftware.digital Invoicing Portal');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <div id="milestone-payment-calendar-root" className="space-y-5">
      {/* 1. TOP SUMMARY KPI BANNER: Next Milestone, Next Payment & Outstanding Total */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Project Milestones & Payment Calendar</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-semibold">
                    Live Schedule
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive delivery roadmap synced with 50% advance, sprint deliverables, and final balance due dates.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Next Milestone */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Milestone</span>
                <span className="text-xs font-bold text-white truncate block">
                  {nextMilestone ? nextMilestone.title : 'All Milestones Completed'}
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  {nextMilestone ? nextMilestone.date : '—'}
                </span>
              </div>
            </div>

            {/* Next Payment Due */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/80 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Payment Due</span>
                <span className="text-xs font-bold text-amber-300 truncate block">
                  {nextPayment ? `₹${nextPayment.amount?.toLocaleString('en-IN')} (${nextPayment.paymentStage})` : 'All Payments Settled'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {nextPayment ? nextPayment.date : '—'}
                </span>
              </div>
            </div>

            {/* Total Balance Outstanding */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Balance Due</span>
                <span className="text-base font-black text-white font-mono block">
                  ₹{totalOutstandingBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500">Across active quotes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROL TOOLBAR: View Switcher, Type Filter, Quote Filter & Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'month'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Month Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'agenda'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'payments'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Dues Only</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Type Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Show:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">Milestones & Payments</option>
              <option value="milestone" className="bg-slate-900">Milestones Only</option>
              <option value="payment" className="bg-slate-900">Payment Dues Only</option>
            </select>
          </div>

          {/* Quotation Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedQuoteFilter}
              onChange={(e) => setSelectedQuoteFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
            >
              <option value="all" className="bg-slate-900">All Projects</option>
              {activeQuotations.map((q) => (
                <option key={q.id} value={q.quotationNumber} className="bg-slate-900">
                  {q.quotationNumber} ({q.customer.companyName || q.customer.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="pending" className="bg-slate-900">Upcoming / Pending</option>
              <option value="completed" className="bg-slate-900">Completed / Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. VIEW MODE A: INTERACTIVE MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Calendar Month Header & Month Navigation */}
          <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-base sm:text-lg font-bold text-white">{monthName}</h4>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                ({filteredEvents.length} events scheduled)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Header */}
          <div className="grid grid-cols-7 bg-slate-950/50 border-b border-slate-800 text-center text-xs font-bold text-slate-400 py-2.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="uppercase tracking-wider text-[11px]">{d}</div>
            ))}
          </div>

          {/* 7-Column Monthly Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-900/60 divide-x divide-y divide-slate-800/60">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-[90px] sm:min-h-[110px] p-2 bg-slate-950/20" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = selectedDayEvents?.date === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents({ date: dateStr, events: dayEvents });
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
                    dayEvents.length > 0 ? 'cursor-pointer hover:bg-slate-800/40' : ''
                  } ${isToday ? 'bg-cyan-950/20 ring-1 ring-inset ring-cyan-500/40' : ''} ${
                    isSelected ? 'bg-cyan-950/40 ring-2 ring-inset ring-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                        isToday
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/40'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List within Cell */}
                  <div className="space-y-1 mt-1.5 flex-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const isMilestone = ev.type === 'milestone';
                      const isCompleted = ev.status === 'completed' || ev.status === 'paid';
                      const isDelayed = ev.status === 'delayed' || ev.status === 'overdue';

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalEvent(ev);
                          }}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold truncate flex items-center gap-1 border transition-all ${
                            isMilestone
                              ? isCompleted
                                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                                : isDelayed
                                ? 'bg-rose-950/90 border-rose-800 text-rose-300'
                                : 'bg-cyan-950/80 border-cyan-800 text-cyan-300 hover:border-cyan-600'
                              : isCompleted
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : isDelayed
                              ? 'bg-rose-950/90 border-rose-800 text-rose-300'
                              : 'bg-amber-950/80 border-amber-800 text-amber-300 hover:border-amber-600'
                          }`}
                          title={`${isMilestone ? 'Milestone' : 'Payment Due'}: ${ev.title}`}
                        >
                          {isMilestone ? (
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                          ) : (
                            <CreditCard className="w-2.5 h-2.5 shrink-0" />
                          )}
                          <span className="truncate">
                            {isMilestone ? ev.title : `₹${ev.amount?.toLocaleString('en-IN')}: ${ev.paymentStage}`}
                          </span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-mono text-cyan-400 font-bold px-1">
                        +{dayEvents.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Day Drawer / Highlights */}
          {selectedDayEvents && (
            <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <span>Events on {selectedDayEvents.date}</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setSelectedDayEvents(null)}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close Drawer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setActiveModalEvent(ev)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      ev.type === 'milestone'
                        ? 'bg-slate-900 border-cyan-800/60 hover:border-cyan-500'
                        : 'bg-slate-900 border-amber-800/60 hover:border-amber-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          ev.type === 'milestone'
                            ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                            : 'bg-amber-950 border-amber-800 text-amber-300'
                        }`}
                      >
                        {ev.type === 'milestone' ? (
                          <>
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>Milestone: {ev.phase}</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 text-amber-400" />
                            <span>Payment Due: {ev.paymentStage}</span>
                          </>
                        )}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          ev.status === 'completed' || ev.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : ev.status === 'delayed' || ev.status === 'overdue'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ev.status.toUpperCase()}
                      </span>
                    </div>

                    <h6 className="text-xs font-bold text-white mb-1 leading-snug">{ev.title}</h6>
                    <p className="text-[11px] text-slate-400">Quote #{ev.quotationNumber} • {ev.projectName}</p>

                    {ev.amount && (
                      <div className="mt-2 text-sm font-extrabold font-mono text-amber-400">
                        ₹{ev.amount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW MODE B: UPCOMING AGENDA / TIMELINE FEED */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h5 className="text-base font-bold text-white">No Scheduled Items Found</h5>
              <p className="text-xs text-slate-500 mt-1">Try changing the filters above to inspect past or other project deliverables.</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-amber-500 before:to-slate-800">
              {filteredEvents.map((item) => {
                const isMilestone = item.type === 'milestone';
                const isCompleted = item.status === 'completed' || item.status === 'paid';
                const isOverdue = item.status === 'delayed' || item.status === 'overdue';

                return (
                  <div key={item.id} className="relative group">
                    {/* Node marker on timeline */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isMilestone
                          ? isCompleted
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20'
                            : isOverdue
                            ? 'bg-rose-950 border-rose-500 text-rose-400'
                            : 'bg-cyan-950 border-cyan-400 text-cyan-400'
                          : isCompleted
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20'
                          : isOverdue
                          ? 'bg-rose-950 border-rose-500 text-rose-400'
                          : 'bg-amber-950 border-amber-400 text-amber-400'
                      }`}
                    >
                      {isMilestone ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <CreditCard className="w-3 h-3" />
                      )}
                    </div>

                    {/* Card Body */}
                    <div
                      onClick={() => setActiveModalEvent(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-slate-700 bg-slate-900/90 ${
                        isMilestone
                          ? 'hover:shadow-cyan-950/20'
                          : 'hover:shadow-amber-950/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                              isMilestone
                                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                                : 'bg-amber-950/80 border-amber-800 text-amber-300'
                            }`}
                          >
                            {isMilestone ? `Milestone • ${item.phase}` : `Payment Due • ${item.paymentStage}`}
                          </span>

                          <span className="text-xs font-mono text-slate-400">
                            Quote #{item.quotationNumber}
                          </span>

                          {item.moduleName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-indigo-400" />
                              <span>{item.moduleName}</span>
                            </span>
                          )}
                        </div>

                        {/* Due Date Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {item.date}
                          </span>
                          <span
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isOverdue
                                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isCompleted ? 'COMPLETED' : isOverdue ? 'OVERDUE' : 'SCHEDULED'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{item.projectName}</p>
                        </div>

                        {item.amount && (
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Amount Payable</span>
                            <span className="text-base font-black text-amber-400 font-mono">
                              ₹{item.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW MODE C: DEDICATED FINANCIAL PAYMENT DUE SCHEDULE */}
      {viewMode === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Client Payment Due Roadmap & Milestone Schedule</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scheduled payment milestones tied to 50% advance kickoff and final project acceptance.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Settlement</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                  ₹{totalOutstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Table of Payment Dues */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Payment Stage & Description</th>
                    <th className="py-3 px-4">Quotation #</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {allEvents
                    .filter((e) => e.type === 'payment')
                    .map((item) => {
                      const isPaid = item.status === 'paid';
                      const isOverdue = item.status === 'overdue';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/80">
                                <CreditCard className="w-3.5 h-3.5" />
                              </span>
                              <span>{item.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{item.notes}</span>
                          </td>

                          <td className="py-3 px-4 font-mono text-cyan-300">
                            #{item.quotationNumber}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-300">
                            {item.date}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-300">
                            ₹{item.amount?.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                                isPaid
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                  : isOverdue
                                  ? 'bg-rose-950 border border-rose-800 text-rose-300'
                                  : 'bg-amber-950 border border-amber-800 text-amber-300'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>PAID</span>
                                </>
                              ) : isOverdue ? (
                                <>
                                  <AlertOctagon className="w-3 h-3" />
                                  <span>OVERDUE</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>PENDING</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveModalEvent(item)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                              >
                                View Details
                              </button>

                              <a
                                href={`https://wa.me/918169401877?text=Hi%20TechSoftware.digital,%20regarding%20payment%20due%20for%20Quote%20%23${item.quotationNumber}%20(${encodeURIComponent(
                                  item.paymentStage || 'Payment'
                                )})%20of%20INR%20${item.amount}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. EVENT DETAIL MODAL (Milestone or Payment Due) */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`p-2 rounded-xl border ${
                    activeModalEvent.type === 'milestone'
                      ? 'bg-cyan-950 border-cyan-800 text-cyan-400'
                      : 'bg-amber-950 border-amber-800 text-amber-400'
                  }`}
                >
                  {activeModalEvent.type === 'milestone' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {activeModalEvent.type === 'milestone' ? 'Project Milestone Checkpoint' : 'Payment Due Checkpoint'}
                  </span>
                  <h4 className="text-base font-bold text-white leading-tight">{activeModalEvent.title}</h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Key Data Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scheduled Date</span>
                <span className="font-bold font-mono text-cyan-300 text-sm">{activeModalEvent.date}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Status</span>
                <span
                  className={`font-bold uppercase font-mono ${
                    activeModalEvent.status === 'completed' || activeModalEvent.status === 'paid'
                      ? 'text-emerald-400'
                      : activeModalEvent.status === 'delayed' || activeModalEvent.status === 'overdue'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {activeModalEvent.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Quotation</span>
                <span className="font-mono text-slate-200">#{activeModalEvent.quotationNumber}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Project</span>
                <span className="text-slate-200 truncate block">{activeModalEvent.projectName}</span>
              </div>

              {activeModalEvent.amount && (
                <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Amount Due</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    ₹{activeModalEvent.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Deliverables or Payment Instructions */}
            {activeModalEvent.type === 'milestone' && activeModalEvent.deliverables && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Deliverables & Verification Criteria:
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeModalEvent.deliverables.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModalEvent.type === 'payment' && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/60 space-y-2 text-xs text-slate-300">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Payment Settlement Instructions:</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Payments are accepted via UPI, NEFT/RTGS, or Razorpay. Please reference quotation #{activeModalEvent.quotationNumber} during transfer to ensure automated receipt generation.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>GST Invoice: Available upon verification</span>
                  <span className="text-emerald-400 font-bold">50% Advance Model</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <a
                href={
                  activeModalEvent.type === 'milestone' && activeModalEvent.milestone
                    ? generateGoogleCalendarUrl(activeModalEvent.milestone)
                    : generatePaymentGoogleCalendarUrl(activeModalEvent)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add to Google Calendar</span>
              </a>

              <div className="flex items-center gap-2">
                {activeModalEvent.type === 'milestone' && onSelectMilestone && activeModalEvent.milestone && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMilestone(activeModalEvent.milestone!);
                      setActiveModalEvent(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                  >
                    Open in Gantt
                  </button>
                )}

                {onViewQuotation && (
                  <button
                    type="button"
                    onClick={() => {
                      const q = quotations.find((item) => item.id === activeModalEvent.quotationId || item.quotationNumber === activeModalEvent.quotationNumber);
                      if (q) {
                        onViewQuotation(q);
                        setActiveModalEvent(null);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    View Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
