import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  User,
  Building,
  Mail,
  Phone,
  IndianRupee,
  Layers,
  ArrowRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { QuotationRequest } from '../../types';

interface QuotationRequestsTabProps {
  requests: QuotationRequest[];
  onUpdateStatus: (id: string, status: QuotationRequest['status']) => void;
  onConvertRequestToQuotation: (request: QuotationRequest) => void;
}

export const QuotationRequestsTab: React.FC<QuotationRequestsTabProps> = ({
  requests,
  onUpdateStatus,
  onConvertRequestToQuotation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Incoming Customer Quotation Requests</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                {pendingCount} New Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real-time requests submitted by clients from the Customer Portal via Firestore.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client or service..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests Grid / List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Quotation Requests Found</h4>
          <p className="text-xs text-slate-500">
            When customers submit project requirements on the customer portal, they will instantly appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>{req.customerName}</span>
                    </h3>
                    {req.companyName && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>({req.companyName})</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        req.status === 'Pending'
                          ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                          : req.status === 'Under Review'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          : req.status === 'Quotation Sent'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>{req.customerEmail}</span>
                    </span>
                    {req.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{req.customerPhone}</span>
                      </span>
                    )}
                    <span>Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Budget & timeline highlight */}
                <div className="sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Client Budget:</span>
                  <span className="text-base font-black text-cyan-400">{req.budget}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Timeline: {req.projectTimeline || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Service & Requirements Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-bold text-[11px]">
                    {req.service}
                  </span>
                  {req.category && (
                    <span className="text-[11px] text-slate-400">Category: {req.category}</span>
                  )}
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Project Requirements:
                  </span>
                  <p className="text-slate-200 whitespace-pre-line text-xs leading-relaxed">
                    {req.requirements}
                  </p>
                </div>

                {req.filesInfo && (
                  <p className="text-xs text-slate-400">
                    <strong>Reference Info / Links:</strong> {req.filesInfo}
                  </p>
                )}
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Update Status:</span>
                  <select
                    value={req.status}
                    onChange={(e) =>
                      onUpdateStatus(req.id, e.target.value as QuotationRequest['status'])
                    }
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => onConvertRequestToQuotation(req)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Itemized Quotation for Client</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
