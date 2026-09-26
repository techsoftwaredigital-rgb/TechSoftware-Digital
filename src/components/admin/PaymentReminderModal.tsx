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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Send WhatsApp Payment Reminder</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Direct Link Included
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pre-formatted reminder for <strong className="text-slate-200">{quotation.customer.name}</strong> ({quotation.quotationNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* Success Toast */}
          {sentSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/60 text-emerald-300 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">WhatsApp chat opened! Reminder dispatched to client.</span>
              </div>
              <span className="text-[10px] opacity-80 font-mono">Status updated</span>
            </div>
          )}

          {/* Quotation & Balance Overview Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Client</span>
              <span className="font-bold text-white truncate block">{quotation.customer.name}</span>
              <span className="text-[10px] text-slate-400 truncate block">{quotation.customer.companyName || 'Individual'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Grand Total</span>
              <span className="font-bold text-white text-sm">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-cyan-400 block font-mono">{quotation.quotationNumber}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Payment Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${
                  quotation.paymentStatus === 'Paid'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : quotation.paymentStatus === 'Partial'
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                {quotation.paymentStatus || 'Pending'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Outstanding Balance</span>
              <span className="font-black text-amber-400 text-sm block">
                ₹{outstandingAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">
                {reminderType === 'advance' ? '50% Advance' : reminderType === 'balance' ? 'Milestone Bal.' : 'Full Due'}
              </span>
            </div>
          </div>

          {/* Reminder Stage Tabs */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Reminder Template Stage:</span>
              <span className="text-[10px] text-cyan-400 font-normal">Pre-configured message tone</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setReminderType('advance');
                  setIsEditingMessage(false);
                }}
                className={`p-2 rounded-xl text-left border transition-all ${
                  reminderType === 'advance'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
                className={`p-2 rounded-xl text-left border transition-all ${
                  reminderType === 'balance'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
                className={`p-2 rounded-xl text-left border transition-all ${
                  reminderType === 'full'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
                className={`p-2 rounded-xl text-left border transition-all ${
                  reminderType === 'followup'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client WhatsApp Mobile Number</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 9820112233"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Normalized target: <span className="text-emerald-400 font-mono">+{normalizePhoneNumber(recipientPhone) || 'None'}</span>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Direct Quotation Web Link</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Auto-embedded</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={quotationDirectUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy direct quotation link"
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pre-formatted WhatsApp Message Preview</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  {isEditingMessage ? 'Done Editing' : 'Customize Text'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'Copied' : 'Copy Message'}</span>
                </button>
              </div>
            </div>

            {isEditingMessage ? (
              <textarea
                rows={9}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-emerald-500/50 text-slate-200 font-mono text-[11px] leading-relaxed focus:outline-none"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all selection:bg-emerald-500/30">
                {customMessage}
              </div>
            )}
          </div>

          {/* Bank & Payment Information Quick Check */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Receiving UPI: <strong className="text-white font-mono">{companyInfo.bankDetails.upiId}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Bank: <strong className="text-slate-300">{companyInfo.bankDetails.bankName}</strong></span>
            </div>
            <span className="text-emerald-400 font-medium">Ready to dispatch</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Opens WhatsApp Web or mobile app with pre-filled message</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all"
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
