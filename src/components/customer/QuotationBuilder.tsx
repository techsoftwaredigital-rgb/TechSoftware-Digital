import React, { useState } from 'react';
import {
  Trash2,
  FileCheck,
  Percent,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Building,
  User,
  Mail,
  Phone,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  Calendar,
  Sparkles,
  Shield
} from 'lucide-react';
import {
  QuotationSelectedService,
  CustomerDetails,
  Quotation,
  AmcTier,
  AmcPlanDetails
} from '../../types';
import { AmcCalculator } from './AmcCalculator';
import { ProjectTimelineVisualizer } from './ProjectTimelineVisualizer';

interface QuotationBuilderProps {
  selectedServices: QuotationSelectedService[];
  defaultCustomer?: Partial<CustomerDetails>;
  onRemoveService: (serviceId: string) => void;
  onUpdateQty: (serviceId: string, qty: number) => void;
  onUpdateDiscount: (serviceId: string, discount: number) => void;
  onClearAll: () => void;
  onGenerateQuotation: (
    customer: CustomerDetails,
    amcOption: AmcTier,
    amcAmount: number,
    amcDetails?: AmcPlanDetails,
    calculatedGrandTotal?: number,
    calculatedAdvance50?: number
  ) => void;
  onQuickWhatsApp: (
    customer: CustomerDetails,
    amcDetails?: AmcPlanDetails,
    calculatedGrandTotal?: number,
    calculatedAdvance50?: number
  ) => void;
}

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  selectedServices,
  defaultCustomer,
  onRemoveService,
  onUpdateQty,
  onUpdateDiscount,
  onClearAll,
  onGenerateQuotation,
  onQuickWhatsApp
}) => {
  const [customer, setCustomer] = useState<CustomerDetails>(() => ({
    name: defaultCustomer?.name || '',
    email: defaultCustomer?.email || '',
    phone: defaultCustomer?.phone || '',
    companyName: defaultCustomer?.companyName || '',
    projectTimeline: defaultCustomer?.projectTimeline || '3-4 Weeks',
    projectRequirements: defaultCustomer?.projectRequirements || '',
    address: defaultCustomer?.address || ''
  }));

  const [amcPlanDetails, setAmcPlanDetails] = useState<AmcPlanDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculations
  const devTaxable = selectedServices.reduce((sum, item) => sum + item.taxableAmount, 0);
  const devGst = selectedServices.reduce((sum, item) => sum + item.gstAmount, 0);
  const devGrandTotal = devTaxable + devGst;

  // Appending AMC calculation if selected & active
  const isAmcAppended = Boolean(
    amcPlanDetails && amcPlanDetails.isAppendedToTotal && amcPlanDetails.totalAmount > 0
  );
  const amcTaxable = isAmcAppended ? (amcPlanDetails?.annualFee || 0) : 0;
  const amcGst = isAmcAppended ? (amcPlanDetails?.gstAmount || 0) : 0;
  const amcTotal = isAmcAppended ? (amcPlanDetails?.totalAmount || 0) : 0;

  // Combined Quotation Totals
  const subtotalTaxable = devTaxable + amcTaxable;
  const totalGst = devGst + amcGst;
  const grandTotal = devGrandTotal + amcTotal;
  const devAdvance50 = devGrandTotal / 2;
  const advance50 = grandTotal / 2;
  const balance50 = grandTotal / 2;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim()) errs.name = 'Client name is required';
    if (!customer.phone.trim()) errs.phone = 'Valid phone or WhatsApp is required';
    if (!customer.email.trim() || !customer.email.includes('@')) {
      errs.email = 'Valid email is required for automated invoices';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return;
    if (!validate()) return;
    onGenerateQuotation(
      customer,
      amcPlanDetails?.tier || 'none',
      amcPlanDetails?.annualFee || 0,
      amcPlanDetails || undefined,
      grandTotal,
      advance50
    );
  };

  const handleWhatsAppDirect = () => {
    if (selectedServices.length === 0) return;
    if (!validate()) return;
    onQuickWhatsApp(
      customer,
      amcPlanDetails || undefined,
      grandTotal,
      advance50
    );
  };

  if (selectedServices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 mx-auto flex items-center justify-center mb-3">
          <FileCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Your Quotation Basket is Empty</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Please select one or more services from the development rate card to calculate tax, 50% advance, and generate an official quotation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Items Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Selected Scope & Rate Breakdown</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Taxable values calculated with 18% standard GST and suggested rates
            </p>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>

        {/* Responsive Table / Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Service / Module</th>
                <th className="py-2.5 px-2 text-right">Unit Quote</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Taxable (₹)</th>
                <th className="py-2.5 px-2 text-right">GST 18%</th>
                <th className="py-2.5 px-3 text-right">Final Amount</th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedServices.map((item) => (
                <tr key={item.serviceId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[11px] text-cyan-700 font-medium">{item.category}</span>
                  </td>

                  <td className="py-3 px-2 text-right font-medium text-slate-700">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
                      <button
                        onClick={() => onUpdateQty(item.serviceId, Math.max(1, item.qty - 1))}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-slate-900">{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.serviceId, item.qty + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-right font-semibold text-slate-800">
                    ₹{item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-2 text-right text-slate-500">
                    ₹{item.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-cyan-700">
                    ₹{item.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => onRemoveService(item.serviceId)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Timeline Estimation Visualizer */}
      <ProjectTimelineVisualizer
        selectedServices={selectedServices}
        currentTimelineSelection={customer.projectTimeline}
        onSelectTimeline={(timelineString) =>
          setCustomer((prev) => ({ ...prev, projectTimeline: timelineString }))
        }
      />

      {/* Interactive AMC Calculator Component */}
      <div id="amc-calculator-container">
        <AmcCalculator
          selectedTier={amcPlanDetails?.tier || 'silver'}
          onTierChange={(details) => setAmcPlanDetails(details)}
          devSubtotalTaxable={devTaxable}
        />
      </div>

      {/* Comprehensive Pricing Summary & Advance Breakdown Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Quotation Financial Summary & Advance Breakdown</span>
          </h4>
          <span className="text-[11px] text-slate-500">All prices in INR (₹)</span>
        </div>

        {/* Development Subtotal */}
        <div className="flex justify-between text-xs text-slate-600">
          <span className="text-slate-500">
            Development Services Subtotal ({selectedServices.length} {selectedServices.length === 1 ? 'module' : 'modules'}):
          </span>
          <span className="font-semibold text-slate-800">
            ₹{devTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Development GST */}
        <div className="flex justify-between text-xs text-slate-600">
          <span className="text-slate-500">Development GST (18%):</span>
          <span className="font-semibold text-slate-800">
            ₹{devGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Development Total */}
        <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
          <span className="font-medium text-slate-700">Development Project Total:</span>
          <span className="font-bold text-slate-900">
            ₹{devGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Appended AMC Line Item */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="font-semibold text-cyan-800">
              Annual Maintenance Contract ({amcPlanDetails ? amcPlanDetails.tierName : 'None'}):
            </span>
            {isAmcAppended ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Appended to Total
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Excluded
              </span>
            )}
          </div>

          <div className="text-right">
            {isAmcAppended ? (
              <span className="font-bold text-cyan-700">
                + ₹{amcTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  (₹{amcTaxable.toLocaleString('en-IN')} + ₹{amcGst.toLocaleString('en-IN')} GST)
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-medium">₹0.00</span>
            )}
          </div>
        </div>

        {/* Combined Grand Total */}
        <div className="pt-2 border-t-2 border-slate-200 flex justify-between text-base sm:text-lg font-black text-slate-900">
          <span className="flex items-center gap-2">
            <span>Grand Total (All-Inclusive):</span>
          </span>
          <span className="text-cyan-700 font-mono">
            ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Mandatory 50% Advance Callout */}
        <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-amber-900 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mandatory 50% Advance Required to Kickoff</span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Strictly non-refundable. Development sprint starts immediately upon realization.
            </p>
            {isAmcAppended && (
              <p className="text-[10px] text-slate-500">
                Breakdown: Project Kickoff 50%: ₹{devAdvance50.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | AMC 50%: ₹{(amcTotal / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="text-lg sm:text-xl font-black text-amber-700 font-mono block">
              ₹{advance50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Balance 50%: ₹{balance50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Information & Quotation Generation Form */}
      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Client & Quotation Details
            </h3>
          </div>
          {defaultCustomer?.name && (
            <button
              type="button"
              onClick={() => {
                setCustomer({
                  name: defaultCustomer.name || '',
                  email: defaultCustomer.email || '',
                  phone: defaultCustomer.phone || '',
                  companyName: defaultCustomer.companyName || '',
                  projectTimeline: defaultCustomer.projectTimeline || customer.projectTimeline || '3-4 Weeks',
                  projectRequirements: defaultCustomer.projectRequirements || customer.projectRequirements || '',
                  address: defaultCustomer.address || ''
                });
              }}
              className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Autofill from Profile ({defaultCustomer.name})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Client Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contact Person / Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className={`w-full pl-9 pr-3 py-2 rounded-xl bg-white border ${
                  errors.name ? 'border-rose-400 ring-1 ring-rose-400/20' : 'border-slate-200'
                } text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs`}
              />
            </div>
            {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Business Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Company / Brand / Startup Name
            </label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customer.companyName}
                onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                placeholder="e.g. Apex Innovations Pvt Ltd"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Phone / WhatsApp Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="e.g. +91 9812345678"
                className={`w-full pl-9 pr-3 py-2 rounded-xl bg-white border ${
                  errors.phone ? 'border-rose-400 ring-1 ring-rose-400/20' : 'border-slate-200'
                } text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs`}
              />
            </div>
            {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Client Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Address (For Automated Invoices) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="e.g. client@company.com"
                className={`w-full pl-9 pr-3 py-2 rounded-xl bg-white border ${
                  errors.email ? 'border-rose-400 ring-1 ring-rose-400/20' : 'border-slate-200'
                } text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs`}
              />
            </div>
            {errors.email && <p className="text-[10px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          {/* Project Timeline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Expected Delivery Timeline
              </label>
              <span className="text-[10px] text-cyan-700 font-semibold">
                Auto-estimated from scope
              </span>
            </div>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={customer.projectTimeline}
                onChange={(e) => setCustomer({ ...customer, projectTimeline: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-2xs"
              >
                {!['1-2 Weeks (Express)', '3-4 Weeks', '6-8 Weeks', '3+ Months'].includes(customer.projectTimeline) && (
                  <option value={customer.projectTimeline}>{customer.projectTimeline} (Estimated)</option>
                )}
                <option value="1-2 Weeks (Express)">1-2 Weeks (Express Sprint)</option>
                <option value="3-4 Weeks">3-4 Weeks (Standard)</option>
                <option value="6-8 Weeks">6-8 Weeks (Comprehensive App/ERP)</option>
                <option value="3+ Months">3+ Months (Enterprise SaaS)</option>
              </select>
            </div>
          </div>

          {/* City / Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client Location / City
            </label>
            <input
              type="text"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
            />
          </div>

          {/* Requirements / Custom specs */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Specific Feature Requirements or Notes
            </label>
            <textarea
              rows={2}
              value={customer.projectRequirements}
              onChange={(e) => setCustomer({ ...customer, projectRequirements: e.target.value })}
              placeholder="Enter any custom preferences, third-party APIs, design references or specific milestones..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Mandatory Terms & Conditions Banner */}
        <div id="commercial-terms-box" className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>TechSoftware.digital Commercial & Payment Terms:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
            <li>
              <strong className="text-amber-800">50% Advance Payment:</strong> Mandatory prior to commencement of development and architecture design.
            </li>
            <li>
              <strong className="text-amber-800">Non-Refundable Policy:</strong> All advance payments and milestone disbursements are strictly non-refundable once sprint kicks off.
            </li>
            <li>
              <strong className="text-slate-800">AMC Separate:</strong> Annual Maintenance Contracts are billed separately per contract term.
            </li>
            <li>
              <strong className="text-slate-800">Automated Dispatch:</strong> Official PDF invoice is emailed automatically upon booking and sent via WhatsApp.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            className="flex-1 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate Official Quotation & Invoice</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppDirect}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send to WhatsApp (+91 8169401877)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
