import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Search,
  Layers,
  Smartphone,
  Globe,
  Database,
  Bot,
  Cloud,
  ShieldAlert,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Menu,
  Clock,
  Briefcase,
  Zap,
  FileText
} from 'lucide-react';
import { ServiceItem, QuotationSelectedService } from '../../types';
import { CustomerTabType } from './CustomerSideMenu';

export interface CustomerHomeShowcaseProps {
  services: ServiceItem[];
  selectedServices: QuotationSelectedService[];
  onToggleService: (service: ServiceItem) => void;
  onUpdateQuantity: (serviceId: string, delta: number) => void;
  onOpenSideMenu: () => void;
  onNavigateToBuilder: () => void;
  onNavigateToTab: (tab: CustomerTabType, targetId?: string) => void;
}

// 3 High-Impact Flagship Portfolio Projects
const FLAGSHIP_PORTFOLIO = [
  {
    id: 'portfolio-1',
    title: 'OmniRetail Quick-Commerce',
    client: 'Apex Retail Stores',
    category: 'Retail & POS',
    summary: 'Hyperlocal store delivery with live GPS rider tracking, thermal POS sync, and UPI payment gateway.',
    metric: '50k+ Orders • 99.9% Uptime',
    tech: 'Flutter • Next.js • Redis',
    serviceMatchId: 'web-ecommerce'
  },
  {
    id: 'portfolio-2',
    title: 'MedPulse Telemedicine & EMR',
    client: 'MedPulse Health Clinics',
    category: 'Healthcare App',
    summary: 'Doctor clinical records, encrypted video consults, and automated WhatsApp digital prescriptions.',
    metric: '12 Clinics • 15k+ Consults',
    tech: 'React Native • WebRTC • Cloud API',
    serviceMatchId: 'app-cross-platform'
  },
  {
    id: 'portfolio-3',
    title: 'FleetTrack Logistics ERP',
    client: 'National Freight Logistics',
    category: 'Enterprise ERP',
    summary: 'Vehicle IoT GPS telematics, driver dispatch automation, and automated Indian GST e-way bills.',
    metric: '350+ Fleet Trucks • 35% Faster',
    tech: 'React 19 • PostgreSQL • IoT',
    serviceMatchId: 'biz-erp'
  }
];

