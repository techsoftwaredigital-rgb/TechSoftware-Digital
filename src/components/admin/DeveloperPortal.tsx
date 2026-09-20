import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  CreditCard,
  Settings,
  Plus,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  Bell,
  Send,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Layers
} from 'lucide-react';
import {
  ServiceItem,
  Quotation,
  StaffMember,
  PaymentRecord,
  CompanyInfo,
  AppNotification,
  ServiceCategory
} from '../../types';

interface DeveloperPortalProps {
  services: ServiceItem[];
  onUpdateService: (updatedService: ServiceItem) => void;
  onAddService: (newService: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  quotations: Quotation[];
  onUpdateQuotationStatus: (id: string, status: Quotation['status'], staffId?: string) => void;
  onViewQuotation: (quotation: Quotation) => void;
  staff: StaffMember[];
  onAddStaff: (newStaff: StaffMember) => void;
  payments: PaymentRecord[];
  onAddPayment: (newPayment: PaymentRecord) => void;
  onBroadcastPush: (title: string, message: string, type: AppNotification['type']) => void;
  companyInfo: CompanyInfo;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  services,
  onUpdateService,
  onAddService,
  onDeleteService,
  quotations,
  onUpdateQuotationStatus,
  onViewQuotation,
  staff,
  onAddStaff,
  payments,
  onAddPayment,
  onBroadcastPush,
  companyInfo
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'rate-card' | 'staff' | 'payments' | 'broadcast'>('overview');

  // Rate Card search & filter
  const [rateCardSearch, setRateCardSearch] = useState('');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // New Service form state
  const [newService, setNewService] = useState<Partial<ServiceItem>>({
    name: '',
    category: 'Website',
    description: '',
    marketMin: 10000,
    marketMax: 30000,
    suggestedQuote: 19999,
    defaultQty: 1,
    discountPercent: 0,
    gstPercent: 18,
    isActive: true,
    featured: false
  });

  // Quotes search
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('All');

  // Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
    name: '',
    role: 'Full-Stack Developer',
    email: '',
    phone: '',
    specialty: ['React', 'Node.js'],
    activeProjectsCount: 0,
    avatarColor: 'from-cyan-500 to-blue-600'
  });

  // Payment Record Modal
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<PaymentRecord>>({
    quotationNumber: '',
    customerName: '',
    amount: 0,
    type: 'Advance (50%)',
    paymentMode: 'UPI',
    transactionReference: '',
    status: 'Completed',
    notes: 'Advance received via UPI'
  });

  // Push Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<AppNotification['type']>('system');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Computed metrics
  const totalQuotedVolume = quotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const totalAdvanceCollected = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPendingBalance = Math.max(0, totalQuotedVolume - totalAdvanceCollected);
  const activeBookedProjects = quotations.filter(q => q.status !== 'Draft' && q.status !== 'Cancelled').length;

  const handleSaveServiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    onUpdateService(editingService);
    setEditingService(null);
    onBroadcastPush(
      'Rate Card Updated',
      `Service "${editingService.name}" updated to ₹${editingService.suggestedQuote.toLocaleString('en-IN')}.`,
      'service'
    );
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.suggestedQuote) return;
    const created: ServiceItem = {
      id: `custom-${Date.now()}`,
      category: (newService.category as ServiceCategory) || 'Website',
      name: newService.name,
      description: newService.description || '',
      marketMin: Number(newService.marketMin) || 5000,
      marketMax: Number(newService.marketMax) || 25000,
      suggestedQuote: Number(newService.suggestedQuote) || 15000,
      defaultQty: 1,
      discountPercent: Number(newService.discountPercent) || 0,
      gstPercent: Number(newService.gstPercent) || 18,
      isActive: true,
      featured: Boolean(newService.featured)
    };
    onAddService(created);
    setShowAddServiceModal(false);
    setNewService({
      name: '',
      category: 'Website',
      description: '',
      marketMin: 10000,
      marketMax: 30000,
      suggestedQuote: 19999,
      defaultQty: 1,
      discountPercent: 0,
      gstPercent: 18,
      isActive: true,
      featured: false
    });
    onBroadcastPush(
      'New Service Added to Rate Card',
      `"${created.name}" is now live on the Customer Portal at ₹${created.suggestedQuote.toLocaleString('en-IN')}.`,
      'service'
    );
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    const staffItem: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      role: newStaff.role || 'Developer',
      email: newStaff.email,
      phone: newStaff.phone || '+91 9800000000',
      specialty: typeof newStaff.specialty === 'string' ? (newStaff.specialty as string).split(',').map(s => s.trim()) : ['Full-Stack'],
      activeProjectsCount: 0,
      avatarColor: 'from-cyan-500 to-indigo-600'
    };
    onAddStaff(staffItem);
    setShowAddStaffModal(false);
    setNewStaff({
      name: '',
      role: 'Full-Stack Developer',
      email: '',
      phone: '',
      specialty: ['React', 'Node.js']
    });
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || !newPayment.customerName) return;
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      quotationId: newPayment.quotationId || 'manual',
      quotationNumber: newPayment.quotationNumber || 'TSD-MANUAL',
      customerName: newPayment.customerName,
      amount: Number(newPayment.amount),
      type: newPayment.type || 'Advance (50%)',
      paymentMode: newPayment.paymentMode || 'UPI',
      transactionReference: newPayment.transactionReference || `TXN${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: (newPayment.status as any) || 'Completed',
      notes: newPayment.notes || ''
    };
    onAddPayment(record);
    setShowAddPaymentModal(false);
    onBroadcastPush(
      'Payment Recorded',
      `₹${record.amount.toLocaleString('en-IN')} received from ${record.customerName} via ${record.paymentMode}.`,
      'payment'
    );
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    onBroadcastPush(broadcastTitle, broadcastMessage, broadcastType);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar for Developer / Admin Portal */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'quotes'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Client Quotes & CRM</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {quotations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rate-card')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'rate-card'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Rate Card Manager (Live)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/50">
              {services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'staff'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Dev Team & Staff</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
              {staff.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>50% Advance & Payments</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Push Broadcast</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2 px-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Admin Mode Active</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Quoted Business
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                ₹{totalQuotedVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Across {quotations.length} active client quotes</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-800/40 shadow-xl">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                50% Advance Received
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                ₹{totalAdvanceCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Realized in Bank & UPI</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-800/40 shadow-xl">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                Pending Balance (Milestones)
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                ₹{totalPendingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Due upon release / deployment</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-800/40 shadow-xl">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                Active Tech Services & Staff
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {services.filter(s => s.isActive).length} Modules
                </span>
                <span className="text-xs font-bold text-indigo-300">
                  {staff.length} Devs
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Website, Mobile, SaaS & AI</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings Activity (2 Cols) */}
            <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Recent Customer Quotations & Milestones</span>
                </h3>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  View All ({quotations.length})
                </button>
              </div>

              <div className="divide-y divide-slate-800/70">
                {quotations.slice(0, 4).map((quote) => (
                  <div key={quote.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{quote.customer.name}</span>
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/50">
                          {quote.quotationNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            quote.status === 'Advance Received'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : quote.status === 'Booked'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {quote.items.map(i => i.name).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-white block">
                        ₹{quote.grandTotal.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => onViewQuotation(quote)}
                        className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                      >
                        <span>View Invoice</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Admin Controls (1 Col) */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Quick Operations</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>Add New Service to Rate Card</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Record 50% Advance Payment</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Add Developer / Staff</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Push Notification to Clients</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Company Info Box */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p><strong>Brand:</strong> {companyInfo.name}</p>
                <p><strong>Direct Line:</strong> {companyInfo.phone}</p>
                <p><strong>Official Email:</strong> {companyInfo.email}</p>
                <p><strong>Terms Enforced:</strong> 50% Advance & Non-Refundable</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT QUOTATIONS & CRM */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                placeholder="Search by client name, quote ID, phone, or company..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={quoteStatusFilter}
                onChange={(e) => setQuoteStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Booked">Booked</option>
                <option value="Advance Received">Advance Received</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Quotations List */}
          <div className="space-y-3">
            {quotations
              .filter((q) => {
                if (quoteStatusFilter !== 'All' && q.status !== quoteStatusFilter) return false;
                if (!quoteSearch.trim()) return true;
                const query = quoteSearch.toLowerCase();
                return (
                  q.quotationNumber.toLowerCase().includes(query) ||
                  q.customer.name.toLowerCase().includes(query) ||
                  q.customer.phone.includes(query) ||
                  q.customer.email.toLowerCase().includes(query) ||
                  (q.customer.companyName && q.customer.companyName.toLowerCase().includes(query))
                );
              })
              .map((quote) => (
                <div
                  key={quote.id}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          {quote.customer.name}
                        </h4>
                        {quote.customer.companyName && (
                          <span className="text-xs text-slate-400 font-medium">
                            ({quote.customer.companyName})
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                          {quote.quotationNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {quote.customer.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-cyan-400" />
                          {quote.customer.email}
                        </span>
                      </div>
                    </div>

                    {/* Status & Developer Assignment Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={quote.status}
                        onChange={(e) => onUpdateQuotationStatus(quote.id, e.target.value as any, quote.assignedStaffId)}
                        className="bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Booked">Booked</option>
                        <option value="Advance Received">Advance Received</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <select
                        value={quote.assignedStaffId || ''}
                        onChange={(e) => onUpdateQuotationStatus(quote.id, quote.status, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="">Assign Tech Staff</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role.split(' ')[0]})</option>
                        ))}
                      </select>

                      <button
                        onClick={() => onViewQuotation(quote)}
                        className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Scope & Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-medium block mb-1">Services Included:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {quote.items.map((i, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-950 text-slate-300 px-2 py-1 rounded-md border border-slate-800 text-[11px]"
                          >
                            {i.name} (x{i.qty})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Grand Total:</span>
                        <span className="font-bold text-white">₹{quote.grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-amber-400 font-bold">
                        <span>50% Advance:</span>
                        <span>₹{quote.advancePayable50.toLocaleString('en-IN')}</span>
                      </div>
                      {quote.amcOption && quote.amcOption !== 'none' && (
                        <div className="flex justify-between text-cyan-300 text-[11px]">
                          <span>AMC Plan:</span>
                          <span className="font-semibold uppercase">
                            {quote.amcDetails?.tierName || quote.amcOption} (₹{quote.amcAmount.toLocaleString('en-IN')})
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>Assigned Dev:</span>
                        <span className="text-cyan-300">{quote.assignedStaffName || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: RATE CARD MANAGER (User prompt: "customer portel edit kr ne ka access rahega service price all ke liye") */}
      {activeTab === 'rate-card' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Live Development Rate Card Editor</span>
              </h3>
              <p className="text-xs text-slate-400">
                Any updates to prices or market ranges instantly reflect on the Customer Portal quotation tool.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rateCardSearch}
                  onChange={(e) => setRateCardSearch(e.target.value)}
                  placeholder="Filter service..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setShowAddServiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* Services Edit Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Service Name</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2 text-right">Market Min (₹)</th>
                    <th className="py-3 px-2 text-right">Market Max (₹)</th>
                    <th className="py-3 px-2 text-right text-cyan-300">Suggested Quote (₹)</th>
                    <th className="py-3 px-2 text-right">GST %</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {services
                    .filter(s => {
                      if (!rateCardSearch.trim()) return true;
                      const q = rateCardSearch.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
                    })
                    .map((service) => (
                      <tr key={service.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-200 block">{service.name}</span>
                          <span className="text-[11px] text-slate-400 line-clamp-1">{service.description}</span>
                        </td>

                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium">
                            {service.category}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right font-medium text-slate-400">
                          ₹{service.marketMin.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-2 text-right font-medium text-slate-400">
                          ₹{service.marketMax.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-2 text-right font-black text-cyan-400">
                          ₹{service.suggestedQuote.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-2 text-right text-slate-400">
                          {service.gstPercent}%
                        </td>

                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              service.isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setEditingService({ ...service })}
                            className="p-1.5 text-cyan-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Service Price & Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Tech Team, Leads & Project Engineers</span>
              </h3>
              <p className="text-xs text-slate-400">
                Staff members assigned to active client bookings and development modules.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center font-bold text-white text-base shadow-md`}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{member.name}</h4>
                    <p className="text-[11px] text-cyan-400 font-medium">{member.role}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{member.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{member.phone}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                    Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {member.specialty.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS & 50% ADVANCE TRACKER */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>50% Advance & Milestone Collections</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track corporate bank deposits, UPI transfers, and payment transaction references.
              </p>
            </div>

            <button
              onClick={() => setShowAddPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Payment</span>
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Client & Quote</th>
                    <th className="py-3 px-2">Stage</th>
                    <th className="py-3 px-2">Payment Mode</th>
                    <th className="py-3 px-3">Txn Reference</th>
                    <th className="py-3 px-3 text-right">Amount (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-slate-400 font-mono">{p.date}</td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-200 block">{p.customerName}</strong>
                        <span className="text-[10px] text-cyan-400 font-mono">{p.quotationNumber}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[10px] font-bold">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-medium">{p.paymentMode}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{p.transactionReference}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PUSH BROADCAST & UPDATES (Prompt requirement: "plus push notifications for updates") */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Bell className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Push Notification & Client Update Center
              </h3>
              <p className="text-xs text-slate-400">
                Broadcast instant push alerts to clients, team members, and the customer portal.
              </p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Notification successfully dispatched and triggered!</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Notification Headline / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Festival Offer: 15% off on Mobile Apps | Rate Card Updated"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Notification Body Message <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write the update details that will appear on device push notifications and top notification bell..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Alert Category</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value="system">System Announcement</option>
                  <option value="quote">Quotation Update</option>
                  <option value="payment">Payment Alert</option>
                  <option value="service">Service & Rate Card Change</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Audience</label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none">
                  <option>All Clients & Dev Team (Global)</option>
                  <option>Active Clients Only</option>
                  <option>Internal Developers</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Push Notification Now</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Edit Service Price & Scope */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/60 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>Edit Service Price & Details</span>
              </h4>
              <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Market Min (₹)</label>
                  <input
                    type="number"
                    value={editingService.marketMin}
                    onChange={(e) => setEditingService({ ...editingService, marketMin: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Market Max (₹)</label>
                  <input
                    type="number"
                    value={editingService.marketMax}
                    onChange={(e) => setEditingService({ ...editingService, marketMax: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cyan-400 mb-1">Suggested (₹)</label>
                  <input
                    type="number"
                    value={editingService.suggestedQuote}
                    onChange={(e) => setEditingService({ ...editingService, suggestedQuote: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/80 text-cyan-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.isActive}
                    onChange={(e) => setEditingService({ ...editingService, isActive: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                  />
                  <span>Active in Customer Portal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.featured}
                    onChange={(e) => setEditingService({ ...editingService, featured: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                  />
                  <span>High Demand / Featured</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs"
                >
                  Save & Update Rate Card
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Service to Rate Card */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/60 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Add New Service to Rate Card</span>
              </h4>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Service / Module Name *</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g. AI Video Voiceover Generator"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="Website">Website</option>
                  <option value="Web Application">Web Application</option>
                  <option value="Business Software">Business Software</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Web Invitation">Web Invitation</option>
                  <option value="AI">AI</option>
                  <option value="Development Add-on">Development Add-on</option>
                  <option value="Hosting">Hosting</option>
                  <option value="Play Store / App Store">Play Store / App Store</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Security">Security</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Technical scope and features provided..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Market Min (₹)</label>
                  <input
                    type="number"
                    value={newService.marketMin}
                    onChange={(e) => setNewService({ ...newService, marketMin: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Market Max (₹)</label>
                  <input
                    type="number"
                    value={newService.marketMax}
                    onChange={(e) => setNewService({ ...newService, marketMax: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cyan-400 mb-1">Suggested (₹) *</label>
                  <input
                    type="number"
                    value={newService.suggestedQuote}
                    onChange={(e) => setNewService({ ...newService, suggestedQuote: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/80 text-cyan-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs"
                >
                  Publish Service to Customer Portal
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/60 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Record Advance / Milestone Payment</span>
              </h4>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer / Project Name *</label>
                <input
                  type="text"
                  value={newPayment.customerName}
                  onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                  placeholder="e.g. Vikram Singhania (Apex Retail)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quotation ID</label>
                  <input
                    type="text"
                    value={newPayment.quotationNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, quotationNumber: e.target.value })}
                    placeholder="TSD-2026-1001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={newPayment.amount || ''}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/80 text-emerald-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Stage</label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    <option value="Advance (50%)">Advance (50%)</option>
                    <option value="Milestone 2">Milestone 2</option>
                    <option value="Final Balance">Final Balance</option>
                    <option value="AMC Annual">AMC Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={newPayment.paymentMode}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    <option value="UPI">UPI</option>
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Razorpay">Razorpay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Transaction Ref / UTR</label>
                <input
                  type="text"
                  value={newPayment.transactionReference}
                  onChange={(e) => setNewPayment({ ...newPayment, transactionReference: e.target.value })}
                  placeholder="e.g. UPI/394820194829"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs"
                >
                  Save Payment & Update CRM
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/60 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Add Tech Team Member</span>
              </h4>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Karan Patel"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Technical Role</label>
                <input
                  type="text"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="e.g. Flutter Mobile Specialist"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="karan@techsoftware.digital"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  placeholder="Flutter, Android, iOS, Firebase"
                  onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs"
                >
                  Add Team Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
