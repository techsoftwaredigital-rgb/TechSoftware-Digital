import React, { useState, useMemo } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  FolderArchive,
  MessageCircle,
  FileCheck,
  Calendar,
  ExternalLink,
  Download,
  Plus,
  Edit3,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  Trash2,
  X,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Activity,
  CreditCard
} from 'lucide-react';

import {
  ClientProfile,
  ClientContactLog,
  ProjectFile,
  Quotation,
  CustomerDetails,
  ProjectMilestone,
  MilestoneStatus,
  PaymentStatus
} from '../../types';
import { ProjectCalendar } from './ProjectCalendar';
import { MilestoneProgressChart } from './MilestoneProgressChart';
import { ProjectHealthWidget } from './ProjectHealthWidget';
import { MilestonePaymentCalendar } from './MilestonePaymentCalendar';
import { deriveMilestonesFromQuotations } from '../../utils/milestoneGenerator';

interface ClientProfileSectionProps {
  clientProfile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
  quotations: Quotation[];
  contactLogs: ClientContactLog[];
  onAddContactLog: (log: Omit<ClientContactLog, 'id'>) => void;
  projectFiles: ProjectFile[];
  onAddProjectFile: (file: Omit<ProjectFile, 'id'>) => void;
  onDeleteProjectFile: (fileId: string) => void;
  onViewQuotation: (quotation: Quotation) => void;
  onReorderQuotation: (quotation: Quotation) => void;
  onNavigateToBuilder: () => void;
  customMilestones?: ProjectMilestone[];
  onAddCustomMilestone?: (milestone: ProjectMilestone) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: MilestoneStatus) => void;
  onUpdateMilestone?: (milestone: ProjectMilestone) => void;
}

