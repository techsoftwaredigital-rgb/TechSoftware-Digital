import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Clock,
  Code2,
  FileText,
  Sparkles,
  MessageCircle,
  ExternalLink,
  ChevronUp
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'policy' | 'amc' | 'payments' | 'delivery';
  question: string;
  summary: string;
  answer: string[];
  highlight?: string;
  badge?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'non-refundable-50-advance',
    category: 'policy',
    question: 'Why is the 50% advance mandatory and strictly non-refundable?',
    summary: 'Advance payment locks in dedicated engineering hours and infrastructure resources.',
    highlight: 'Mandatory 50% Advance • Strictly Non-Refundable Once Sprint Kicks Off',
    badge: 'Core Commercial Policy',
    answer: [
      'At TechSoftware.digital, we do not use low-tier outsourced freelancers or generic templates. When a client books a project, a dedicated team of senior software engineers, UI/UX designers, and cloud architects are immediately assigned and reserved exclusively for your project.',
      'Commencement costs—including server staging environments, database provisioning, proprietary UI prototypes, and engineering hours—are incurred on Day 1.',
      'Therefore, the initial 50% advance payment is strictly non-refundable under all circumstances once the development sprint has begun.'
    ]
  },
  {
    id: 'amc-terms-coverage',
    category: 'amc',
    question: 'What is the Annual Maintenance Contract (AMC) and what does it include?',
    summary: 'AMC ensures your web app, mobile app, or SaaS remains secure, updated, and bug-free.',
    highlight: 'Proactive Cloud Backups • SLA Response Guarantees • Dedicated Monthly Dev Hours',
    badge: 'AMC Terms',
    answer: [
      'Modern web and mobile applications rely on third-party APIs (payment gateways, authentication, cloud services) and evolving operating system updates. AMC provides ongoing technical stewardship.',
      'Depending on your tier (Bronze, Silver, Gold, or Platinum), AMC covers: monthly dedicated developer hours for feature tweaks, regular security patching, SSL certificate maintenance, automated daily/weekly cloud database backups, and guaranteed SLA response times (within 2 to 24 hours).',
      'AMC contracts are billed on an annual or quarterly schedule and are managed separately from initial one-time development quotes.'
    ]
  },
  {
    id: 'is-amc-mandatory',
    category: 'amc',
    question: 'Is taking an AMC mandatory when purchasing custom software or a website?',
    summary: 'Every build includes a complimentary 30-day warranty; ongoing AMC is optional but strongly recommended.',
    badge: 'AMC Flexibility',
    answer: [
      'No, AMC is not compulsory. Every application delivered by TechSoftware.digital comes with a standard complimentary 30-Day Bug-Free Technical Warranty to fix any defects within the initial agreed project scope.',
      'After the 30-day warranty period, clients can either maintain the code themselves (full source code is transferred upon 100% project payment) or opt into an AMC tier to ensure 24/7 uptime monitoring and priority technical support.'
    ]
  },
  {
    id: 'payment-milestones',
    category: 'payments',
    question: 'How does the remaining 50% balance payment work?',
    summary: 'Balance 50% is due upon completion of user acceptance testing (UAT) on staging.',
    badge: 'Milestone Structure',
    answer: [
      'Our standard billing structure is simple, fair, and transparent: 50% upfront advance upon quotation approval to kickoff development, and the remaining 50% balance upon staging demonstration and milestone completion.',
      'Once the 50% balance is settled, the production build is deployed live to your custom domain, cloud servers, or published to Google Play Store / Apple App Store, accompanied by formal invoice receipts and source repository access.'
    ]
  },
  {
    id: 'gst-compliance-invoicing',
    category: 'payments',
    question: 'Are prices subject to GST? Will I receive a formal GST tax invoice?',
    summary: 'All quotations clearly delineate 18% standard GST with automated downloadable PDF invoices.',
    badge: 'GST & Compliance',
    answer: [
      'Yes, all software development and digital services in India are subject to standard 18% GST (CGST 9% + SGST 9% or IGST 18%).',
      'Our Quotation Builder calculates exact taxable amounts and 18% GST line-by-line. Upon booking, an official digital tax invoice containing our GSTIN, HSN/SAC codes, and your company details is generated instantly and dispatched via email and WhatsApp.'
    ]
  },
  {
    id: 'scope-creep-revisions',
    category: 'delivery',
    question: 'What happens if I want to add new features after the sprint has started?',
    summary: 'Minor UI tweaks are included; major new features are estimated as incremental add-ons.',
    badge: 'Change Requests',
    answer: [
      'The initial quotation locks in the scope specified during checkout. Small design tweaks and reasonable revisions during the UI/UX phase are welcomed.',
      'If you require substantial architectural additions, new third-party integrations, or extra pages not in the original quote, we provide a transparent add-on estimate that can be appended to the final invoice without disrupting your active sprint schedule.'
    ]
  },
  {
    id: 'source-code-ip-ownership',
    category: 'delivery',
    question: 'Who owns the intellectual property and source code of the application?',
    summary: 'You hold 100% unencumbered ownership of all custom code, assets, and database schemas.',
    highlight: '100% Full IP & Source Code Ownership Handover',
    badge: 'Client Ownership',
    answer: [
      'Upon receipt of 100% project payments, TechSoftware.digital assigns complete ownership of the custom codebase, graphics, database schemas, and intellectual property to the client.',
      'We never lock clients into proprietary closed ecosystems; all applications are developed using modern, industry-standard frameworks (React, Node.js, TypeScript, Tailwind, PostgreSQL / Firebase).'
    ]
  }
];