export const CustomerHomeShowcase: React.FC<CustomerHomeShowcaseProps> = ({
  services,
  selectedServices,
  onToggleService,
  onUpdateQuantity,
  onOpenSideMenu,
  onNavigateToBuilder,
  onNavigateToTab
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map of selected service IDs
  const selectedMap = useMemo(() => {
    const map = new Map<string, QuotationSelectedService>();
    selectedServices.forEach(s => map.set(s.serviceId, s));
    return map;
  }, [selectedServices]);

  // Total basket amount
  const totalBasketAmount = useMemo(() => {
    return selectedServices.reduce((acc, curr) => acc + curr.finalAmount, 0);
  }, [selectedServices]);

  // Core high-value services for clean home presentation (max 6-8 items for zero clutter)
  const coreDisplayServices = useMemo(() => {
    return services
      .filter(s => s.isActive)
      .filter(s => {
        if (activeCategory === 'Web') {
          return s.category === 'Website' || s.category === 'Web Application';
        }
        if (activeCategory === 'Mobile') {
          return s.category === 'Mobile App';
        }
        if (activeCategory === 'ERP') {
          return s.category === 'Business Software' || s.category === 'SaaS';
        }
        if (activeCategory === 'AI') {
          return s.category === 'AI';
        }
        // Default 'All': prioritize featured or selected items
        return true;
      })
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const aSel = selectedMap.has(a.id) ? 1 : 0;
        const bSel = selectedMap.has(b.id) ? 1 : 0;
        if (aSel !== bSel) return bSel - aSel;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      })
      .slice(0, 6); // Keep it compact (max 6 cards) so home page stays short & uncluttered!
  }, [services, activeCategory, searchQuery, selectedMap]);

  // Quick select matching service from portfolio card
  const handleSelectFromPortfolio = (serviceId?: string) => {
    if (serviceId) {
      const match = services.find(s => s.id === serviceId);
      if (match && !selectedMap.has(match.id)) {
        onToggleService(match);
      }
    }
    const el = document.getElementById('core-services-picker');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* 1. COMPACT HERO: Clean, Crisp Agency Statement */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TECHSOFTWARE DIGITAL • SOFTWARE & DIGITAL PRODUCT STUDIO</span>
            </div>

            <button
              onClick={onOpenSideMenu}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Side Menu</span>
            </button>
          </div>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Custom Software Engineered for High Growth
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Web applications, cross-platform mobile apps, and enterprise ERPs. Fixed milestone delivery with transparent 50% advance billing.
            </p>
          </div>

          {/* Clean Unboxed Trust Line */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-400 border-t border-slate-800/70 pt-3">
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>50% Advance to Kickoff</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300">Strictly Non-Refundable</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-emerald-400 font-semibold">Live 18% GST Invoicing</span>
          </div>

          {/* Hero Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#core-services-picker"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <span>Choose Services ↓</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <a
              href={`https://wa.me/918169401877?text=${encodeURIComponent(
                'Hello TechSoftware.digital team, I would like to discuss a software project.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp Us (+91 8169401877)</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. COMPACT PORTFOLIO: 3 Flagship Projects Only (Zero Clutter) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Featured Client Deployments</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-world software architectures delivered by our team.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('projects')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Projects & Gantt in Menu</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3 Compact Portfolio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FLAGSHIP_PORTFOLIO.map(project => (
            <div
              key={project.id}
              className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-cyan-400 uppercase tracking-wider">{project.category}</span>
                  <span>{project.metric}</span>
                </div>

                <h3 className="text-sm font-bold text-white">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {project.summary}
                </p>

                <p className="text-[10px] font-mono text-slate-400 pt-1">
                  Stack: {project.tech}
                </p>
              </div>

              <button
                onClick={() => handleSelectFromPortfolio(project.serviceMatchId)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-cyan-300 border border-slate-700/60 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Select Architecture</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE SERVICES PICKER: Compact 6-Card Grid (Fast & Easy to Choose) */}
      <section id="core-services-picker" className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Select Core Services for Your Quote</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              1-click to add to your formal estimate. Starting rates with 18% GST note.
            </p>
          </div>

          {/* Compact Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            {[
              { id: 'All', label: 'All' },
              { id: 'Web', label: 'Web' },
              { id: 'Mobile', label: 'Mobile' },
              { id: 'ERP', label: 'ERP / SaaS' },
              { id: 'AI', label: 'AI' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  activeCategory === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Concise 6-Card Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {coreDisplayServices.map(service => {
            const isSelected = selectedMap.has(service.id);
            const selectedItem = selectedMap.get(service.id);

            return (
              <div
                key={service.id}
                className={`rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 hover:bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {service.category}
                    </span>

                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        In Quote
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {service.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>

                  <div className="pt-1.5 flex items-baseline justify-between border-t border-slate-800/60 text-xs">
                    <span className="text-sm font-extrabold text-cyan-300">
                      ₹{service.suggestedQuote.toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">+ GST</span>
                    </span>

                    <span className="text-[10.5px] text-slate-400">
                      {service.category === 'Website' ? '1–2 Wks' : '3–4 Wks'}
                    </span>
                  </div>
                </div>

                {/* Selection Controls */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  {isSelected ? (
                    <>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(service.id, -1)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-white">
                          {selectedItem?.qty || 1}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(service.id, 1)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onToggleService(service)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Added</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onToggleService(service)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Quote</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to Full Catalogue in Side Menu */}
        <div className="text-center pt-1">
          <button
            onClick={() => onNavigateToTab('services')}
            className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Need more specialized modules? Open Full 40+ Services Catalogue in Side Menu</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 4. COMPACT SIDE MENU REMINDER CALLOUT */}
      <section className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Menu className="w-4 h-4 text-cyan-400 shrink-0" />
          <p className="text-slate-300">
            <strong>All Administrative Tools Inside Side Menu:</strong> Live Gantt tracking, past quote PDFs, client contracts & 24/7 support chat.
          </p>
        </div>

        <button
          onClick={onOpenSideMenu}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          Open Side Menu (☰)
        </button>
      </section>

      {/* 5. FLOATING QUOTATION STRIP (Only when items selected) */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/70 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-xs">
                {selectedServices.length}
              </span>
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''} in Quote
                  <span className="text-cyan-300 ml-1.5 font-extrabold">
                    • ₹{totalBasketAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToBuilder}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Review & Download PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
