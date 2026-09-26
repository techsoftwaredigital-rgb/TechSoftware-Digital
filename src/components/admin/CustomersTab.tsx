import React, { useState } from 'react';
import {
  Users,
  Search,
  Building,
  Mail,
  Phone,
  Calendar,
  FileText,
  Layers,
  ArrowRight,
  MessageCircle,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { ClientProfile, Quotation, Project } from '../../types';

interface CustomersTabProps {
  clients: ClientProfile[];
  quotations: Quotation[];
  projects: Project[];
  onSelectCustomerToMessage?: (customerName: string) => void;
  onOpenPaymentReminder?: (quotation: Quotation) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  clients,
  quotations,
  projects,
  onSelectCustomerToMessage,
  onOpenPaymentReminder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Customer & Client Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
              {clients.length} Registered Accounts
            </span>
          </div>
          <p className="text-xs text-slate-400">
            View customer profiles, contact info, total contract history, and linked projects.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, company..."
            className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientQuotes = quotations.filter(
            (q) =>
              q.customer.email.toLowerCase() === client.email.toLowerCase() ||
              q.customer.name.toLowerCase().includes(client.name.toLowerCase())
          );
          const clientProjects = projects.filter(
            (p) =>
              p.customerName.toLowerCase().includes(client.name.toLowerCase()) ||
              (p.customerEmail && p.customerEmail.toLowerCase() === client.email.toLowerCase())
          );

          const totalSpend = clientQuotes
            .filter((q) => q.status === 'Customer Accepted' || q.status === 'Advance Received' || q.status === 'Completed')
            .reduce((sum, q) => sum + q.grandTotal, 0);

          return (
            <div
              key={client.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {client.name[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{client.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>{client.companyName}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      client.clientTier === 'Enterprise Partner'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : client.clientTier === 'Active Client'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {client.clientTier}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{client.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{client.phone}</span>
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Quotes</span>
                    <span className="font-bold text-white">{clientQuotes.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Projects</span>
                    <span className="font-bold text-cyan-400">{clientProjects.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Value</span>
                    <span className="font-bold text-emerald-400">
                      ₹{(totalSpend / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1.5 mt-2">
                {(() => {
                  const unpaidQuote = clientQuotes.find(
                    (q) => (q.paymentStatus || 'Pending') !== 'Paid'
                  );
                  if (unpaidQuote && onOpenPaymentReminder) {
                    const due = unpaidQuote.paymentStatus === 'Partial'
                      ? (unpaidQuote.balancePayable || Math.max(0, unpaidQuote.grandTotal - unpaidQuote.advancePayable50))
                      : unpaidQuote.advancePayable50;

                    return (
                      <button
                        onClick={() => onOpenPaymentReminder(unpaidQuote)}
                        className="w-full py-1.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-950/40"
                        title="Send pre-formatted WhatsApp payment reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Payment Reminder (₹{due.toLocaleString('en-IN')})</span>
                      </button>
                    );
                  }
                  return null;
                })()}

                {onSelectCustomerToMessage && (
                  <button
                    onClick={() => onSelectCustomerToMessage(client.name)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Customer Chat</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