export const FaqAndTerms: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('non-refundable-50-advance');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'policy' | 'amc' | 'payments' | 'delivery'>('all');

  const filteredItems = FAQ_ITEMS.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExpandAll = () => {
    // If all are open, collapse. Otherwise open first or all.
    if (expandedId === 'all') {
      setExpandedId(null);
    } else {
      setExpandedId('all');
    }
  };

  return (
    <section
      id="faq-and-terms-section"
      className="mt-12 pt-8 border-t border-slate-800/80 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Transparency & Compliance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Frequently Asked Questions & Commercial Terms
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Clear guidelines on our mandatory 50% non-refundable advance policy, Annual Maintenance
            Contracts (AMC), milestone disbursements, and source code ownership.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {expandedId === 'all' ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </>
            )}
          </button>

          <a
            href="https://wa.me/918169401877?text=Hi%20TechSoftware%20team,%20I%20have%20a%20question%20regarding%20commercial%20terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-950/60 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Ask on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-900 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Topics ({FAQ_ITEMS.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('policy')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'policy'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Non-Refundable Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('amc')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'amc'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>AMC & Maintenance</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('payments')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'payments'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          <span>Milestones & GST</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('delivery')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'delivery'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Delivery & IP Ownership</span>
        </button>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isOpen = expandedId === 'all' || expandedId === item.id;
          const isPolicy = item.category === 'policy';
          const isAmc = item.category === 'amc';

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? isPolicy
                    ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-950/20'
                    : isAmc
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/90 border-slate-700 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Question Header Button */}
              <button
                type="button"
                id={`faq-btn-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPolicy
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : isAmc
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      • {item.category.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                    {item.question}
                  </h3>

                  {!isOpen && (
                    <p className="text-xs text-slate-400 line-clamp-1">{item.summary}</p>
                  )}
                </div>

                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                    isOpen
                      ? 'bg-slate-800 border-slate-700 rotate-180 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Accordion Expandable Answer */}
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs text-slate-300 space-y-3 border-t border-slate-800/60 pt-4">
                  {item.highlight && (
                    <div
                      className={`p-3 rounded-xl border flex items-center gap-2.5 font-semibold ${
                        isPolicy
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                          : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>{item.highlight}</span>
                    </div>
                  )}

                  {item.answer.map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed text-slate-300 text-xs sm:text-[13px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Commercial Summary Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Need a custom contract or bespoke SLA?</h4>
            <p className="text-slate-400 mt-0.5">
              We provide formal non-disclosure agreements (NDAs) and custom enterprise service level
              agreements upon request.
            </p>
          </div>
        </div>

        <a
          href="tel:8169401877"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>Call Legal / Tech: +91 8169401877</span>
        </a>
      </div>
    </section>
  );
};