export const ClientProfileSection: React.FC<ClientProfileSectionProps> = ({
  clientProfile,
  onUpdateProfile,
  quotations,
  contactLogs,
  onAddContactLog,
  projectFiles,
  onDeleteProjectFile,
  onAddProjectFile,
  onViewQuotation,
  onReorderQuotation,
  onNavigateToBuilder,
  customMilestones = [],
  onAddCustomMilestone,
  onUpdateMilestoneStatus,
  onUpdateMilestone
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'schedule' | 'health' | 'analytics' | 'quotes' | 'history' | 'files'>('calendar');
  const [overviewChartMode, setOverviewChartMode] = useState<'health' | 'completion'>('health');
  const [showProgressOverview, setShowProgressOverview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState<string>('All');
  const [quotePaymentFilter, setQuotePaymentFilter] = useState<'All' | PaymentStatus>('All');

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState<ClientProfile>({ ...clientProfile });

  const [newLogForm, setNewLogForm] = useState<{
    channel: ClientContactLog['channel'];
    summary: string;
    details: string;
    initiatedBy: ClientContactLog['initiatedBy'];
    status: ClientContactLog['status'];
    relatedQuoteNumber: string;
  }>({
    channel: 'WhatsApp',
    summary: '',
    details: '',
    initiatedBy: 'Client',
    status: 'Completed',
    relatedQuoteNumber: ''
  });

  const [newFileForm, setNewFileForm] = useState<{
    name: string;
    category: ProjectFile['category'];
    fileType: ProjectFile['fileType'];
    externalLink: string;
    size: string;
    description: string;
    quotationNumber: string;
  }>({
    name: '',
    category: 'Technical Specs',
    fileType: 'pdf',
    externalLink: '',
    size: '1.2 MB',
    description: '',
    quotationNumber: ''
  });

  // Filtered lists
  const filteredQuotations = quotations.filter((q) => {
    const qPayment = q.paymentStatus || 'Pending';
    if (quotePaymentFilter !== 'All' && qPayment !== quotePaymentFilter) {
      return false;
    }
    const query = searchQuery.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(query) ||
      q.customer.name.toLowerCase().includes(query) ||
      (q.customer.companyName && q.customer.companyName.toLowerCase().includes(query)) ||
      q.status.toLowerCase().includes(query) ||
      qPayment.toLowerCase().includes(query)
    );
  });

  const filteredLogs = contactLogs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.summary.toLowerCase().includes(query) ||
      log.channel.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      (log.relatedQuoteNumber && log.relatedQuoteNumber.toLowerCase().includes(query))
    );
  });

  const filteredFiles = projectFiles.filter((file) => {
    const matchesCategory =
      fileCategoryFilter === 'All' || file.category === fileCategoryFilter;
    const matchesQuery =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.quotationNumber && file.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  // Calculate stats
  const totalQuotesValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const totalAdvancePaid = quotations
    .filter((q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Advance Received' || q.status === 'Completed')
    .reduce((sum, q) => sum + q.advancePayable50, 0);
  const totalMilestonesCount = useMemo(
    () => deriveMilestonesFromQuotations(quotations, customMilestones).length,
    [quotations, customMilestones]
  );

  // Handle profile submit
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsEditProfileModalOpen(false);
  };

  // Handle add log submit
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogForm.summary.trim()) return;

    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    onAddContactLog({
      date: dateStr,
      channel: newLogForm.channel,
      summary: newLogForm.summary,
      details: newLogForm.details,
      initiatedBy: newLogForm.initiatedBy,
      status: newLogForm.status,
      relatedQuoteNumber: newLogForm.relatedQuoteNumber || undefined
    });

    setNewLogForm({
      channel: 'WhatsApp',
      summary: '',
      details: '',
      initiatedBy: 'Client',
      status: 'Completed',
      relatedQuoteNumber: ''
    });
    setIsAddLogModalOpen(false);
  };

  // Handle add file submit
  const handleSaveFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileForm.name.trim()) return;

    const today = new Date().toISOString().split('T')[0];

    onAddProjectFile({
      name: newFileForm.name,
      category: newFileForm.category,
      size: newFileForm.fileType === 'link' ? 'External Link' : newFileForm.size || '1.0 MB',
      uploadDate: today,
      fileType: newFileForm.fileType,
      externalLink: newFileForm.externalLink || undefined,
      description: newFileForm.description || undefined,
      quotationNumber: newFileForm.quotationNumber || undefined
    });

    setNewFileForm({
      name: '',
      category: 'Technical Specs',
      fileType: 'pdf',
      externalLink: '',
      size: '1.2 MB',
      description: '',
      quotationNumber: ''
    });
    setIsAddFileModalOpen(false);
  };

  return (
    <div id="client-profile-section" className="space-y-6">
      {/* Top Client Profile Banner & Identity Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar & Personal Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-md shadow-cyan-600/20 shrink-0 border border-white/20">
              {clientProfile.name
                ? clientProfile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'CL'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {clientProfile.name || 'Valued Client'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{clientProfile.clientTier}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-cyan-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{clientProfile.companyName || 'Registered Enterprise Client'}</span>
              </p>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{clientProfile.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{clientProfile.phone}</span>
                </span>
                {clientProfile.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{clientProfile.address}</span>
                  </span>
                )}
                {clientProfile.gstin && (
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    GSTIN: {clientProfile.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <button
              type="button"
              id="edit-client-profile-btn"
              onClick={() => {
                setProfileForm({ ...clientProfile });
                setIsEditProfileModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              id="new-quote-from-profile-btn"
              onClick={onNavigateToBuilder}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <FileCheck className="w-3.5 h-3.5 fill-current" />
              <span>Create New Quote</span>
            </button>

            <a
              href={`https://wa.me/918169401877?text=Hi%20TechSoftware.digital%20team,%20this%20is%20${encodeURIComponent(
                clientProfile.name
              )}%20from%20${encodeURIComponent(
                clientProfile.companyName || 'our team'
              )}. Following up on our project.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>Direct WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 5 Key Engagement Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-200">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">Total Quotations</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{quotations.length}</span>
              <FileText className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-[10px] text-slate-500">Estimates generated</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">50% Advance Realized</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg sm:text-xl font-black text-amber-600 font-mono">
                ₹{totalAdvancePaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-500">Sprint kickoff realized</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">Communication Touchpoints</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-emerald-600 font-mono">
                {contactLogs.length}
              </span>
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-500">Logs & consultations</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">Project Deliverables & Files</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-indigo-600 font-mono">
                {projectFiles.length}
              </span>
              <FolderArchive className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[10px] text-slate-500">Documents & links stored</span>
          </div>

          {/* Project Health Quick Card */}
          <div
            onClick={() => setActiveTab('health')}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium block">Project Health</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Area Chart</span>
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-500">Predicted vs actual timelines</span>
          </div>
        </div>
      </div>

      {/* Engagement Tracking Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            id="tab-milestones-and-payments"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Milestones & Payment Due Dates</span>
          </button>

          <button
            type="button"
            id="tab-project-health"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Project Health (Area Chart)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            type="button"
            id="tab-project-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Gantt Chart & Milestones ({totalMilestonesCount})</span>
          </button>

          <button
            type="button"
            id="tab-milestone-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Completion % (Recharts)</span>
          </button>

          <button
            type="button"
            id="tab-previous-quotes"
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Previous Quotes ({quotations.length})</span>
          </button>

          <button
            type="button"
            id="tab-contact-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Contact History ({contactLogs.length})</span>
          </button>

          <button
            type="button"
            id="tab-project-files"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Project Files & Vault ({projectFiles.length})</span>
          </button>
        </div>

        {/* Global Search within Profile */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${
              activeTab === 'quotes'
                ? 'quotations...'
                : activeTab === 'history'
                ? 'interactions...'
                : 'documents & files...'
            }`}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB 0.3: NEW CALENDAR VIEW - UPCOMING PROJECT MILESTONES & PAYMENT DUE DATES */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <MilestonePaymentCalendar
            quotations={quotations}
            customMilestones={customMilestones}
            onSelectMilestone={(m) => {
              setActiveTab('calendar');
            }}
            onViewQuotation={onViewQuotation}
          />
        </div>
      )}

      {/* TAB 0.4: DEDICATED PROJECT HEALTH WIDGET (Predicted Timelines vs Actual Milestones with Red Delays) */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <ProjectHealthWidget
            quotations={quotations}
            customMilestones={customMilestones}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onSelectMilestone={(m) => {
              setActiveTab('calendar');
            }}
          />

          {/* Quick Jump Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="text-xs text-slate-600">
                Want to examine Gantt dependencies, date variance adjustments, or sprint deliverables?
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 ml-3 cursor-pointer"
              >
                Open Gantt Tracker
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="text-xs text-slate-600">
                Want to view the sprint velocity and completion percentage Recharts bar visualizer?
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all shrink-0 ml-3 cursor-pointer"
              >
                Open Completion %
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: PROJECT CALENDAR & MILESTONES (Derived from Booked Quotes) */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Quick Recharts Completion % & Project Health Visualizer Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setOverviewChartMode('health')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    overviewChartMode === 'health'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Project Health (Area Chart)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverviewChartMode('completion')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    overviewChartMode === 'completion'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Completion % (Velocity)</span>
                </button>
              </div>

              <button
                type="button"
                id="toggle-progress-overview-btn"
                onClick={() => setShowProgressOverview((prev) => !prev)}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showProgressOverview ? 'Hide Analytics Banner' : 'Show Analytics Banner'}
              </button>
            </div>
            {showProgressOverview && (
              <div className="p-4 sm:p-5">
                {overviewChartMode === 'health' ? (
                  <ProjectHealthWidget
                    quotations={quotations}
                    customMilestones={customMilestones}
                    onNavigateToCalendar={() => setActiveTab('calendar')}
                  />
                ) : (
                  <MilestoneProgressChart
                    quotations={quotations}
                    customMilestones={customMilestones}
                  />
                )}
              </div>
            )}
          </div>

          <ProjectCalendar
            quotations={quotations}
            customMilestones={customMilestones}
            onAddCustomMilestone={onAddCustomMilestone}
            onUpdateMilestoneStatus={onUpdateMilestoneStatus}
            onUpdateMilestone={onUpdateMilestone}
            onViewQuotation={onViewQuotation}
          />
        </div>
      )}

      {/* TAB 0.5: DEDICATED MILESTONE COMPLETION % VELOCITY (Recharts) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <MilestoneProgressChart
            quotations={quotations}
            customMilestones={customMilestones}
          />

          {/* Quick Jump to Calendar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="text-xs text-slate-600">
              Want to see individual sprint deliverables, date adjustments, or D3 Gantt dependency links?
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Open Gantt & Calendar View
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: Previous Quotes & Estimates */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <p>
              Review your historical quotations, payment status, 50% advance allocations, and download
              PDF invoices anytime.
            </p>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className="text-[11px] text-slate-500 font-semibold mr-0.5">Payment:</span>
              {(['All', 'Pending', 'Partial', 'Paid'] as const).map((filter) => {
                const count = filter === 'All' 
                  ? quotations.length 
                  : quotations.filter(q => (q.paymentStatus || 'Pending') === filter).length;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setQuotePaymentFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      quotePaymentFilter === filter
                        ? filter === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : filter === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-300'
                          : filter === 'Pending'
                          ? 'bg-rose-50 text-rose-700 border border-rose-300'
                          : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{filter}</span>
                    <span className="ml-1 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredQuotations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Quotations Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No quotations match the active search and payment filters. Generate a new quotation using the rate card!
              </p>
              <button
                type="button"
                onClick={onNavigateToBuilder}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Build New Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredQuotations.map((quote) => {
                const isBooked =
                  quote.status === 'Booked' ||
                  quote.status === 'Advance Received' ||
                  quote.status === 'In Progress' ||
                  quote.status === 'Completed';

                const pStatus = quote.paymentStatus || 'Pending';

                return (
                  <div
                    key={quote.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Quote Info */}
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-cyan-700">
                          {quote.quotationNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            quote.status === 'Booked' || quote.status === 'In Progress'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : quote.status === 'Advance Received'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {quote.status}
                        </span>

                        {/* Payment Status Indicator */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-2xs ${
                            pStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : pStatus === 'Partial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title={`Payment Status: ${pStatus}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              pStatus === 'Paid'
                                ? 'bg-emerald-500'
                                : pStatus === 'Partial'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>Payment: {pStatus}</span>
                        </span>

                        <span className="text-xs text-slate-500">• Issued: {quote.date}</span>
                        <span className="text-xs text-slate-500">
                          • Valid until: {quote.validUntil}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {quote.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                          >
                            {item.name} {item.qty > 1 && `(x${item.qty})`}
                          </span>
                        ))}
                        {quote.amcOption !== 'none' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold">
                            AMC {quote.amcDetails?.tierName || quote.amcOption}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        Delivery Timeline:{' '}
                        <strong className="text-slate-800">{quote.customer.projectTimeline}</strong>
                        {quote.customer.companyName && (
                          <span> • Client: {quote.customer.companyName}</span>
                        )}
                      </p>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-slate-500 block">Total Amount (Inc. GST)</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono block">
                          ₹{quote.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center md:justify-end gap-1.5 mt-0.5">
                          <span className="text-[11px] text-amber-700 font-semibold">
                            50% Advance: ₹{quote.advancePayable50.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wide border ${
                              pStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : pStatus === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {pStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewQuotation(quote)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="View formal printable quotation & PDF invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-600" />
                          <span>View Quote</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReorderQuotation(quote)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Load services into active Quotation Basket"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Re-quote</span>
                        </button>

                        <a
                          href={`https://wa.me/918169401877?text=Hi%20TechSoftware.digital,%20inquiring%20about%20Quotation%20${encodeURIComponent(
                            quote.quotationNumber
                          )}%20for%20${encodeURIComponent(clientProfile.name)}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors shadow-2xs"
                          title="Discuss this quote on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Contact & Communication History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <p>
              Timeline of technical consultations, WhatsApp dialogues, milestone notices, and
              inquiries logged with TechSoftware.digital.
            </p>
            <button
              type="button"
              id="log-new-contact-btn"
              onClick={() => setIsAddLogModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Message or Note</span>
            </button>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Contact History Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No interaction logs match your search. You can log an inquiry note or chat with our team
                on WhatsApp!
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map((log) => {
                const isWhatsApp = log.channel === 'WhatsApp';
                const isQuote = log.channel === 'Quotation';
                const isMeeting = log.channel === 'Meeting / Demo';

                return (
                  <div key={log.id} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isWhatsApp
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                          : isQuote
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-600'
                          : isMeeting
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      {isWhatsApp ? (
                        <MessageCircle className="w-3 h-3 fill-current" />
                      ) : isQuote ? (
                        <FileCheck className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>

                    {/* Timeline Item Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isWhatsApp
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isQuote
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {log.channel}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{log.summary}</span>
                          {log.relatedQuoteNumber && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                              Ref: {log.relatedQuoteNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono text-[11px]">{log.date}</span>
                          <span>•</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              log.initiatedBy === 'Client'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-cyan-50 text-cyan-800'
                            }`}
                          >
                            By {log.initiatedBy}
                          </span>
                        </div>
                      </div>

                      {log.details && (
                        <p className="text-xs text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-200">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Project Files & Deliverables Vault */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <p>
              Centralized vault storing your contracts, architectural blueprints, Figma prototypes,
              and payment receipts.
            </p>
            <button
              type="button"
              id="upload-file-btn"
              onClick={() => setIsAddFileModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Add File or Deliverable Link</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['All', 'Contract & SOW', 'Design & Wireframe', 'Technical Specs', 'Invoice & Receipt', 'Brand Asset'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFileCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    fileCategoryFilter === cat
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {filteredFiles.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Deliverables or Files Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No project files match your filter. You can upload or link project documentation,
                Figma URLs, or invoices!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFiles.map((file) => {
                const isLink = file.fileType === 'link';
                const isPdf = file.fileType === 'pdf';
                const isZip = file.fileType === 'zip';

                return (
                  <div
                    key={file.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-cyan-600 shrink-0">
                            {isLink ? (
                              <ExternalLink className="w-4 h-4 text-indigo-600" />
                            ) : isPdf ? (
                              <FileText className="w-4 h-4 text-rose-600" />
                            ) : isZip ? (
                              <FolderArchive className="w-4 h-4 text-amber-600" />
                            ) : (
                              <FileCode className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                              {file.name}
                            </h4>
                            <span className="text-[10px] text-cyan-700 font-medium">
                              {file.category}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteProjectFile(file.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remove file entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {file.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{file.description}</p>
                      )}

                      {file.quotationNumber && (
                        <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Linked Quote: {file.quotationNumber}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {file.size} • Uploaded {file.uploadDate}
                      </span>

                      {isLink && file.externalLink ? (
                        <a
                          href={file.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            // Trigger browser download or preview
                            const dummyContent = `TechSoftware.digital Deliverable Document\nFile: ${file.name}\nCategory: ${file.category}\nDate: ${file.uploadDate}\nDescription: ${file.description || 'Verified deliverables'}`;
                            const blob = new Blob([dummyContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.name.endsWith('.pdf') ? file.name : `${file.name}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-cyan-600" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Edit Profile Details */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                <span>Edit Client Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Office City / Location</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={profileForm.gstin || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log New Contact / Message */}
      {isAddLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-cyan-600" />
                <span>Log Contact Inquiry or Note</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Communication Channel</label>
                  <select
                    value={newLogForm.channel}
                    onChange={(e) =>
                      setNewLogForm({
                        ...newLogForm,
                        channel: e.target.value as ClientContactLog['channel']
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Meeting / Demo">Meeting / Demo</option>
                    <option value="Portal Note">Portal Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initiated By</label>
                  <select
                    value={newLogForm.initiatedBy}
                    onChange={(e) =>
                      setNewLogForm({
                        ...newLogForm,
                        initiatedBy: e.target.value as ClientContactLog['initiatedBy']
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  >
                    <option value="Client">Client</option>
                    <option value="TechSoftware.digital">TechSoftware.digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Topic / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquired about Payment Gateway and AMC options"
                  value={newLogForm.summary}
                  onChange={(e) => setNewLogForm({ ...newLogForm, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Related Quote Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TSD-2026-1001"
                  value={newLogForm.relatedQuoteNumber}
                  onChange={(e) => setNewLogForm({ ...newLogForm, relatedQuoteNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details / Meeting Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed points, deliverables discussed, or client feedback..."
                  value={newLogForm.details}
                  onChange={(e) => setNewLogForm({ ...newLogForm, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Upload File / Add Deliverable Link */}
      {isAddFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-600" />
                <span>Add Project Deliverable or Document</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document / Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master_Services_Agreement_and_SOW.pdf"
                  value={newFileForm.name}
                  onChange={(e) => setNewFileForm({ ...newFileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newFileForm.category}
                    onChange={(e) =>
                      setNewFileForm({
                        ...newFileForm,
                        category: e.target.value as ProjectFile['category']
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  >
                    <option value="Contract & SOW">Contract & SOW</option>
                    <option value="Technical Specs">Technical Specs</option>
                    <option value="Design & Wireframe">Design & Wireframe</option>
                    <option value="Invoice & Receipt">Invoice & Receipt</option>
                    <option value="Brand Asset">Brand Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Type</label>
                  <select
                    value={newFileForm.fileType}
                    onChange={(e) =>
                      setNewFileForm({
                        ...newFileForm,
                        fileType: e.target.value as ProjectFile['fileType']
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="link">External Link (Figma, Drive, Repo)</option>
                    <option value="zip">ZIP Archive</option>
                    <option value="image">Image / Graphic</option>
                    <option value="doc">Word / Text Doc</option>
                  </select>
                </div>
              </div>

              {newFileForm.fileType === 'link' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    External URL / Cloud Link <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://figma.com/... or https://drive.google.com/..."
                    value={newFileForm.externalLink}
                    onChange={(e) => setNewFileForm({ ...newFileForm, externalLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">File Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 2.4 MB"
                      value={newFileForm.size}
                      onChange={(e) => setNewFileForm({ ...newFileForm, size: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Linked Quote #</label>
                    <input
                      type="text"
                      placeholder="e.g. TSD-2026-1001"
                      value={newFileForm.quotationNumber}
                      onChange={(e) => setNewFileForm({ ...newFileForm, quotationNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Short note explaining this deliverable or specification document..."
                  value={newFileForm.description}
                  onChange={(e) => setNewFileForm({ ...newFileForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddFileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
