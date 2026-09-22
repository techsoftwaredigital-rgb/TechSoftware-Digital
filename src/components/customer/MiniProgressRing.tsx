import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { MilestoneStatus } from '../../types';

interface MiniProgressRingProps {
  /** Completion percent (0 - 100) */
  progress: number;
  /** Diameter of the SVG ring in pixels (default 32) */
  size?: number;
  /** Thickness of the ring stroke (default 3) */
  strokeWidth?: number;
  /** Whether to render the percentage / icon text inside the ring (default true) */
  showText?: boolean;
  /** Milestone status override for color logic */
  status?: MilestoneStatus;
  /** Optional click handler for toggling or quick adjustments */
  onClick?: (e: React.MouseEvent) => void;
  /** Custom hover title */
  title?: string;
  /** Extra CSS classes */
  className?: string;
  /** If true, shows an interactive hover state */
  interactive?: boolean;
}

export const MiniProgressRing: React.FC<MiniProgressRingProps> = ({
  progress,
  size = 32,
  strokeWidth = 3,
  showText = true,
  status,
  onClick,
  title,
  className = '',
  interactive = false
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // SVG dimensions
  const center = size / 2;
  const radius = Math.max(1, center - strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Determine color scheme based on progress and status
  let strokeColor = '#06b6d4'; // cyan-500
  let strokeTrackColor = '#1e293b'; // slate-800
  let textColor = 'text-cyan-400';
  let badgeGlow = 'rgba(6, 182, 212, 0.25)';

  if (status === 'delayed') {
    strokeColor = '#f43f5e'; // rose-500
    textColor = 'text-rose-400';
    badgeGlow = 'rgba(244, 63, 94, 0.25)';
  } else if (clampedProgress >= 100 || status === 'completed') {
    strokeColor = '#10b981'; // emerald-500
    textColor = 'text-emerald-400';
    badgeGlow = 'rgba(16, 185, 129, 0.3)';
  } else if (clampedProgress >= 50 || status === 'in_progress') {
    strokeColor = '#06b6d4'; // cyan-500
    textColor = 'text-cyan-400';
    badgeGlow = 'rgba(6, 182, 212, 0.25)';
  } else if (clampedProgress > 0) {
    strokeColor = '#818cf8'; // indigo-400
    textColor = 'text-indigo-300';
    badgeGlow = 'rgba(129, 140, 248, 0.2)';
  } else {
    // 0% upcoming
    strokeColor = '#475569'; // slate-600
    textColor = 'text-slate-400';
    badgeGlow = 'transparent';
  }

  // Determine tooltip label
  const tooltipText = title || `Completion: ${clampedProgress}%${status ? ` (${status})` : ''}`;

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Task progress: ${clampedProgress}%`}
      title={tooltipText}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        interactive || onClick
          ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'
          : ''
      } ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 origin-center overflow-visible"
      >
        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeTrackColor}
          strokeWidth={strokeWidth}
          strokeOpacity={0.8}
        />

        {/* Foreground Animated Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.3s ease',
            filter: clampedProgress > 0 ? `drop-shadow(0 0 2px ${badgeGlow})` : 'none'
          }}
        />
      </svg>

      {/* Center Label / Icon (if showText is true) */}
      {showText && (
        <div
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold leading-none ${textColor}`}
          style={{
            fontSize: size >= 40 ? '11px' : size >= 30 ? '9px' : '7.5px'
          }}
        >
          {clampedProgress >= 100 || status === 'completed' ? (
            <Check
              className="text-emerald-400 stroke-[3]"
              style={{
                width: size >= 32 ? '13px' : '10px',
                height: size >= 32 ? '13px' : '10px'
              }}
            />
          ) : clampedProgress === 0 ? (
            <span className="text-slate-500 font-normal">0%</span>
          ) : (
            <span>{clampedProgress}%</span>
          )}
        </div>
      )}
    </div>
  );
};
