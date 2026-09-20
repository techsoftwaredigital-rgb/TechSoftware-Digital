import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Plus,
  Layers,
  Flag,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Check,
  X,
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Quotation, ProjectMilestone, MilestonePhase, MilestoneStatus } from '../../types';
import {
  deriveMilestonesFromQuotations,
  generateGoogleCalendarUrl,
  exportMilestonesToICS
} from '../../utils/milestoneGenerator';

interface ProjectCalendarProps {
  quotations: Quotation[];
  customMilestones?: ProjectMilestone[];
  onAddCustomMilestone?: (milestone: ProjectMilestone) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: MilestoneStatus) => void;
  onViewQuotation?: (quotation: Quotation) => void;
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
  quotations,
  customMilestones = [],
  onAddCustomMilestone,
  onUpdateMilestoneStatus,
  onViewQuotation
}) => {
  // Calendar View Mode: 'month' | 'roadmap' | 'deadlines'
  const [viewMode, setViewMode] = useState<'month' | 'roadmap' | 'deadlines'>('roadmap');

  // Selected Quotation Filter ('all' or quoteId)
  const [selectedQuoteFilter, setSelectedQuoteFilter] = useState<string>('all');

  // Selected Status Filter ('all' | 'upcoming' | 'in_progress' | 'completed')
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Current browsing month for calendar view
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected milestone for detail modal
  const [activeMilestoneForModal, setActiveMilestoneForModal] = useState<ProjectMilestone | null>(null);

  // Add custom milestone modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    title: '',
    quotationNumber: quotations[0]?.quotationNumber || 'TSD-PROJECT',
    phase: 'Sprint 1 Development' as MilestonePhase,
    targetDate: new Date().toISOString().split('T')[0],
    description: '',
    deliverable1: '',
    deliverable2: '',
    paymentMilestone: ''
  });

  // Derive all milestones from booked/active quotes + custom ones
  const allMilestones = useMemo(() => {
    return deriveMilestonesFromQuotations(quotations, customMilestones);
  }, [quotations, customMilestones]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      const matchQuote = selectedQuoteFilter === 'all' || m.quotationNumber === selectedQuoteFilter || m.quotationId === selectedQuoteFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchQuote && matchStatus;
    });
  }, [allMilestones, selectedQuoteFilter, statusFilter]);

  // Distinct active quotations for selector
  const activeQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
    );
  }, [quotations]);

  // Stats
  const totalCount = filteredMilestones.length;
  const completedCount = filteredMilestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = filteredMilestones.filter((m) => m.status === 'in_progress').length;
  const upcomingCount = filteredMilestones.filter((m) => m.status === 'upcoming').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Next upcoming milestone
  const nextMilestone = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return filteredMilestones.find((m) => m.targetDate >= todayStr && m.status !== 'completed');
  }, [filteredMilestones]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const monthName = useMemo(() => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Map milestones by date for month view
  const milestonesByDate = useMemo(() => {
    const map: Record<string, ProjectMilestone[]> = {};
    filteredMilestones.forEach((m) => {
      if (!map[m.targetDate]) {
        map[m.targetDate] = [];
      }
      map[m.targetDate].push(m);
    });
    return map;
  }, [filteredMilestones]);

  const handleSaveCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneForm.title.trim() || !newMilestoneForm.targetDate) return;

    const deliverables = [newMilestoneForm.deliverable1, newMilestoneForm.deliverable2].filter(Boolean);

    const relatedQuote = quotations.find((q) => q.quotationNumber === newMilestoneForm.quotationNumber);

    const created: ProjectMilestone = {
      id: `custom-ms-${Date.now()}`,
      quotationId: relatedQuote?.id || 'quote-custom',
      quotationNumber: newMilestoneForm.quotationNumber,
      projectName: relatedQuote?.customer.companyName || 'Custom Project Track',
      phase: newMilestoneForm.phase,
      title: newMilestoneForm.title,
      description: newMilestoneForm.description || 'Custom client-specified project milestone checkpoint.',
      targetDate: newMilestoneForm.targetDate,
      status: 'upcoming',
      deliverables: deliverables.length > 0 ? deliverables : ['Client & Technical Review Verification'],
      assignedLead: relatedQuote?.assignedStaffName || 'Aman Sharma (Lead Architect)',
      paymentMilestone: newMilestoneForm.paymentMilestone || undefined,
      isCustom: true
    };

    if (onAddCustomMilestone) {
      onAddCustomMilestone(created);
    }
    setShowAddModal(false);
    setNewMilestoneForm({
      title: '',
      quotationNumber: quotations[0]?.quotationNumber || 'TSD-PROJECT',
      phase: 'Sprint 1 Development',
      targetDate: new Date().toISOString().split('T')[0],
      description: '',
      deliverable1: '',
      deliverable2: '',
      paymentMilestone: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Project Milestones & Delivery Calendar</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold">
                    Live Sync from Quotations
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time timeline tracking mapped from your booked project quotes, kickoff terms, and sprint deliverables.
                </p>
              </div>
            </div>

            {nextMilestone && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs mt-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-slate-400">Next Upcoming Deadline:</span>
                <span className="font-bold text-white">{nextMilestone.title}</span>
                <span className="text-cyan-400 font-mono text-[11px] font-bold bg-cyan-950/60 px-2 py-0.5 rounded">
                  {nextMilestone.targetDate}
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="text-base font-extrabold text-white">{totalCount}</span>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Done</span>
                <span className="text-base font-extrabold text-emerald-400">{completedCount}</span>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">Active</span>
                <span className="text-base font-extrabold text-cyan-400">{inProgressCount}</span>
              </div>
              <div className="px-2.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Scheduled</span>
                <span className="text-base font-extrabold text-amber-400">{upcomingCount}</span>
              </div>
            </div>

            <button
              onClick={() => exportMilestonesToICS(filteredMilestones)}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow"
              title="Download iCalendar (.ics) file for Google, Apple, or Outlook Calendar"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .ICS</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Checkpoint</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
          <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold font-mono text-cyan-400 shrink-0">
            {completionPercentage}% Target Completed
          </span>
        </div>
      </div>

      {/* Control Bar: Filters & View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Left: Project & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">Project:</span>
            <select
              value={selectedQuoteFilter}
              onChange={(e) => setSelectedQuoteFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Active Projects ({activeQuotations.length})
              </option>
              {activeQuotations.map((q) => (
                <option key={q.id} value={q.quotationNumber} className="bg-slate-900 text-white">
                  {q.quotationNumber} - {q.customer.companyName || q.customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Statuses
              </option>
              <option value="in_progress" className="bg-slate-900 text-cyan-400">
                In Progress
              </option>
              <option value="upcoming" className="bg-slate-900 text-amber-400">
                Scheduled / Upcoming
              </option>
              <option value="completed" className="bg-slate-900 text-emerald-400">
                Completed
              </option>
            </select>
          </div>
        </div>

        {/* Right: View Mode Buttons */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'roadmap'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Milestone Roadmap</span>
          </button>

          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Month View</span>
          </button>

          <button
            onClick={() => setViewMode('deadlines')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'deadlines'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Deadlines</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MILESTONE ROADMAP (Gantt & Deliverables Flow) */}
      {viewMode === 'roadmap' && (
        <div className="space-y-4">
          <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 pl-4 sm:pl-8 space-y-6">
            {filteredMilestones.map((milestone, idx) => {
              const isCompleted = milestone.status === 'completed';
              const isInProgress = milestone.status === 'in_progress';
              const isUpcoming = milestone.status === 'upcoming';

              return (
                <div
                  key={milestone.id}
                  id={`milestone-${milestone.id}`}
                  className="relative group transition-all"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[27px] sm:-left-[43px] top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/40'
                        : isInProgress
                        ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/50 animate-pulse'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isInProgress ? (
                      <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Milestone Card */}
                  <div
                    onClick={() => setActiveMilestoneForModal(milestone)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                      isInProgress
                        ? 'bg-slate-900/95 border-cyan-500/50 shadow-xl shadow-cyan-500/10 hover:border-cyan-400'
                        : isCompleted
                        ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-950 border border-slate-800 text-cyan-300">
                            {milestone.phase}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isCompleted
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                : isInProgress
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 animate-pulse'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : isInProgress ? (
                              <Clock className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <CalendarIcon className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{milestone.status.toUpperCase()}</span>
                          </span>

                          <span className="text-[11px] font-mono text-slate-400">
                            Quote: {milestone.quotationNumber}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                          <span>{milestone.title}</span>
                          {milestone.isCustom && (
                            <span className="text-[10px] font-normal px-2 py-0.5 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-md">
                              Custom
                            </span>
                          )}
                        </h4>

                        <p className="text-xs text-slate-300 line-clamp-2">{milestone.description}</p>
                      </div>

                      {/* Right target date & quick calendar add */}
                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Target Date
                          </span>
                          <span className="text-sm font-extrabold font-mono text-cyan-400">
                            {milestone.targetDate}
                          </span>
                        </div>

                        <a
                          href={generateGoogleCalendarUrl(milestone)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Add milestone to Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Google Cal</span>
                        </a>
                      </div>
                    </div>

                    {/* Deliverables Checklist Preview */}
                    {milestone.deliverables.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Phase Deliverables:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {milestone.deliverables.map((d, dIdx) => (
                            <div
                              key={dIdx}
                              className="flex items-center gap-2 text-slate-300 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/50"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isCompleted ? 'bg-emerald-400' : isInProgress ? 'bg-cyan-400' : 'bg-slate-500'
                                }`}
                              />
                              <span className="truncate">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Trigger / Lead Info */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {milestone.paymentMilestone ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>{milestone.paymentMilestone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Milestone development phase</span>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lead: {milestone.assignedLead || 'TechSoftware Team'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-bold text-white">{monthName}</h4>
              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-slate-950/20 border border-transparent opacity-30" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayMilestones = milestonesByDate[dateStr] || [];

              const isToday =
                new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/20'
                      : dayMilestones.length > 0
                      ? 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayMilestones.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  {/* Day Milestones Chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayMilestones.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setActiveMilestoneForModal(m)}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium transition-all ${
                          m.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : m.status === 'in_progress'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                        }`}
                        title={`${m.title} (${m.phase})`}
                      >
                        {m.title}
                      </div>
                    ))}
                    {dayMilestones.length > 2 && (
                      <span className="text-[9px] text-slate-400 block text-right font-mono">
                        +{dayMilestones.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: UPCOMING DEADLINES LIST */}
      {viewMode === 'deadlines' && (
        <div className="space-y-3">
          {filteredMilestones.map((m) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = m.targetDate === todayStr;
            const isPast = m.targetDate < todayStr;
            const diffDays = Math.round(
              (new Date(m.targetDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={m.id}
                onClick={() => setActiveMilestoneForModal(m)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      m.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : m.status === 'in_progress'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                        {m.phase}
                      </span>
                      <span className="text-xs text-cyan-400 font-mono">Quote: {m.quotationNumber}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {m.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {m.targetDate}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isToday
                          ? 'text-amber-400 animate-pulse'
                          : isPast
                          ? 'text-emerald-400'
                          : diffDays <= 7
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isToday
                        ? 'Due Today'
                        : isPast
                        ? 'Completed'
                        : `In ${diffDays} days`}
                    </span>
                  </div>

                  <a
                    href={generateGoogleCalendarUrl(m)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Add to Google Calendar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Milestone Detail & Deliverables Inspection */}
      {activeMilestoneForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveMilestoneForModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-950 border border-slate-800 text-cyan-400">
                  {activeMilestoneForModal.phase}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Quote #{activeMilestoneForModal.quotationNumber}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{activeMilestoneForModal.title}</h3>
              <p className="text-xs text-slate-400">{activeMilestoneForModal.projectName}</p>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              {activeMilestoneForModal.description}
            </p>

            {/* Target & Lead Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Completion</span>
                <span className="text-sm font-extrabold font-mono text-cyan-400">
                  {activeMilestoneForModal.targetDate}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Technical Lead</span>
                <span className="text-xs font-semibold text-slate-200">
                  {activeMilestoneForModal.assignedLead || 'TechSoftware Team'}
                </span>
              </div>
            </div>

            {/* Payment Milestone if applicable */}
            {activeMilestoneForModal.paymentMilestone && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold block">Payment Contract Milestone:</span>
                  <span className="text-[11px] text-amber-200">{activeMilestoneForModal.paymentMilestone}</span>
                </div>
              </div>
            )}

            {/* Deliverables Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Deliverables & Acceptance Criteria:
              </span>
              <div className="space-y-1.5">
                {activeMilestoneForModal.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        activeMilestoneForModal.status === 'completed'
                          ? 'text-emerald-400'
                          : 'text-cyan-400'
                      }`}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone Status Switcher */}
            {onUpdateMilestoneStatus && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Update Progress Status:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onUpdateMilestoneStatus(activeMilestoneForModal.id, 'completed');
                      setActiveMilestoneForModal({ ...activeMilestoneForModal, status: 'completed' });
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      activeMilestoneForModal.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Completed
                  </button>

                  <button
                    onClick={() => {
                      onUpdateMilestoneStatus(activeMilestoneForModal.id, 'in_progress');
                      setActiveMilestoneForModal({ ...activeMilestoneForModal, status: 'in_progress' });
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      activeMilestoneForModal.status === 'in_progress'
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    onClick={() => {
                      onUpdateMilestoneStatus(activeMilestoneForModal.id, 'upcoming');
                      setActiveMilestoneForModal({ ...activeMilestoneForModal, status: 'upcoming' });
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      activeMilestoneForModal.status === 'upcoming'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Scheduled
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <a
                href={generateGoogleCalendarUrl(activeMilestoneForModal)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Add to Google Calendar</span>
              </a>

              <button
                onClick={() => exportMilestonesToICS([activeMilestoneForModal], `${activeMilestoneForModal.title}.ics`)}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Download .ics file"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>.ICS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Custom Checkpoint / Milestone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Project Milestone / Meeting Checkpoint</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set a custom deadline, design review call, or sprint goal for this project.
              </p>
            </div>

            <form onSubmit={handleSaveCustomMilestone} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Milestone / Checkpoint Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Approval Meeting with CEO"
                  value={newMilestoneForm.title}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Related Quotation *
                  </label>
                  <select
                    value={newMilestoneForm.quotationNumber}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, quotationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {activeQuotations.map((q) => (
                      <option key={q.id} value={q.quotationNumber} className="bg-slate-900">
                        {q.quotationNumber} ({q.customer.companyName || q.customer.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Target Deadline Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMilestoneForm.targetDate}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Project Phase
                  </label>
                  <select
                    value={newMilestoneForm.phase}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, phase: e.target.value as MilestonePhase })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Kickoff & Advance">Kickoff & Advance</option>
                    <option value="Wireframe & Architecture">Wireframe & Architecture</option>
                    <option value="Sprint 1 Development">Sprint 1 Development</option>
                    <option value="Sprint 2 Core Features">Sprint 2 Core Features</option>
                    <option value="QA Testing & Security">QA Testing & Security</option>
                    <option value="UAT & Client Demo">UAT & Client Demo</option>
                    <option value="Production Launch">Production Launch</option>
                    <option value="Warranty & AMC">Warranty & AMC</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Payment Milestone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50% Advance Trigger"
                    value={newMilestoneForm.paymentMilestone}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, paymentMilestone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Key expectations or review agenda for this milestone..."
                  value={newMilestoneForm.description}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Deliverable 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Figma Prototype Sign-off"
                    value={newMilestoneForm.deliverable1}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, deliverable1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Deliverable 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Staging Server Walkthrough"
                    value={newMilestoneForm.deliverable2}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, deliverable2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
