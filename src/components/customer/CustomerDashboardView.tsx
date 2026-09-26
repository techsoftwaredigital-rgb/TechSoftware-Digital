import React from 'react';
import {
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Layers,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Send,
  User,
  Phone,
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { Quotation, QuotationRequest, Project, ChatMessage, UserAccount, CompanyInfo } from '../../types';

interface CustomerDashboardViewProps {
  currentUser?: UserAccount | null;
  quotations: Quotation[];
  quotationRequests: QuotationRequest[];
  projects: Project[];
  messages: ChatMessage[];
  companyInfo: CompanyInfo;
  onNavigateTab: (tab: 'services' | 'rateCard' | 'requestQuote' | 'myQuotes' | 'messages' | 'projects' | 'profile') => void;
  onViewQuotationModal: (quotation: Quotation) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  currentUser,
  quotations,
  quotationRequests,
  projects,
  messages,
  companyInfo,
  onNavigateTab,
  onViewQuotationModal
}) => {
  const pendingActionQuotes = quotations.filter(
    (q) => q.status === 'Quotation Sent' || q.status === 'Sent' || q.status === 'Booked'
  );
  const acceptedQuotes = quotations.filter(
    (q) => q.status === 'Customer Accepted' || q.status === 'Advance Received'
  );
  const activeProjects = projects.filter(
    (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/80 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/40 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Customer Portal & Project Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {currentUser?.displayName || 'Valued Client'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage your software proposals, request new application modules, monitor real-time sprint milestones, and collaborate directly with our engineering team.
            </p>

            {/* Quick badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                ✓ 50% Kickoff Advance Model
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                ⚡ Real-Time Firebase Sync
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                🛡️ Direct Architect Desk
              </span>
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={() => onNavigateTab('requestQuote')}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Request Quotation</span>
            </button>

            <button
              onClick={() => onNavigateTab('services')}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explore Services & Packages</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Quotations */}
        <div
          onClick={() => onNavigateTab('myQuotes')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Formal Quotes</span>
            <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{quotations.length}</div>
          <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 mt-1">
            <span>{pendingActionQuotes.length} awaiting decision</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Card 2: Submitted Requests */}
        <div
          onClick={() => onNavigateTab('myQuotes')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Submitted Requests</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{quotationRequests.length}</div>
          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-1">
            <span>Live in Firestore</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Card 3: Active Projects */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Projects</span>
            <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{activeProjects.length}</div>
          <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 mt-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Weekly AI Status Brief</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Card 4: Messages */}
        <div
          onClick={() => onNavigateTab('messages')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Direct Messages</span>
            <MessageCircle className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white">{messages.length}</div>
          <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 mt-1">
            <span>Open live chat</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>

      {/* Quick Launchpad Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('services')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
            1. Browse Services & Packages
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Websites, Web Apps, Android & iOS Apps, Invitations, Add-ons, and Cloud Hosting.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('rateCard')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
            2. Transparent Rate Card
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Market benchmarks, minimum/maximum estimates, and official suggested pricing.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('requestQuote')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
            3. Instant Requirement Submission
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Submit your software vision and budget to receive an itemized proposal.
          </p>
        </div>
      </div>

      {/* Recent Quotations Preview */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Recent Quotations & Proposals</h2>
            <p className="text-xs text-slate-400">
              Review and approve pending developer proposals with 50% kickoff advance.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('myQuotes')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All ({quotations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {quotations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No formal quotations issued yet. Submit your requirements to receive one!
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.slice(0, 3).map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{q.quotationNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'Customer Accepted'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : q.status === 'Customer Rejected'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {q.items.length} items • Issued {q.date}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-black text-cyan-400 block">
                      ₹{q.grandTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      50% Advance: ₹{q.advancePayable50.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => onViewQuotationModal(q)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors shrink-0"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
