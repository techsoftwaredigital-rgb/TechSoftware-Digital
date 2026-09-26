import React, { useState, useEffect } from 'react';
import {
  X,
  Pin,
  PinOff,
  Search,
  Home,
  Briefcase,
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  FileEdit,
  FileText,
  Rocket,
  MessageSquare,
  UserCheck,
  Calculator,
  ShieldCheck,
  Wrench,
  CreditCard,
  Calendar,
  HelpCircle,
  Phone,
  MessageCircle,
  ArrowUp,
  Sliders,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { Logo } from '../Logo';

export type CustomerTabType =
  | 'home'
  | 'dashboard'
  | 'services'
  | 'rateCard'
  | 'requestQuote'
  | 'myQuotes'
  | 'projects'
  | 'messages'
  | 'profile'
  | 'builder';

export interface CustomerSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentTab: CustomerTabType;
  onSelectTab: (tab: CustomerTabType, targetElementId?: string) => void;
  selectedServicesCount: number;
  totalBasketAmount: number;
  quotationsCount: number;
  projectsCount: number;
  unreadMessagesCount: number;
  clientName?: string;
  companyName?: string;
  onSwitchPortal: (portal: 'customer' | 'admin') => void;
  onOpenQuotationModal?: () => void;
}

export const CustomerSideMenu: React.FC<CustomerSideMenuProps> = ({
  isOpen,
  onClose,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  currentTab,
  onSelectTab,
  selectedServicesCount,
  totalBasketAmount,
  quotationsCount,
  projectsCount,
  unreadMessagesCount,
  clientName,
  companyName,
  onSwitchPortal,
  onOpenQuotationModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  // Handle ESC key to close side menu on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Main menu items with descriptions and badge counts
  const navItems = [
    {
      id: 'home' as CustomerTabType,
      label: 'Home (Portfolio & Services)',
      description: 'Showcase, delivered projects & primary service selection',
      icon: Home,
      badge: 'Main',
      badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
    },
    {
      id: 'dashboard' as CustomerTabType,
      label: 'Dashboard',
      description: 'Project health, active milestones & spending summary',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'services' as CustomerTabType,
      label: 'Services & Modules',
      description: 'Web apps, mobile apps, SaaS & cloud engineering',
      icon: Layers,
      badge: 'Live',
      badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
    },
    {
      id: 'rateCard' as CustomerTabType,
      label: 'GST 2026 Rate Card',
      description: 'Standard transparent pricing breakdown with 18% GST',
      icon: FileSpreadsheet,
      badge: '18% GST',
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
    },
    {
      id: 'requestQuote' as CustomerTabType,
      label: 'Request Quotation',
      description: 'Submit custom engineering requirements & specs',
      icon: FileEdit,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'myQuotes' as CustomerTabType,
      label: 'My Quotations & Invoices',
      description: 'Formal estimates, status badges & 1-click PDF download',
      icon: FileText,
      badge: quotationsCount > 0 ? `${quotationsCount}` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
    },
    {
      id: 'projects' as CustomerTabType,
      label: 'Live Projects & Milestones',
      description: 'Interactive Gantt timeline, sprint pace & status',
      icon: Rocket,
      badge: projectsCount > 0 ? `${projectsCount}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    },
    {
      id: 'messages' as CustomerTabType,
      label: 'Support & Chat',
      description: 'Direct communication with assigned technical lead',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? `${unreadMessagesCount}` : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
    },
    {
      id: 'profile' as CustomerTabType,
      label: 'Client Profile & Docs',
      description: 'Account details, project files, NDA & contact logs',
      icon: UserCheck,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'builder' as CustomerTabType,
      label: 'Quotation Builder & Basket',
      description: 'Configure custom modules, AMC tiers & 50% advance',
      icon: Calculator,
      badge: selectedServicesCount > 0 ? `${selectedServicesCount} items` : null,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold'
    }
  ];

  // Quick In-Page Jumps ("No Scrolling Required")
  const quickJumps = [
    {
      label: 'Portfolio Showcase (Real Apps)',
      tab: 'home' as CustomerTabType,
      targetId: 'portfolio-showcase-section',
      icon: Briefcase,
      tag: 'Portfolio'
    },
    {
      label: 'Core Services Selection',
      tab: 'home' as CustomerTabType,
      targetId: 'services-selection-section',
      icon: Layers,
      tag: 'Services'
    },
    {
      label: '50% Advance & Refund Policy',
      tab: 'builder' as CustomerTabType,
      targetId: 'faq-and-terms-section',
      icon: ShieldCheck,
      tag: 'Policy'
    },
    {
      label: 'AMC Maintenance Tiers',
      tab: 'builder' as CustomerTabType,
      targetId: 'amc-calculator-container',
      icon: Wrench,
      tag: 'AMC'
    },
    {
      label: 'Bank & UPI Remittance',
      tab: 'builder' as CustomerTabType,
      targetId: 'bank-remittance-card',
      icon: CreditCard,
      tag: 'UPI / NEFT'
    },
    {
      label: 'Gantt Project Timeline Chart',
      tab: 'projects' as CustomerTabType,
      targetId: 'project-timeline-visualizer',
      icon: Calendar,
      tag: 'Gantt'
    },
    {
      label: 'Frequently Asked Questions (FAQ)',
      tab: 'services' as CustomerTabType,
      targetId: 'faq-and-terms-section',
      icon: HelpCircle,
      tag: 'FAQ'
    }
  ];

  const filteredNavItems = navItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuickJumps = quickJumps.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavClick = (tab: CustomerTabType, targetId?: string) => {
    onSelectTab(tab, targetId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer only */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Fixed Left-Hand Side Menu (Fixed to viewport left edge on desktop, slide-out drawer on mobile) */}
      <aside
        id="customer-side-menu"
        className={`fixed top-0 bottom-0 left-0 z-40 h-screen bg-slate-950 border-r border-slate-800/80 shadow-2xl md:shadow-none flex flex-col shrink-0 transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-72 lg:w-80 w-72 sm:w-80 max-w-[85vw]'}`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="cursor-pointer shrink-0" onClick={() => handleNavClick('home')}>
              <Logo size="sm" showText={false} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-wide truncate">
                    TS.DIGITAL
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/40 shrink-0">
                    Side Menu
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Navigation & Tools
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop collapse/expand button */}
            <button
              onClick={handleToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Side Menu"
              aria-label="Close Side Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client Profile Snippet */}
        {!isCollapsed && (
          <div className="px-4 py-2 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/60 flex items-center justify-between text-xs shrink-0">
            <div className="truncate pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Active Client
              </span>
              <p className="font-bold text-slate-200 truncate">
                {clientName || 'Demo Enterprise Client'}
              </p>
              {companyName && (
                <p className="text-[10px] text-slate-400 truncate">{companyName}</p>
              )}
            </div>
            <button
              onClick={() => handleNavClick('profile')}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer"
            >
              Profile
            </button>
          </div>
        )}

        {/* Quick Search / Filter Input */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/30 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs, pricing, terms..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 custom-scrollbar">
          
          {/* Main Navigation Section */}
          <div>
            {!isCollapsed && (
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <span>Main Sections</span>
                <span className="text-slate-600 font-normal">Click to navigate</span>
              </div>
            )}

            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;

                if (isCollapsed) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all relative cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                      title={`${item.label} - ${item.description}`}
                    >
                      <IconComponent className="w-5 h-5 shrink-0" />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    id={`side-menu-tab-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full group flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 text-white shadow-sm'
                        : 'hover:bg-slate-900/90 text-slate-300 hover:text-white border border-transparent'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 group-hover:bg-slate-800 text-cyan-400 border border-slate-800'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 group-hover:text-slate-300 leading-tight mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight className={`w-3.5 h-3.5 self-center shrink-0 transition-transform ${
                      isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Jump - In-Page Shortcuts */}
          {!isCollapsed && (
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Instant Jump (No Scroll)</span>
                </span>
                <span className="text-amber-500/90 font-bold">1-Click</span>
              </div>

              <div className="space-y-1">
                {filteredQuickJumps.map((jump, idx) => {
                  const IconComponent = jump.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavClick(jump.tab, jump.targetId)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left group cursor-pointer"
                      title={`Jump directly to ${jump.label}`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <IconComponent className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-medium truncate group-hover:text-amber-300">
                          {jump.label}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono group-hover:bg-amber-950 group-hover:text-amber-300 border border-slate-700/50 shrink-0">
                        {jump.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Basket Card if Items Selected */}
          {!isCollapsed && selectedServicesCount > 0 && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Quotation Basket</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200 font-black">
                  {selectedServicesCount} Selected
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Estimated Total:</span>
                <span className="text-sm font-extrabold text-white">
                  ₹{totalBasketAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <button
                onClick={() => handleNavClick('builder')}
                className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>Review & Export Quotation</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Binding Commercial Terms Summary Pill */}
          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10.5px] space-y-1 text-slate-400">
              <p className="font-bold text-slate-300 flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-400" />
                <span>Official Terms Reminder</span>
              </p>
              <p>• <strong>50% Advance</strong> required before technical sprint kickoff.</p>
              <p>• All payments made are <strong>strictly non-refundable</strong>.</p>
              <p>• AMC maintenance packages are billed separately.</p>
            </div>
          )}
        </div>

        {/* Bottom Fixed Action Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/70 space-y-2 shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <a
                href={`https://wa.me/918169401877?text=${encodeURIComponent(
                  'Hello TechSoftware.digital, I need quick assistance regarding software quotation and services.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
              </a>

              <a
                href="tel:8169401877"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                title="Call Us"
              >
                <Phone className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  onSwitchPortal('admin');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
                }}
                className="p-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 transition-colors"
                title="Developer Portal"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                onClick={handleScrollToTop}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Scroll to Top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* WhatsApp Direct Help */}
              <a
                href={`https://wa.me/918169401877?text=${encodeURIComponent(
                  'Hello TechSoftware.digital, I need quick assistance regarding software quotation and services.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Chat on WhatsApp (+91 8169401877)</span>
              </a>

              {/* Quick Action Buttons Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="tel:8169401877"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 text-[11px] transition-colors"
                >
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>Call Us</span>
                </a>

                <button
                  onClick={handleScrollToTop}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 text-[11px] transition-colors cursor-pointer"
                  title="Smooth Scroll to Top"
                >
                  <ArrowUp className="w-3 h-3 text-cyan-400" />
                  <span>Scroll to Top</span>
                </button>
              </div>

              {/* Portal Switcher in Side Menu */}
              <button
                onClick={() => {
                  onSwitchPortal('admin');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-indigo-400" />
                <span>Switch to Developer Portal (Admin)</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
