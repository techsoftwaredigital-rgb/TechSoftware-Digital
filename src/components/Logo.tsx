import React from 'react';
import logoImg from '../assets/images/techsoftware_logo_1790412527457.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeDimensions = {
    sm: { circle: 36, textTitle: 'text-sm', textSub: 'text-[9px]' },
    md: { circle: 48, textTitle: 'text-base', textSub: 'text-[11px]' },
    lg: { circle: 64, textTitle: 'text-xl', textSub: 'text-xs' },
    xl: { circle: 96, textTitle: 'text-2xl', textSub: 'text-sm' }
  };

  const dim = sizeDimensions[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official TechSoftware.digital Logo Badge */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40 bg-slate-950"
        style={{ width: dim.circle, height: dim.circle }}
      >
        <img
          src={logoImg}
          alt="TechSoftware.digital"
          className="w-full h-full object-cover rounded-full select-none"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback to public asset if needed
            (e.currentTarget as HTMLImageElement).src = '/logo.png';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-white ${dim.textTitle}`}>
              TechSoftware<span className="text-cyan-400">.digital</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              OFFICIAL
            </span>
          </div>
          <span className={`text-slate-400 font-medium tracking-wide ${dim.textSub}`}>
            Your Idea. Our Technology.
          </span>
        </div>
      )}
    </div>
  );
};
