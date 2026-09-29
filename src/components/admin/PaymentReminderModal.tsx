import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  CreditCard,
  Building,
  User,
  Phone,
  AlertCircle,
  FileText,
  DollarSign,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Quotation, CompanyInfo, PaymentStatus } from '../../types';

interface PaymentReminderModalProps {
  isOpen: boolean;
  quotation: Quotation | null;
  companyInfo: CompanyInfo;
  onClose: () => void;
  onSentReminder?: (quotationId: string, reminderType: string) => void;
}

type ReminderType = 'advance' | 'balance' | 'full' | 'followup';

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  isOpen,
  quotation,
  companyInfo,
  onClose,
  onSentReminder
}) => {
  if (!isOpen || !quotation) return null;

  // Determine intelligent default reminder type based on paymentStatus
  const initialType: ReminderType =
    quotation.paymentStatus === 'Partial'
      ? 'balance'
      : quotation.paymentStatus === 'Paid'
      ? 'followup'
      : 'advance';

  const [reminderType, setReminderType] = useState<ReminderType>(initialType);
  const [recipientPhone, setRecipientPhone] = useState<string>(quotation.customer.phone || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sentSuccessToast, setSentSuccessToast] = useState(false);

  // Generate direct quotation link
  const quotationDirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?quote=${encodeURIComponent(quotation.quotationNumber)}`
    : `https://techsoftware.digital/?quote=${quotation.quotationNumber}`;

  // Outstanding amount calculations
  const totalAmount = quotation.grandTotal;
  const advanceAmount = quotation.advancePayable50;
  const balanceAmount = quotation.balancePayable || Math.max(0, totalAmount - advanceAmount);

  const outstandingAmount =
    reminderType === 'advance'
      ? advanceAmount
      : reminderType === 'balance'
      ? balanceAmount
      : reminderType === 'full'
      ? totalAmount
      : balanceAmount;

  // Pre-format WhatsApp Message Generator
  const generateFormattedMessage = (type: ReminderType, phoneNum: string): string => {
    const clientName = quotation.customer.name || 'Valued Client';
    const companyName = quotation.customer.companyName ? ` (${quotation.customer.companyName})` : '';
    const quoteNo = quotation.quotationNumber;
    const servicesList = quotation.items.map((i) => i.name).slice(0, 3).join(', ');
    const hasMoreServices = quotation.items.length > 3 ? ` +${quotation.items.length - 3} more` : '';
    const servicesText = servicesList + hasMoreServices;

    const formattedTotal = `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const formattedAdvance = `₹${advanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const formattedBalance = `₹${balanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const formattedOutstanding = `₹${outstandingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    let headline = '';
    let bodyContext = '';

    if (type === 'advance') {
      headline = '⚡ *50% ADVANCE PAYMENT REMINDER*';
      bodyContext = `This is a friendly reminder that the *50% project advance* of *${formattedAdvance}* is pending for quotation *#${quoteNo}* to initiate development.`;
    } else if (type === 'balance') {
      headline = '🎯 *MILESTONE BALANCE PAYMENT REMINDER*';
      bodyContext = `We hope development is progressing to your satisfaction! This is a reminder regarding the *remaining project balance* of *${formattedBalance}* for quotation *#${quoteNo}*.`;
    } else if (type === 'full') {
      headline = '💼 *OFFICIAL PAYMENT INVOICE REMINDER*';
      bodyContext = `This is a reminder regarding the payment settlement of *${formattedTotal}* for quotation *#${quoteNo}*.`;
    } else {
      headline = '👋 *QUOTATION STATUS & PAYMENT FOLLOW-UP*';
      bodyContext = `We wanted to gently follow up on your quotation *#${quoteNo}* (${servicesText}). Please let us know if you need any adjustments to the scope or payment schedule.`;
    }

    return (
`${headline}
*TechSoftware.digital*

Dear *${clientName}*${companyName},

Greetings from TechSoftware.digital!

${bodyContext}

📋 *Quotation Summary:*
• *Quotation No:* #${quoteNo}
• *Scope:* ${servicesText}
• *Total Project Value:* ${formattedTotal}
• *Current Status:* ${quotation.status} (Payment: ${quotation.paymentStatus || 'Pending'})
• *Outstanding Amount:* *${formattedOutstanding}*

🔗 *View Official Quotation & Invoice Online:*
${quotationDirectUrl}
_(Click above to review full scope breakdown, itemized pricing, GST, and digital tax invoice)_

💳 *Direct Bank & UPI Transfer Details:*
• *UPI ID:* ${companyInfo.bankDetails.upiId}
• *Bank:* ${companyInfo.bankDetails.bankName}
• *Account Name:* ${companyInfo.bankDetails.accountName}
• *Account No:* ${companyInfo.bankDetails.accountNumber}
• *IFSC Code:* ${companyInfo.bankDetails.ifscCode}

Once payment is completed, please share the transaction UTR or receipt here so our accounts team can promptly confirm and issue your official tax receipt.

Need assistance or have any questions? Reply directly to this chat or call us at *${companyInfo.phone}*.

Warm regards,
*TechSoftware.digital Accounts Team*
🌐 https://techsoftware.digital`
    );
  };

  // Sync custom message when reminder type changes unless user is actively editing
  useEffect(() => {
    if (!isEditingMessage) {
      setCustomMessage(generateFormattedMessage(reminderType, recipientPhone));
    }
  }, [reminderType, recipientPhone, quotationDirectUrl]);

  // Clean and normalize phone number for WhatsApp wa.me link
  const normalizePhoneNumber = (raw: string): string => {
    // Remove all non-digits
    let cleaned = raw.replace(/\D/g, '');
    
    // If starts with 0, strip leading 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits (standard Indian mobile number without country code), prepend 91
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }

    return cleaned;
  };

  // Action: Open WhatsApp directly
  const handleSendWhatsApp = () => {
    const finalMsg = customMessage.trim() || generateFormattedMessage(reminderType, recipientPhone);
    const cleanedPhone = normalizePhoneNumber(recipientPhone);

    if (!cleanedPhone || cleanedPhone.length < 8) {
      alert('Please enter a valid phone number with country code (e.g. +91 9820112233).');
      return;
    }

    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(finalMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setSentSuccessToast(true);
    if (onSentReminder) {
      onSentReminder(quotation.id, reminderType);
    }
    setTimeout(() => setSentSuccessToast(false), 3500);
  };

  // Action: Copy Direct Quotation Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(quotationDirectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Action: Copy entire WhatsApp message
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Send WhatsApp Payment Reminder</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Direct Link Included
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pre-formatted reminder for <strong className="text-slate-700">{quotation.customer.name}</strong> ({quotation.quotationNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* Success Toast */}
          {sentSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">WhatsApp chat opened! Reminder dispatched to client.</span>
              </div>
              <span className="text-[10px] opacity-80 font-mono">Status updated</span>
            </div>
          )}

          {/* Quotation & Balance Overview Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">Client</span>
              <span className="font-bold text-slate-900 truncate block">{quotation.customer.name}</span>
              <span className="text-[10px] text-slate-500 truncate block">{quotation.customer.companyName || 'Individual'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Grand Total</span>
              <span className="font-bold text-slate-900 text-sm">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-cyan-700 block font-mono font-medium">{quotation.quotationNumber}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Payment Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
                  quotation.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : quotation.paymentStatus === 'Partial'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {quotation.paymentStatus || 'Pending'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Outstanding Balance</span>
              <span className="font-black text-amber-600 text-sm block">
                ₹{outstandingAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">
                {reminderType === 'advance' ? '50% Advance' : reminderType === 'balance' ? 'Milestone Bal.' : 'Full Due'}
              </span>
            </div>
          </div>

          {/* Reminder Stage Tabs */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Reminder Template Stage:</span>
              <span className="text-[10px] text-cyan-700 font-normal">Pre-configured message tone</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setReminderType('advance');
                  setIsEditingMessage(false);
                }}
                className={`p-2.5 rounded-2xl text-left border transition-all ${
                  reminderType === 'advance'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>⚡ 50% Advance</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">₹{advanceAmount.toLocaleString('en-IN')}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReminderType('balance');
                  setIsEditingMessage(false);
                }}
                className={`p-2.5 rounded-2xl text-left border transition-all ${
                  reminderType === 'balance'
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🎯 Milestone Bal.</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">₹{balanceAmount.toLocaleString('en-IN')}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReminderType('full');
                  setIsEditingMessage(false);
                }}
                className={`p-2.5 rounded-2xl text-left border transition-all ${
                  reminderType === 'full'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>💼 Full Settlement</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">₹{totalAmount.toLocaleString('en-IN')}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReminderType('followup');
                  setIsEditingMessage(false);
                }}
                className={`p-2.5 rounded-2xl text-left border transition-all ${
                  reminderType === 'followup'
                    ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>👋 Gentle Check-in</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">Quotation Review</div>
              </button>
            </div>
          </div>

          {/* Client WhatsApp Number & Direct Link Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client WhatsApp Mobile Number</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 9820112233"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Normalized target: <span className="text-emerald-700 font-mono font-semibold">+{normalizePhoneNumber(recipientPhone) || 'None'}</span>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Direct Quotation Web Link</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Auto-embedded</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={quotationDirectUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-cyan-700 font-mono text-[11px] select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy direct quotation link"
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">
                Directly opens this quotation invoice on any device without login required.
              </span>
            </div>
          </div>

          {/* Pre-formatted Message Live Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pre-formatted WhatsApp Message Preview</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="text-[11px] text-cyan-600 hover:underline font-semibold"
                >
                  {isEditingMessage ? 'Done Editing' : 'Customize Text'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg transition-colors"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'Copied' : 'Copy Message'}</span>
                </button>
              </div>
            </div>

            {isEditingMessage ? (
              <textarea
                rows={9}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white border border-emerald-300 text-slate-800 font-mono text-[11px] leading-relaxed focus:outline-none"
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all selection:bg-emerald-100">
                {customMessage}
              </div>
            )}
          </div>

          {/* Bank & Payment Information Quick Check */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>Receiving UPI: <strong className="text-slate-800 font-mono">{companyInfo.bankDetails.upiId}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Bank: <strong className="text-slate-700">{companyInfo.bankDetails.bankName}</strong></span>
            </div>
            <span className="text-emerald-700 font-medium">Ready to dispatch</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Opens WhatsApp Web or mobile app with pre-filled message</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
