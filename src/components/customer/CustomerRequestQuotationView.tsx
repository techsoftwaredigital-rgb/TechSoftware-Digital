import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Layers,
  IndianRupee,
  Calendar,
  FileText,
  Building,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { QuotationRequest, ServiceItem, UserAccount } from '../../types';

interface CustomerRequestQuotationViewProps {
  currentUser?: UserAccount | null;
  services: ServiceItem[];
  onSubmitRequest: (request: QuotationRequest) => Promise<void>;
  onNavigateToMyQuotations: () => void;
}

const BUDGET_PRESETS = [
  '₹15,000 - ₹30,000',
  '₹35,000 - ₹75,000',
  '₹1,00,000 - ₹1,50,000',
  '₹2,00,000 - ₹5,00,000',
  '₹5,00,000+'
];

const TIMELINE_PRESETS = [
  '1-2 Weeks (Urgent)',
  '3-4 Weeks (Standard)',
  '2-3 Months (Custom ERP / App)',
  'Flexible / Continuous'
];

export const CustomerRequestQuotationView: React.FC<CustomerRequestQuotationViewProps> = ({
  currentUser,
  services,
  onSubmitRequest,
  onNavigateToMyQuotations
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [selectedService, setSelectedService] = useState(
    services[0]?.name || 'Custom Web Application'
  );
  const [selectedCategory, setSelectedCategory] = useState(
    services[0]?.category || 'Web Application'
  );
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('₹1,50,000');
  const [projectTimeline, setProjectTimeline] = useState('3-4 Weeks (Standard)');
  const [filesInfo, setFilesInfo] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceChange = (serviceName: string) => {
    setSelectedService(serviceName);
    const matched = services.find((s) => s.name === serviceName);
    if (matched) {
      setSelectedCategory(matched.category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Name and Email are required.');
      return;
    }
    if (!requirements.trim()) {
      setError('Please provide your project requirements or feature list.');
      return;
    }

    setSubmitting(true);
    try {
      const newRequest: QuotationRequest = {
        id: `req-${Date.now()}`,
        customerId: currentUser?.uid || `guest-${Date.now()}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        companyName: companyName.trim() || undefined,
        service: selectedService,
        category: selectedCategory,
        requirements: requirements.trim(),
        budget: budget.trim(),
        projectTimeline,
        filesInfo: filesInfo.trim() || undefined,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSubmitRequest(newRequest);
      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitting(false);
      setError(err?.message || 'Failed to submit request. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Quotation Request Received!</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-white">{customerName}</strong>. Your request for{' '}
            <strong className="text-cyan-400">{selectedService}</strong> (Budget: {budget}) has been
            synced to our developer team in real-time.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 max-w-md mx-auto">
          <p className="text-slate-400">
            <strong className="text-slate-200">Assigned Desk:</strong> TechSoftware.digital Technical Solutions
          </p>
          <p className="text-slate-400">
            <strong className="text-slate-200">Current Status:</strong>{' '}
            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
              Pending Developer Review
            </span>
          </p>
          <p className="text-slate-400">
            <strong className="text-slate-200">Next Step:</strong> Our team will review requirements and generate your formal quotation with itemized breakdown.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={onNavigateToMyQuotations}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/25"
          >
            Track in My Quotations
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Quotation Request</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Submit Your Software Requirements
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Share your idea, features, and target budget. Our technical architects will draft a formal, itemized quotation with transparent pricing and milestone breakdown.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
        {/* Section 1: Customer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>1. Contact & Organization Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Your Full Name / POC *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Company / Project Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. ABC Hotel & Resorts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Official Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@abchotel.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Phone / WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 9820011223"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Service & Requirement */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>2. Project Scope & Features</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Primary Service Required *
              </label>
              <select
                value={selectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    [{service.category}] {service.name} (Suggested: ₹{service.suggestedQuote.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Target Timeline
              </label>
              <select
                value={projectTimeline}
                onChange={(e) => setProjectTimeline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {TIMELINE_PRESETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Detailed Requirements & Key Modules *
            </label>
            <textarea
              rows={4}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. Hotel Management Software with:&#10;1. Room Booking & Front Desk&#10;2. Billing & GST Invoicing&#10;3. Restaurant POS & Inventory&#10;4. Expense Tracking & Financial Reports&#10;5. WhatsApp notifications to guests"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Section 3: Estimated Budget */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <IndianRupee className="w-4 h-4 text-cyan-400" />
            <span>3. Estimated Budget & Quick Chips</span>
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Your Budget Allocation (INR)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹1,50,000"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {BUDGET_PRESETS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setBudget(chip)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      budget === chip
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Reference Links / Figma / Google Drive Info (Optional)
            </label>
            <input
              type="text"
              value={filesInfo}
              onChange={(e) => setFilesInfo(e.target.value)}
              placeholder="e.g. Reference site: https://sample.com or Google Drive link for wireframes"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting to Developer Team...' : 'Submit Quotation Request'}</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            ⚡ Automatically synchronizes to the Developer/Admin Panel in Firebase Firestore.
          </p>
        </div>
      </form>
    </div>
  );
};
