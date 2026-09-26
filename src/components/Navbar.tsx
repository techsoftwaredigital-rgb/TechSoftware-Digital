import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  FileText,
  Sliders,
  Bell,
  Phone,
  Mail,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  CreditCard,
  User,
  LogOut,
  LogIn,
  Menu
} from 'lucide-react';
import { AppNotification, CompanyInfo, UserAccount } from '../types';

interface NavbarProps {
  currentPortal: 'customer' | 'admin';
  onPortalChange: (portal: 'customer' | 'admin') => void;
  selectedItemsCount: number;
  totalTaxable: number;
  notifications: AppNotification[];
  onClearNotification: (id: string) => void;
  onRequestPush: () => void;
  pushEnabled: boolean;
  companyInfo: CompanyInfo;
  isMobileDeviceView: boolean;
  onToggleMobileDeviceView: () => void;
  onOpenQuotationDrawer?: () => void;
  onNavigateToProfile?: () => void;
  onToggleSideMenu?: () => void;
  isSideMenuOpen?: boolean;
  clientName?: string;
  firebaseConnected?: boolean;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPortal,
  onPortalChange,
  selectedItemsCount,
  totalTaxable,
  notifications,
  onClearNotification,
  onRequestPush,
  pushEnabled,
  companyInfo,
  isMobileDeviceView,
  onToggleMobileDeviceView,
  onOpenQuotationDrawer,
  onNavigateToProfile,
  onToggleSideMenu,
  isSideMenuOpen,
  clientName,
  firebaseConnected = true,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Top micro contact strip */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/50 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${companyInfo.email}`}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{companyInfo.email}</span>
            </a>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <a
              href="tel:8169401877"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 8169401877</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border ${
                firebaseConnected
                  ? 'text-amber-400 bg-amber-950/50 border-amber-800/40'
                  : 'text-slate-400 bg-slate-900/60 border-slate-700/50'
              }`}
              title={
                firebaseConnected
                  ? 'Firebase Firestore Cloud Synced: TS Digital'
                  : 'Firebase Offline Cache Active'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  firebaseConnected ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{firebaseConnected ? 'Firebase: TS Digital' : 'Firebase: Offline Sync'}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live GST Rate Card 2026
            </span>
            <button
              onClick={onRequestPush}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                pushEnabled
                  ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-800/50'
                  : 'text-slate-300 bg-slate-800 hover:bg-slate-700'
              }`}
              title={pushEnabled ? 'Push notifications active' : 'Enable browser push notifications'}
            >
              <Bell className="w-3 h-3" />
              <span>{pushEnabled ? 'Push On' : 'Enable Push'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Side Menu Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSideMenu && (
            <button
              onClick={onToggleSideMenu}
              id="navbar-side-menu-toggle-btn"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer select-none ${
                isSideMenuOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/25'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-cyan-500/50'
              }`}
              title="Toggle Side Menu (Quick Navigation & Jump)"
              aria-label="Toggle Side Menu"
            >
              <Menu className={`w-4 h-4 ${isSideMenuOpen ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">Side Menu</span>
              {selectedItemsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}

          <div className="cursor-pointer" onClick={() => onPortalChange('customer')}>
            <Logo size="md" />
          </div>
        </div>

        {/* Center: Portal Switcher (User prompt: "customer portel and devloper portel aaisa rahega") */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
          <button
            id="nav-customer-portal-btn"
            onClick={() => onPortalChange('customer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              currentPortal === 'customer'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Customer Portal</span>
          </button>

          <button
            id="nav-developer-portal-btn"
            onClick={() => onPortalChange('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              currentPortal === 'admin'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Developer Portal</span>
            <span className="px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded text-[10px]">
              Admin
            </span>
          </button>
        </div>

        {/* Right actions: View Switcher, Notifications, Quick Quotation trigger */}
        <div className="flex items-center gap-2">
          {/* Mobile frame preview toggle (Android/Mobile responsive test) */}
          <button
            onClick={onToggleMobileDeviceView}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              isMobileDeviceView
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Android Mobile App Frame Simulator"
          >
            {isMobileDeviceView ? (
              <>
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline text-[11px] font-medium">Android Preview</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-medium">Desktop View</span>
              </>
            )}
          </button>

          {/* Quick Client Profile Button */}
          {currentPortal === 'customer' && onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              id="navbar-client-profile-btn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-all"
              title="View Client Profile, Previous Quotes & Files"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{clientName || 'My Profile'}</span>
            </button>
          )}

          {/* User Account / Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white max-w-[100px] truncate hidden sm:inline">
                {currentUser.displayName || currentUser.email.split('@')[0]}
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-400 px-1 py-0.2 bg-cyan-950 rounded border border-cyan-800/40">
                {currentUser.role}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )
          )}

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-sm text-white">Push & System Alerts</span>
                  </div>
                  <span className="text-xs text-slate-400">{notifications.length} total</span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs transition-colors rounded-lg flex items-start gap-2.5 ${
                          !notif.read ? 'bg-slate-800/60 text-slate-200' : 'text-slate-400 hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="p-1.5 rounded-md bg-cyan-950 text-cyan-400 shrink-0 mt-0.5">
                          {notif.type === 'payment' ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-200">{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{notif.timestamp}</span>
                        </div>
                        <button
                          onClick={() => onClearNotification(notif.id)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quotation preview pill if in customer portal */}
          {currentPortal === 'customer' && selectedItemsCount > 0 && onOpenQuotationDrawer && (
            <button
              onClick={onOpenQuotationDrawer}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span className="w-5 h-5 rounded-full bg-white text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                {selectedItemsCount}
              </span>
              <span className="hidden sm:inline">Quote Summary:</span>
              <span>₹{totalTaxable.toLocaleString('en-IN')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
