import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Send,
  Building,
  User,
  ArrowRight,
  Search,
  X,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Quotation, QuotationRequest, UserAccount } from '../../types';

interface MyQuotationsViewProps {
  currentUser?: UserAccount | null;
  quotations: Quotation[];
  quotationRequests: QuotationRequest[];
  onAcceptQuotation: (quotationId: string) => Promise<void>;
  onRejectQuotation: (quotationId: string, reason?: string) => Promise<void>;
  onViewQuotationModal: (quotation: Quotation) => void;
  onNavigateToRequest: () => void;
}

export const MyQuotationsView: React.FC<MyQuotationsViewProps> = ({
  currentUser,
  quotations,
  quotationRequests,
  onAcceptQuotation,
  onRejectQuotation,
  onViewQuotationModal,
  onNavigateToRequest
}) => {
  const [activeTab, setActiveTab] = useState<'formal' | 'requests'>('formal');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter for current user if applicable
  const userQuotations = quotations.filter((q) => {
    if (!currentUser) return true;
    return (
      q.customer.email.toLowerCase() === currentUser.email.toLowerCase() ||
      q.customer.name.toLowerCase().includes(currentUser.displayName.toLowerCase())
    );
  });

  const userRequests = quotationRequests.filter((r) => {
    if (!currentUser) return true;
    return (
      r.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      r.customerId === currentUser.uid
    );
  });

  // Real-time filtered formal quotations (filters by quotation number, service name, or status)
  const filteredFormalQuotations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return userQuotations.filter((q) => {
      // 1. Status Filter Pills
      if (statusFilter !== 'All') {
        if (statusFilter === 'Action Required') {
          const isAction =
            q.status === 'Quotation Sent' ||
            q.status === 'Sent' ||
            q.status === 'Draft' ||
            q.status === 'Pending' ||
            q.status === 'Booked';
          if (!isAction) return false;
        } else if (statusFilter === 'Accepted') {
          const isAccepted =
            q.status === 'Customer Accepted' ||
            q.status === 'Advance Received' ||
            q.status === 'Completed';
          if (!isAccepted) return false;
        } else if (statusFilter === 'Rejected') {
          const isRejected =
            q.status === 'Customer Rejected' ||
            q.status === 'Cancelled';
          if (!isRejected) return false;
        } else if (statusFilter === 'Paid') {
          if (q.paymentStatus !== 'Paid') return false;
        }
      }

      // 2. Real-time Search by quotation number, service name, or status
      if (!query) return true;

      // Match quotation number
      const matchQuoteNumber =
        q.quotationNumber.toLowerCase().includes(query) ||
        q.id.toLowerCase().includes(query);

      // Match service name (from items list)
      const matchServiceName = q.items.some(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          item.serviceId.toLowerCase().includes(query)
      );

      // Match status
      const matchStatus =
        q.status.toLowerCase().includes(query) ||
        (q.paymentStatus && q.paymentStatus.toLowerCase().includes(query));

      return matchQuoteNumber || matchServiceName || matchStatus;
    });
  }, [userQuotations, searchQuery, statusFilter]);

  // Real-time filtered requests
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return userRequests;

    return userRequests.filter((r) => {
      const matchService = r.service.toLowerCase().includes(query);
      const matchCategory = (r.category || '').toLowerCase().includes(query);
      const matchStatus = r.status.toLowerCase().includes(query);
      const matchRequirements = r.requirements.toLowerCase().includes(query);
      return matchService || matchCategory || matchStatus || matchRequirements;
    });
  }, [userRequests, searchQuery]);

  const handleAccept = async (q: Quotation) => {
    setProcessingId(q.id);
    try {
      await onAcceptQuotation(q.id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (q: Quotation) => {
    const reason = window.prompt('Optional: Please let us know your reason for rejection or desired revision:');
    setProcessingId(q.id);
    try {
      await onRejectQuotation(q.id, reason || undefined);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      // 1. Accepted / Confirmed Statuses -> Vivid Green
      case 'Customer Accepted':
      case 'Advance Received':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 text-xs font-bold shadow-sm shadow-emerald-950/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Accepted</span>
          </span>
        );

      case 'Booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Booked</span>
          </span>
        );

      // 2. Rejected / Cancelled Statuses -> Vivid Red
      case 'Customer Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/60 text-xs font-bold shadow-sm shadow-rose-950/50">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Rejected</span>
          </span>
        );

      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/50 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Cancelled</span>
          </span>
        );

      // 3. Pending Action / Review Statuses -> Vivid Amber / Cyan Pulse
      case 'Quotation Sent':
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/60 text-xs font-bold shadow-sm shadow-amber-950/50 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Pending Decision</span>
          </span>
        );

      case 'Draft':
      case 'Pending':
      case 'Under Review':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{status || 'Pending'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quotation Tracking & Decision Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            My Quotations & Invoices
          </h1>
          <p className="text-xs text-slate-300">
            Review formal software proposals, check 50% advance terms, and directly Accept or Reject quotes.
          </p>
        </div>

        <button
          onClick={onNavigateToRequest}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Request New Quote</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('formal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'formal'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Formal Quotations ({userQuotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Submitted Requests ({userRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Formal Quotations */}
      {activeTab === 'formal' && (
        <div className="space-y-4">
          {userQuotations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Formal Quotations Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once our developer team drafts an itemized quote for your requirements, it will appear here for your review and approval.
              </p>
              <button
                onClick={onNavigateToRequest}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all"
              >
                Submit Project Requirements
              </button>
            </div>
          ) : (
            <>
              {/* Real-time Search & Status Filter Toolbar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {/* Search Bar Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search quotes by number (e.g. TSD-2026-1001), service name (e.g. Web, ERP), or status..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Clear search text"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 pl-1 pr-1 shrink-0">
                      <Filter className="w-3 h-3 text-cyan-400" />
                      Status:
                    </span>
                    {(['All', 'Action Required', 'Accepted', 'Rejected', 'Paid'] as const).map((tab) => {
                      const isSelected = statusFilter === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setStatusFilter(tab)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active search results indicators */}
                {(searchQuery || statusFilter !== 'All') && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-400 flex-wrap">
                      <span>
                        Showing <strong className="text-white">{filteredFormalQuotations.length}</strong> of{' '}
                        <strong className="text-slate-300">{userQuotations.length}</strong> quotes
                      </span>
                      {searchQuery && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono text-[10px]">
                          Keyword: "{searchQuery}"
                        </span>
                      )}
                      {statusFilter !== 'All' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                          Status: {statusFilter}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* No Results from Filter State */}
              {filteredFormalQuotations.length === 0 ? (
                <div className="p-10 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <Search className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-300">No Quotations Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No quotations matched your search
                    {searchQuery ? <span> for keyword <strong className="text-slate-300">"{searchQuery}"</strong></span> : ''}
                    {statusFilter !== 'All' ? <span> with status <strong className="text-slate-300">"{statusFilter}"</strong></span> : ''}.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Search & Show All Quotes</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredFormalQuotations.map((q) => {
                const canDecide =
                  q.status === 'Quotation Sent' ||
                  q.status === 'Sent' ||
                  q.status === 'Draft' ||
                  q.status === 'Pending' ||
                  q.status === 'Booked';

                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {q.quotationNumber.split('-')[1] || 'TSD'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">
                              {q.quotationNumber}
                            </h3>
                            {getStatusBadge(q.status)}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Issued: {q.date} • Valid until: {q.validUntil}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Highlight */}
                      <div className="sm:text-right">
                        <span className="text-[11px] text-slate-400 block">Total (Inc. 18% GST):</span>
                        <span className="text-lg font-black text-cyan-400">
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-amber-400 font-semibold block">
                          50% Kickoff Advance: ₹{q.advancePayable50.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Items summary */}
                    <div className="space-y-1.5 text-xs">
                      <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        Included Software Modules ({q.items.length}):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {q.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-200 font-medium truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] shrink-0">
                              ₹{item.finalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes & Terms */}
                    {q.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 italic">
                        <strong>Developer Note:</strong> {q.notes}
                      </p>
                    )}

                    {/* Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => onViewQuotationModal(q)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Full Breakdown / PDF</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {q.status === 'Customer Accepted' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepted - Project Kickoff In Progress</span>
                          </div>
                        )}

                        {q.status === 'Customer Rejected' && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-800/60">
                            <XCircle className="w-4 h-4" />
                            <span>Proposal Rejected</span>
                          </div>
                        )}

                        {canDecide && (
                          <>
                            <button
                              disabled={processingId === q.id}
                              onClick={() => handleReject(q)}
                              className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject / Revise</span>
                            </button>

                            <button
                              disabled={processingId === q.id}
                              onClick={() => handleAccept(q)}
                              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{processingId === q.id ? 'Syncing...' : 'Accept Quotation'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  )}

      {/* Tab 2: Submitted Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {userRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Pending Requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't submitted any custom project requests yet.
              </p>
              <button
                onClick={onNavigateToRequest}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all"
              >
                Submit Project Requirements
              </button>
            </div>
          ) : (
            <>
              {userRequests.length > 3 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search requests by service, category, or status..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Clear search text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Requests Found</h4>
                  <p className="text-xs text-slate-500">No requests match "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredRequests.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
                    >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{r.service}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                          {r.category || 'Software'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                          r.status.toLowerCase().includes('accept') || r.status.toLowerCase().includes('complet')
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-950/50'
                            : r.status.toLowerCase().includes('reject') || r.status.toLowerCase().includes('cancel')
                            ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-rose-950/50'
                            : 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-amber-950/50'
                        }`}
                      >
                        {r.status.toLowerCase().includes('accept') || r.status.toLowerCase().includes('complet') ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : r.status.toLowerCase().includes('reject') || r.status.toLowerCase().includes('cancel') ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{r.status}</span>
                      </span>
                      <span className="text-xs font-bold text-cyan-400">
                        Budget: {r.budget}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <p className="text-slate-400 font-bold text-[11px] uppercase">
                      Provided Requirements:
                    </p>
                    <p className="text-slate-200 whitespace-pre-line">{r.requirements}</p>
                  </div>

                  {r.filesInfo && (
                    <p className="text-slate-400 text-[11px]">
                      <strong>Reference Info:</strong> {r.filesInfo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )}
    </div>
  );
};
