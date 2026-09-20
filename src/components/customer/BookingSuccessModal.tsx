import React from 'react';
import {
  CheckCircle,
  Mail,
  MessageCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
  ExternalLink,
  FolderArchive
} from 'lucide-react';
import { Quotation, CompanyInfo } from '../../types';

interface BookingSuccessModalProps {
  quotation: Quotation;
  companyInfo: CompanyInfo;
  onClose: () => void;
  onViewQuotation: () => void;
  onViewClientProfile?: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  quotation,
  companyInfo,
  onClose,
  onViewQuotation,
  onViewClientProfile
}) => {
  const handleOpenWhatsApp = () => {
    const summaryItems = quotation.items.map((i) => `• ${i.name} (₹${i.finalAmount.toLocaleString('en-IN')})`).join('%0A');
    const amcSummary = quotation.amcDetails && quotation.amcDetails.tier !== 'none'
      ? `%0A*AMC Plan:* ${quotation.amcDetails.tierName} (₹${quotation.amcDetails.totalAmount.toLocaleString('en-IN')}/yr inc. GST - ${quotation.amcDetails.isAppendedToTotal ? 'Appended to total' : 'Billed separately'})`
      : `%0A*AMC:* ${quotation.amcOption !== 'none' ? quotation.amcOption : 'Self-Managed (30-day warranty)'}`;

    const msg = `*TECHSOFTWARE DIGITAL - PROJECT BOOKING*%0A%0A*Quote:* ${quotation.quotationNumber}%0A*Client:* ${quotation.customer.name}%0A*Phone:* ${quotation.customer.phone}%0A*Email:* ${quotation.customer.email}%0A%0A*Selected Services:*%0A${summaryItems}${amcSummary}%0A%0A*Total Project:* ₹${quotation.grandTotal.toLocaleString('en-IN')}%0A*50% Advance Payable:* ₹${quotation.advancePayable50.toLocaleString('en-IN')}%0A%0A*Payment Terms:* Advance 50% non-refundable.%0A%0APlease share bank payment confirmation details.`;
    
    window.open(`https://wa.me/918169401877?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 text-white shadow-2xl shadow-cyan-500/20 overflow-hidden">
        
        {/* Glowing background halo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 mx-auto shadow-lg shadow-emerald-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            Quotation & Booking Created!
          </h3>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            Reference Number:{' '}
            <span className="font-mono font-bold text-cyan-400">
              {quotation.quotationNumber}
            </span>
          </p>
        </div>

        {/* Automated Dispatch Indicators */}
        <div className="my-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
            <Mail className="w-4 h-4 shrink-0" />
            <span>Automated Email Invoice sent to:</span>
            <span className="text-slate-200 font-normal truncate">{quotation.customer.email}</span>
          </div>

          <div className="flex items-center gap-2.5 text-cyan-400 font-semibold">
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp Dispatch Trigger:</span>
            <span className="text-slate-200 font-normal truncate">{quotation.customer.phone}</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            {quotation.amcDetails && quotation.amcDetails.tier !== 'none' && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">AMC Plan Tier:</span>
                <span className="font-semibold text-cyan-300">
                  {quotation.amcDetails.tierName} {quotation.amcDetails.isAppendedToTotal ? '(Appended)' : '(Separate)'}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Quotation Grand Total:</span>
              <span className="font-bold text-white">
                ₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 font-medium">50% Advance Required:</span>
              <span className="text-sm font-black text-amber-400">
                ₹{quotation.advancePayable50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Remittance & Non-Refundable Notice */}
        <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Commercial Policy Acknowledged:</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            • 50% advance payment required to initiate architecture & repository sprint.<br />
            • All amounts paid are strictly non-refundable.<br />
            • AMC charges are billed separately per selected support plan.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Connect on WhatsApp (+91 8169401877)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={onViewQuotation}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>View / Print PDF Quotation</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Done
            </button>
          </div>

          {onViewClientProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewClientProfile();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track in Client Profile (Previous Quotes & Files)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
