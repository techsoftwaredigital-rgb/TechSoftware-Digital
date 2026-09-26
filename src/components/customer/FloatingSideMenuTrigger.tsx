import React, { useState, useEffect } from 'react';
import { Menu, ArrowUp, Zap } from 'lucide-react';

interface FloatingSideMenuTriggerProps {
  onOpenSideMenu: () => void;
  selectedServicesCount: number;
  isSideMenuOpen: boolean;
}

export const FloatingSideMenuTrigger: React.FC<FloatingSideMenuTriggerProps> = ({
  onOpenSideMenu,
  selectedServicesCount,
  isSideMenuOpen
}) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hide if side menu is already open
  if (isSideMenuOpen) return null;

  return (
    <div className="no-print fixed left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 select-none transition-all duration-300">
      {/* Floating Side Menu Button */}
      <button
        onClick={onOpenSideMenu}
        id="floating-side-menu-btn"
        className="group flex items-center gap-2 pl-2.5 pr-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white border-y border-r border-cyan-500/40 hover:border-cyan-400 rounded-r-2xl shadow-xl shadow-cyan-950/40 backdrop-blur-md transition-all transform hover:translate-x-1 cursor-pointer"
        title="Open Side Menu (Quick Navigation & Jump)"
        aria-label="Open Side Navigation Menu"
      >
        <div className="relative">
          <Menu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          {selectedServicesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-extrabold tracking-wide text-cyan-300 flex items-center gap-1">
            <span>Side Menu</span>
            <Zap className="w-2.5 h-2.5 text-amber-400" />
          </span>
          <span className="text-[9px] text-slate-400 font-medium leading-none hidden sm:inline">
            Quick Jump
          </span>
        </div>
      </button>

      {/* Floating Back to Top Button (Shows when scrolled) */}
      {hasScrolled && (
        <button
          onClick={handleScrollToTop}
          id="floating-scroll-top-btn"
          className="group flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-y border-r border-slate-700/60 rounded-r-xl shadow-lg backdrop-blur-md transition-all transform hover:translate-x-1 cursor-pointer text-xs"
          title="Scroll to Top of Page"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-[10px] font-semibold hidden sm:inline">Top</span>
        </button>
      )}
    </div>
  );
};
