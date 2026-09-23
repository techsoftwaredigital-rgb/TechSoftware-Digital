import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageCircle,
  User,
  Shield,
  Clock,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';
import { ChatMessage, UserAccount } from '../../types';

interface CustomerMessagesViewProps {
  currentUser?: UserAccount | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
}

export const CustomerMessagesView: React.FC<CustomerMessagesViewProps> = ({
  currentUser,
  messages,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = currentUser?.uid || 'customer-default';

  // Filter messages for current customer
  const customerMessages = messages.filter(
    (m) => !m.customerId || m.customerId === customerId || m.customerId === 'customer-default'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [customerMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(inputText.trim());
      setInputText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-semibold">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Direct Developer Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Messages & Project Communications
          </h1>
          <p className="text-xs text-slate-300">
            Communicate directly with our lead developers, architects, and technical sales team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:8169401877"
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Lead</span>
          </a>
          <a
            href="mailto:techsoftware.digital@gmail.com"
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Email</span>
          </a>
        </div>
      </div>

      {/* Chat Window */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {customerMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Start a Conversation with TechSoftware.digital
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask questions about your software quotation, request architectural customizations, or check milestone status in real-time.
              </p>
            </div>
          ) : (
            customerMessages.map((msg) => {
              const isMe = msg.senderRole === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs space-y-1 ${
                      isMe
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 pb-0.5">
                      <span className="font-bold">
                        {isMe ? 'You' : msg.senderName || 'TechSoftware Team'}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-xs">{msg.text}</p>
                  </div>

                  {isMe && (
                    <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to developer team..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 shrink-0"
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
