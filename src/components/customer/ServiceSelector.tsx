import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  Plus,
  Sparkles,
  TrendingDown,
  Layers,
  ArrowRight,
  Filter,
  CheckCheck,
  Zap
} from 'lucide-react';
import { ServiceItem, ServiceCategory, QuotationSelectedService } from '../../types';

interface ServiceSelectorProps {
  services: ServiceItem[];
  selectedServices: QuotationSelectedService[];
  onToggleService: (service: ServiceItem) => void;
  onUpdateQuantity: (serviceId: string, delta: number) => void;
  onApplyPackagePreset: (serviceIds: string[]) => void;
  onQuickBook: (service: ServiceItem) => void;
}

const CATEGORIES: { label: string; value: ServiceCategory | 'All' }[] = [
  { label: 'All Services', value: 'All' },
  { label: 'Website', value: 'Website' },
  { label: 'Web Application', value: 'Web Application' },
  { label: 'Business Software', value: 'Business Software' },
  { label: 'Mobile App', value: 'Mobile App' },
  { label: 'SaaS', value: 'SaaS' },
  { label: 'AI Solutions', value: 'AI' },
  { label: 'Web Invitation', value: 'Web Invitation' },
  { label: 'Development Add-on', value: 'Development Add-on' },
  { label: 'Hosting & Cloud', value: 'Hosting' },
  { label: 'Play / App Store', value: 'Play Store / App Store' },
  { label: 'UI/UX Design', value: 'UI/UX' },
  { label: 'Security', value: 'Security' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'General Add-ons', value: 'Add-on' }
];

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServices,
  onToggleService,
  onUpdateQuantity,
  onApplyPackagePreset,
  onQuickBook
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc'>('recommended');

  const selectedMap = useMemo(() => {
    const map = new Map<string, QuotationSelectedService>();
    selectedServices.forEach(s => map.set(s.serviceId, s));
    return map;
  }, [selectedServices]);

  const filteredServices = useMemo(() => {
    return services
      .filter(s => s.isActive)
      .filter(s => {
        if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.suggestedQuote - b.suggestedQuote;
        if (sortBy === 'price-desc') return b.suggestedQuote - a.suggestedQuote;
        // Default recommended: featured first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [services, selectedCategory, searchQuery, sortBy]);

  // Curated rapid solution packages
  const packages = [
    {
      title: 'Startup Digital Presence',
      badge: 'Popular for Businesses',
      description: 'Landing Page + Domain + Basic Hosting + SSL + WhatsApp Button',
      services: ['web-landing', 'host-domain', 'host-basic', 'host-ssl', 'addon-whatsapp']
    },
    {
      title: 'Full E-commerce & Retail Suite',
      badge: 'High Value',
      description: 'E-commerce Website + Billing POS + Payment Gateway + WhatsApp API',
      services: ['web-ecommerce', 'biz-billing-pos', 'dev-payment-gw', 'dev-whatsapp-api']
    },
    {
      title: 'Cross-Platform Mobile App Launch',
      badge: 'Full Launch',
      description: 'Android + iOS Mobile App + Web Admin + Play Store + App Store Publishing',
      services: ['app-dual-with-admin', 'store-dual-publish', 'dev-push-notif']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Featured Rapid Package Presets */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 p-4 sm:p-5 rounded-2xl border border-cyan-900/40 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Quick Turnkey Packages (One-Click Selection)
            </h3>
          </div>
          <span className="text-[11px] text-cyan-400/90 font-medium">Ready in Seconds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="group p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {pkg.badge}
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                  {pkg.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {pkg.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onApplyPackagePreset(pkg.services)}
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-sm"
              >
                <span>Select Package</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 60+ services (e.g. CRM, E-commerce, Android, WhatsApp, AI Chatbot)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="recommended">Featured / Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Tabs (Horizontally scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          const count = cat.value === 'All' 
            ? services.filter(s => s.isActive).length 
            : services.filter(s => s.category === cat.value && s.isActive).length;

          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300">No matching services found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keyword or selecting a different category.
            </p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const selected = selectedMap.get(service.id);
            const isSelected = !!selected;

            // Market saving calculation
            const marketAvg = (service.marketMin + service.marketMax) / 2;
            const savingsPercent = Math.round(((marketAvg - service.suggestedQuote) / marketAvg) * 100);

            return (
              <div
                key={service.id}
                onClick={() => onToggleService(service)}
                className={`group cursor-pointer relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                        {service.category}
                      </span>
                      {service.featured && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> High Demand
                        </span>
                      )}
                    </div>

                    {/* Selection badge */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-cyan-300 transition-colors">
                    {service.name}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Pricing & Market Comparison Section */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {/* Market standard comparison */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Market Range:</span>
                    <span className="font-medium text-slate-300">
                      ₹{service.marketMin.toLocaleString('en-IN')} – ₹{service.marketMax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* TechSoftware Quote Price */}
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider block">
                        TechSoftware Quote
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-extrabold text-white">
                          ₹{service.suggestedQuote.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          + 18% GST
                        </span>
                      </div>
                    </div>

                    {savingsPercent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        ~{savingsPercent}% value
                      </span>
                    )}
                  </div>

                  {/* Total with 18% GST preview */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-950/60 px-2.5 py-1.5 rounded-lg">
                    <span>Final (incl. 18% GST):</span>
                    <span className="font-semibold text-slate-300">
                      ₹{(service.suggestedQuote * 1.18).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>

                  {/* Quantity adjustment if selected */}
                  {isSelected && (
                    <div
                      className="mt-3 flex items-center justify-between pt-2 border-t border-cyan-900/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-cyan-300 font-medium">Selected Quantity:</span>
                      <div className="flex items-center gap-2 bg-slate-950 border border-cyan-800/60 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(service.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-cyan-300 px-2">
                          {selected.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(service.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Book Action Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <button
                      type="button"
                      id={`quick-book-btn-${service.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickBook(service);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/30 hover:shadow-cyan-500/25 transition-all active:scale-[0.98] group/btn"
                      title="Add to basket and immediately proceed to Quotation Builder"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>{isSelected ? 'Quick Book (Proceed to Quote)' : 'Quick Book'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
