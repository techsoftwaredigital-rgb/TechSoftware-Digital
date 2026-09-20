import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  X,
  Mail,
  Phone,
  MessageCircle,
  Building,
  ShieldAlert,
  CreditCard,
  Send,
  FileText,
  Check
} from 'lucide-react';
import { Logo } from '../Logo';
import { Quotation, CompanyInfo } from '../../types';

interface QuotationViewModalProps {
  quotation: Quotation | null;
  companyInfo: CompanyInfo;
  onClose: () => void;
  onSendEmailSimulation: (quotationId: string) => void;
}

export const QuotationViewModal: React.FC<QuotationViewModalProps> = ({
  quotation,
  companyInfo,
  onClose,
  onSendEmailSimulation
}) => {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPrintFriendly, setIsPrintFriendly] = useState(false);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
      onSendEmailSimulation(quotation.id);
    }, 1000);
  };

  const handleShareWhatsApp = () => {
    const summaryItems = quotation.items.map((i) => `• ${i.name} (₹${i.finalAmount.toLocaleString('en-IN')})`).join('%0A');
    const msg = `*TECHSOFTWARE DIGITAL - OFFICIAL QUOTATION*%0A%0A*Quote No:* ${quotation.quotationNumber}%0A*Client:* ${quotation.customer.name} (${quotation.customer.companyName || 'Individual'})%0A*Phone:* ${quotation.customer.phone}%0A%0A*Scope of Services:*%0A${summaryItems}%0A%0A*Subtotal (Taxable):* ₹${quotation.subtotalTaxable.toLocaleString('en-IN')}%0A*GST (18%):* ₹${quotation.totalGst.toLocaleString('en-IN')}%0A*Grand Total:* ₹${quotation.grandTotal.toLocaleString('en-IN')}%0A%0A*PAYMENT TERMS:*%0A⚡ *50% Advance Required:* ₹${quotation.advancePayable50.toLocaleString('en-IN')}%0A⚠️ *Note:* All amounts paid are strictly non-refundable.%0A🛠️ *AMC:* Annual Maintenance Contract charges are separate.%0A%0APay via UPI: ${companyInfo.bankDetails.upiId}%0AOfficial Contact: ${companyInfo.phone} | ${companyInfo.email}`;
    
    // Clean target phone or company phone
    window.open(`https://wa.me/918169401877?text=${msg}`, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(
      `TechSoftware.digital Quotation ${quotation.quotationNumber} for ${quotation.customer.name}: Total ₹${quotation.grandTotal.toLocaleString('en-IN')} (50% Advance: ₹${quotation.advancePayable50.toLocaleString('en-IN')})`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="print-modal-container fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className={`print-modal-card relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-6 border ${
        isPrintFriendly ? 'border-slate-300' : 'border-slate-200'
      }`}>
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-xs sm:text-sm text-slate-100">
              Official Quotation Preview: {quotation.quotationNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Print-Friendly Minimalist Toggle */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 select-none">
              <button
                type="button"
                id="print-friendly-toggle"
                onClick={() => setIsPrintFriendly(!isPrintFriendly)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                title="Toggle minimalist high-contrast print design without background patterns"
              >
                <div
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isPrintFriendly ? 'bg-cyan-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isPrintFriendly ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print-Friendly</span>
                </span>
              </button>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-all ${
                  isPrintFriendly
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-700/60 text-slate-400'
                }`}
              >
                {isPrintFriendly ? 'Minimalist' : 'Standard'}
              </span>
            </div>

            <button
              onClick={handlePrint}
              id="print-pdf-button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
              title="Print or export as clean PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={emailStatus === 'sending' || emailStatus === 'sent'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>
                {emailStatus === 'sending'
                  ? 'Dispatching...'
                  : emailStatus === 'sent'
                  ? 'Invoiced!'
                  : 'Email'}
              </span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              title="Copy summary to clipboard"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informational banner when Print-Friendly mode is active (Hidden when printing) */}
        {isPrintFriendly && (
          <div className="no-print bg-cyan-950/60 border-b border-cyan-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
              <p>
                <strong>Print-Friendly Minimalist Design Active:</strong> All background tints, gradients, and saturated patterns are stripped for high-contrast, ink-efficient PDF invoices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrintFriendly(false)}
              className="text-cyan-400 hover:text-white underline font-semibold text-[11px] ml-auto"
            >
              Switch to Standard View
            </button>
          </div>
        )}

        {/* Printable Formal Quotation & Invoice Document */}
        <div
          id="quotation-print-area"
          className={`print-sheet p-6 sm:p-10 bg-white text-slate-900 space-y-6 ${
            isPrintFriendly ? 'print-friendly-active' : ''
          }`}
        >
          
          {/* Header */}
          <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 ${
            isPrintFriendly ? 'border-slate-900' : 'border-slate-900'
          }`}>
            <div>
              <div className="flex items-center gap-3">
                {/* Embedded Logo badge */}
                <div className={`flex items-center justify-center p-1 ${
                  isPrintFriendly
                    ? 'w-12 h-12 rounded-lg border-2 border-slate-900 bg-white shadow-none'
                    : 'w-14 h-14 rounded-full bg-slate-950 shadow'
                }`}>
                  <Logo size="sm" showText={false} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                    TECHSOFTWARE DIGITAL
                  </h1>
                  <p className={`text-xs font-semibold tracking-wider ${
                    isPrintFriendly ? 'text-slate-600' : 'text-cyan-700'
                  }`}>
                    Your Idea. Our Technology.
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p><strong>Email:</strong> {companyInfo.email}</p>
                <p><strong>Direct / WhatsApp:</strong> {companyInfo.phone}</p>
                <p><strong>Location:</strong> {companyInfo.location}</p>
                <p><strong>GSTIN:</strong> {companyInfo.gstNumber} | <strong>PAN:</strong> {companyInfo.panNumber}</p>
              </div>
            </div>

            {/* Quotation Meta */}
            <div className="text-left sm:text-right">
              <span className={`inline-block px-3 py-1 font-bold text-xs uppercase tracking-wide rounded ${
                isPrintFriendly
                  ? 'bg-white text-slate-950 border-2 border-slate-900'
                  : 'bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-sm'
              }`}>
                FORMAL QUOTATION & ESTIMATE
              </span>
              <div className="mt-3 text-xs space-y-1 text-slate-700">
                <p>
                  <strong className="text-slate-900">Quote Number:</strong>{' '}
                  <span className={`font-mono font-bold ${isPrintFriendly ? 'text-slate-950 font-black' : 'text-cyan-800'}`}>
                    {quotation.quotationNumber}
                  </span>
                </p>
                <p><strong>Date Issued:</strong> {quotation.date}</p>
                <p><strong>Valid Through:</strong> {quotation.validUntil}</p>
                <p><strong>Project Timeline:</strong> {quotation.customer.projectTimeline}</p>
              </div>
            </div>
          </div>

          {/* Client Details Row */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs border ${
            isPrintFriendly
              ? 'rounded-lg bg-white border-slate-300'
              : 'rounded-xl bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
                PREPARED FOR (CLIENT):
              </span>
              <p className="text-sm font-bold text-slate-900">{quotation.customer.name}</p>
              {quotation.customer.companyName && (
                <p className="font-medium text-slate-700">{quotation.customer.companyName}</p>
              )}
              <p className="text-slate-600 mt-1">
                <strong>Phone:</strong> {quotation.customer.phone}
              </p>
              <p className="text-slate-600">
                <strong>Email:</strong> {quotation.customer.email}
              </p>
              {quotation.customer.address && (
                <p className="text-slate-600">
                  <strong>Location:</strong> {quotation.customer.address}
                </p>
              )}
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
                PROJECT NOTES & REQUIREMENTS:
              </span>
              <p className="text-slate-700 italic leading-relaxed">
                {quotation.customer.projectRequirements ||
                  'Full-stack digital engineering, responsive web/mobile deployment, security hardening and automated notification workflows as detailed below.'}
              </p>
            </div>
          </div>

          {/* Services Scope Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className={isPrintFriendly ? 'bg-slate-100 text-slate-900 font-bold border-y-2 border-slate-900' : 'bg-slate-900 text-white font-bold'}>
                  <th className={`py-2.5 px-3 border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>#</th>
                  <th className={`py-2.5 px-3 border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>Service / Module Description</th>
                  <th className={`py-2.5 px-2 text-right border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>Rate (₹)</th>
                  <th className={`py-2.5 px-2 text-center border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>Qty</th>
                  <th className={`py-2.5 px-2 text-right border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>Taxable (₹)</th>
                  <th className={`py-2.5 px-2 text-right border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>GST (18%)</th>
                  <th className={`py-2.5 px-3 text-right border ${isPrintFriendly ? 'border-slate-300' : 'border-slate-800'}`}>Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      isPrintFriendly
                        ? 'bg-white'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50'
                    }
                  >
                    <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200">
                      <strong className="text-slate-900 block">{item.name}</strong>
                      <span className="text-[11px] text-slate-500 leading-snug block">
                        {item.description}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 font-medium">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-2 text-center border border-slate-200 font-bold">
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 font-medium">
                      ₹{item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 text-slate-600">
                      ₹{item.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-3 text-right border border-slate-200 font-bold ${
                      isPrintFriendly ? 'text-slate-950 font-black' : 'text-slate-900'
                    }`}>
                      ₹{item.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

                {/* Appended AMC Line Item if active */}
                {quotation.amcDetails && quotation.amcDetails.isAppendedToTotal && (
                  <tr className={isPrintFriendly ? 'bg-white font-sans border-b-2 border-slate-300' : 'bg-cyan-50/60 font-sans'}>
                    <td className="py-2.5 px-3 text-center border border-slate-200 font-bold text-slate-700">
                      {quotation.items.length + 1}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Annual Maintenance Contract (AMC) – {quotation.amcDetails.tierName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isPrintFriendly
                            ? 'bg-slate-100 text-slate-800 border border-slate-300'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {quotation.amcDetails.billingCycle === 'annual' ? '1 Year Plan' : 'Quarterly Plan'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Guaranteed {quotation.amcDetails.slaResponseHours}h response SLA • {quotation.amcDetails.monthlyDevHours} hrs/month active developer maintenance • Automated backups & security patches
                      </p>
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 text-slate-700">
                      ₹{quotation.amcDetails.annualFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center border border-slate-200 text-slate-700">
                      1
                    </td>
                    <td className="py-2.5 px-2 text-center border border-slate-200 text-slate-700">
                      0%
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 font-medium text-slate-900">
                      ₹{quotation.amcDetails.annualFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right border border-slate-200 text-slate-600">
                      ₹{quotation.amcDetails.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-3 text-right border border-slate-200 font-bold ${
                      isPrintFriendly ? 'text-slate-950 font-black' : 'text-cyan-900'
                    }`}>
                      ₹{quotation.amcDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation & Totals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Bank & Payment Information */}
            <div className={`p-4 text-xs space-y-2 border ${
              isPrintFriendly
                ? 'rounded-lg bg-white border-slate-300'
                : 'rounded-xl bg-slate-50 border-slate-200'
            }`}>
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CreditCard className={`w-4 h-4 ${isPrintFriendly ? 'text-slate-900' : 'text-cyan-700'}`} />
                <span>Bank & UPI Remittance Details</span>
              </span>
              <div className="text-slate-700 space-y-1 text-[11px]">
                <p><strong>Account Name:</strong> {companyInfo.bankDetails.accountName}</p>
                <p><strong>Bank:</strong> {companyInfo.bankDetails.bankName}, {companyInfo.bankDetails.branch}</p>
                <p><strong>Account No:</strong> <span className="font-mono font-bold">{companyInfo.bankDetails.accountNumber}</span></p>
                <p><strong>IFSC Code:</strong> <span className="font-mono font-bold">{companyInfo.bankDetails.ifscCode}</span></p>
                <p className={isPrintFriendly ? 'text-slate-900 font-bold' : 'text-emerald-700 font-bold'}>
                  <strong>UPI ID:</strong> {companyInfo.bankDetails.upiId} (Google Pay / PhonePe / Paytm)
                </p>
              </div>
            </div>

            {/* Total Math */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                <span>Total Taxable Amount:</span>
                <span className="font-bold text-slate-900">
                  ₹{quotation.subtotalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                <span>Integrated GST (18%):</span>
                <span className="font-bold text-slate-900">
                  ₹{quotation.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className={`flex justify-between py-2 text-base font-extrabold text-slate-950 ${
                isPrintFriendly ? 'border-y-2 border-slate-900' : 'border-b-2 border-slate-900'
              }`}>
                <span>Grand Total (All Inclusive):</span>
                <span className={isPrintFriendly ? 'text-slate-950 font-black' : 'text-cyan-800'}>
                  ₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Mandatory 50% Advance Highlight */}
              <div className={`text-xs space-y-1 ${
                isPrintFriendly
                  ? 'p-3 bg-white border-2 border-slate-900 rounded-lg'
                  : 'p-3 bg-amber-50 border border-amber-300 rounded-lg'
              }`}>
                <div className={`flex justify-between font-black text-sm ${
                  isPrintFriendly ? 'text-slate-950' : 'text-amber-900'
                }`}>
                  <span>MANDATORY 50% ADVANCE:</span>
                  <span>₹{quotation.advancePayable50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`flex justify-between text-[11px] ${
                  isPrintFriendly ? 'text-slate-700 font-medium' : 'text-slate-600'
                }`}>
                  <span>Balance 50% (Milestone Completion):</span>
                  <span>₹{quotation.balancePayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AMC Notice / Policy Details */}
          <div className={`p-3.5 text-xs border ${
            isPrintFriendly
              ? 'rounded-lg bg-white border-slate-300 text-slate-900'
              : 'rounded-xl bg-cyan-50 border-cyan-200 text-cyan-900'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-bold text-slate-900">
                Annual Maintenance Contract (AMC): {quotation.amcDetails?.tierName || (quotation.amcOption !== 'none' ? `${quotation.amcOption.toUpperCase()} LEVEL` : 'Self-Managed (30-day warranty)')}
              </p>
              {quotation.amcDetails?.isAppendedToTotal ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isPrintFriendly
                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  Appended to Total
                </span>
              ) : (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isPrintFriendly
                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  Billed Separately
                </span>
              )}
            </div>
            <p className={`text-[11px] leading-relaxed ${
              isPrintFriendly ? 'text-slate-700' : 'text-cyan-800'
            }`}>
              {quotation.amcDetails && quotation.amcDetails.tier !== 'none' ? (
                <>
                  Includes guaranteed {quotation.amcDetails.slaResponseHours}-hour response turnaround, {quotation.amcDetails.monthlyDevHours} hrs/month active developer maintenance, continuous cloud backups, and proactive security patches. Total Annual Fee: <strong>₹{quotation.amcDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> (inc. 18% GST).
                </>
              ) : (
                <>
                  Project sprint includes standard 30-day post-launch bug warranty. Ongoing maintenance, server uptime monitoring, and OS upgrades are billed through AMC tiers or hourly developer rates.
                </>
              )}
            </p>
          </div>

          {/* Terms and Conditions (Prompt Requirement: "advance 50% and non refundebale all amount raheega") */}
          <div className={`p-4 text-[10.5px] space-y-1.5 print-break-inside-avoid border ${
            isPrintFriendly
              ? 'rounded-lg bg-white border-slate-300 text-slate-700'
              : 'rounded-xl bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <p className="font-bold uppercase tracking-wider text-slate-800">
              Commercial Terms & Binding Conditions:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>
                <strong>Advance 50% Mandatory:</strong> 50% of the total project value must be realized in our bank account prior to architecture initiation, repository setup, or sprint kickoff.
              </li>
              <li>
                <strong>Strictly Non-Refundable:</strong> All amounts paid (including the 50% initial advance and subsequent stage disbursements) are strictly non-refundable under all circumstances once technical allocation or development sprint begins.
              </li>
              <li>
                <strong>AMC Terms:</strong> Post-deployment maintenance and infrastructure hosting upkeep are governed by the separate Annual Maintenance Contract (AMC) terms.
              </li>
              <li>
                <strong>Delivery & Intellectual Property:</strong> Source code ownership and live production credentials will be handed over to the client immediately upon final payment clearance.
              </li>
              <li>
                <strong>Automated Electronic Records:</strong> This quotation and subsequent tax invoices are electronically dispatched to the client's email and registered WhatsApp number.
              </li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="pt-6 flex justify-between items-end text-xs border-t border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Authorized Signatory</p>
              <p className="text-[11px] text-slate-500">TechSoftware.digital Technical Management</p>
              <div className={`mt-4 font-mono text-[10px] font-bold ${
                isPrintFriendly ? 'text-slate-800' : 'text-cyan-800'
              }`}>
                [Digitally Verified - TechSoftware.digital]
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-800">Accepted & Confirmed By Client</p>
              <p className="text-[11px] text-slate-500">{quotation.customer.name}</p>
              <div className="mt-6 border-b border-slate-400 w-40 ml-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Signature & Company Seal</p>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="no-print bg-slate-100 p-3 text-center text-xs text-slate-500 border-t border-slate-200 flex items-center justify-center gap-2">
          <span>Need custom changes or technical consultation? Call</span>
          <a href="tel:8169401877" className="font-bold text-cyan-700 hover:underline">
            +91 8169401877
          </a>
          <span>or WhatsApp us directly.</span>
        </div>
      </div>
    </div>
  );
};
