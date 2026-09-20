import React from 'react';

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
      {/* Precision recreation of the uploaded TechSoftware.digital Logo */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40"
        style={{ width: dim.circle, height: dim.circle }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Radial Gradient */}
            <radialGradient id="bgGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#0a1931" />
              <stop offset="65%" stopColor="#040b18" />
              <stop offset="100%" stopColor="#02050c" />
            </radialGradient>

            {/* Blue Outer Ring Gradient */}
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#00c6ff" />
            </linearGradient>

            {/* Letter 'T' and 'S' Gradients */}
            <linearGradient id="tGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d8ff" />
              <stop offset="45%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#0052d4" />
            </linearGradient>

            {/* Wave Arc Gradient */}
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0052d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00c6ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0072ff" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Outer Circle Background */}
          <circle cx="100" cy="100" r="98" fill="url(#bgGrad)" stroke="url(#ringGrad)" strokeWidth="4" />

          {/* Glowing bottom dynamic wave curves matching uploaded logo */}
          <path
            d="M 12 140 Q 60 170 110 148 T 188 140 A 98 98 0 0 1 12 140 Z"
            fill="url(#waveGrad)"
            opacity="0.85"
          />
          <path
            d="M 25 155 Q 85 185 145 160 T 178 152 A 98 98 0 0 1 25 155 Z"
            fill="#00d8ff"
            opacity="0.5"
          />

          {/* Monogram 'T' */}
          <g>
            {/* Top Bar of T */}
            <path
              d="M 45 52 L 105 52 L 95 65 L 53 65 Z"
              fill="url(#tGrad)"
            />
            {/* Vertical Stem of T */}
            <path
              d="M 68 65 L 84 65 L 84 108 L 68 108 Z"
              fill="url(#tGrad)"
            />
          </g>

          {/* Monogram 'S' with high-tech geometric style */}
          <g>
            <path
              d="M 90 65 
                 C 105 52, 138 52, 138 65 
                 C 138 78, 100 78, 100 92 
                 C 100 108, 142 108, 142 98
                 L 138 90
                 C 138 98, 114 98, 114 92
                 C 114 82, 152 82, 152 65
                 C 152 48, 110 46, 90 65 Z"
              fill="url(#sGrad)"
            />
          </g>

          {/* Digital Pixel / Tech squares exploding from top right */}
          <rect x="138" y="38" width="12" height="12" rx="2" fill="#00d8ff" />
          <rect x="147" y="49" width="10" height="10" rx="2" fill="#00a8ff" />
          <rect x="138" y="49" width="7" height="7" rx="1.5" fill="#ffffff" opacity="0.9" />

          {/* Center brand text inside logo badge */}
          <text
            x="100"
            y="126"
            textAnchor="middle"
            fontFamily="'Outfit', sans-serif"
            fontWeight="800"
            fontSize="15"
            letterSpacing="0.2"
          >
            <tspan fill="#ffffff">TechSoftware</tspan>
            <tspan fill="#00d8ff">.digital</tspan>
          </text>

          {/* Tagline inside badge */}
          <text
            x="100"
            y="140"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight="500"
            fontSize="7"
            fill="#94a3b8"
            letterSpacing="1.2"
          >
            Your Idea. Our Technology.
          </text>
        </svg>
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
