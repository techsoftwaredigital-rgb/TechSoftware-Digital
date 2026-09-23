import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  User,
  Shield,
  Search,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../../types';

interface AdminMessagesTabProps {
  messages: ChatMessage[];
  onSendMessage: (customerId: string, text: string) => Promise<void>;
}

export const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({
  messages,
  onSendMessage
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages by customer
  const customerMap = new Map<string, { customerName: string; lastMessage: ChatMessage; total: number }>();
  messages.forEach((m) => {
    const id = m.customerId || 'customer-default';
    const existing = customerMap.get(id);
    if (!existing || new Date(m.createdAt) > new Date(existing.lastMessage.createdAt)) {
      customerMap.set(id, {
        customerName: m.customerName || 'Client',
        lastMessage: m,
        total: (existing?.total || 0) + 1
      });
    }
  });

  const customerList = Array.from(customerMap.entries()).map(([id, info]) => ({
    id,
    ...info
  }));

  // Auto-select first customer if none selected
  useEffect(() => {
    if (!selectedCustomerId && customerList.length > 0) {
      setSelectedCustomerId(customerList[0].id);
    }
  }, [customerList.length, selectedCustomerId]);

  const activeCustomerMessages = messages.filter(
    (m) => (m.customerId || 'customer-default') === selectedCustomerId
  );

  const activeCustomerInfo = customerList.find((c) => c.id === selectedCustomerId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCustomerMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !selectedCustomerId) return;

    setSending(true);
    try {
      await onSendMessage(selectedCustomerId, replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Live Customer Messaging Desk</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
              {customerList.length} Active Conversations
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time Firestore communication between customers and TechSoftware.digital developers.
          </p>
        </div>
      </div>

      {/* 2-Pane Chat Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left Pane: Customer Threads */}
        <div className="md:col-span-1 border-r border-slate-800 flex flex-col bg-slate-950/60">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter clients..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {customerList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No client conversations yet. When clients message from their portal, they will appear here.
              </div>
            ) : (
              customerList
                .filter((c) => c.customerName.toLowerCase().includes(search.toLowerCase()))
                .map((client) => {
                  const isSelected = client.id === selectedCustomerId;
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedCustomerId(client.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-slate-800/90 text-white border-l-4 border-cyan-400'
                          : 'text-slate-300 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shrink-0 text-xs font-bold">
                        {client.customerName[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold truncate">{client.customerName}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(client.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {client.lastMessage.text}
                        </p>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Conversation */}
        <div className="md:col-span-2 flex flex-col bg-slate-900">
          {selectedCustomerId ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {activeCustomerInfo?.customerName[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {activeCustomerInfo?.customerName || 'Customer'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      ID: {selectedCustomerId} • Firestore Live
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Online Sync
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeCustomerMessages.map((msg) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdmin && (
                        <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 ${
                          isAdmin
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                          <span className="font-bold">
                            {isAdmin ? 'You (Admin)' : msg.senderName || 'Customer'}
                          </span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-xs">{msg.text}</p>
                      </div>

                      {isAdmin && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeCustomerInfo?.customerName || 'customer'}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <span>{sending ? 'Sending...' : 'Reply'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageCircle className="w-8 h-8 text-slate-600 mb-2" />
              <span>Select a customer from the left list to view conversation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
