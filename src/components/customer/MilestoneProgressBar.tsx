import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Check, Sparkles, Play, Flame } from 'lucide-react';
import { MilestoneStatus, ProjectMilestone } from '../../types';

interface MilestoneProgressBarProps {
  /** Completion percentage (0 - 100) */
  progress: number;
  /** Current milestone status */
  status: MilestoneStatus;
  /** Optional reference to the milestone object */
  milestone?: ProjectMilestone;
  /** Bar height / sizing variant: 'sm' | 'md' | 'lg' (default 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to render top label with status text and percentage (default true) */
  showLabel?: boolean;
  /** Whether to render quarter milestone checkpoint ticks (0%, 25%, 50%, 75%, 100%) (default true) */
  showCheckpoints?: boolean;
  /** Optional interactive mode allowing quick percentage / status stepping */
  interactive?: boolean;
  /** Callback to update milestone status */
  onUpdateStatus?: (newStatus: MilestoneStatus) => void;
  /** Callback to update milestone progress percentage */
  onUpdateProgress?: (newProgress: number) => void;
  /** Custom extra styling classes */
  className?: string;
}

export const MilestoneProgressBar: React.FC<MilestoneProgressBarProps> = ({
  progress,
  status,
  milestone,
  size = 'md',
  showLabel = true,
  showCheckpoints = true,
  interactive = false,
  onUpdateStatus,
  onUpdateProgress,
  className = ''
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Deliverables count if available
  const totalDeliverables = milestone?.deliverables?.length || 0;
  const completedDeliverablesCount = milestone?.completedDeliverables?.length ?? (
    status === 'completed'
      ? totalDeliverables
      : status === 'in_progress'
      ? Math.ceil(totalDeliverables * (clampedProgress / 100))
      : 0
  );

  // Status-driven styling variables
  let barGradient = 'from-cyan-500 via-sky-400 to-blue-500';
  let barGlow = 'shadow-cyan-500/20';
  let badgeBorder = 'border-cyan-800/80';
  let badgeBg = 'bg-cyan-950/80';
  let badgeText = 'text-cyan-300';
  let statusText = 'In Progress';
  let statusIcon = <Clock className="w-3 h-3 text-cyan-400 animate-spin-slow" />;

  if (status === 'completed' || clampedProgress >= 100) {
    barGradient = 'from-emerald-500 via-teal-400 to-emerald-400';
    barGlow = 'shadow-emerald-500/30';
    badgeBorder = 'border-emerald-800/80';
    badgeBg = 'bg-emerald-950/80';
    badgeText = 'text-emerald-300';
    statusText = 'Completed';
    statusIcon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
  } else if (status === 'delayed') {
    barGradient = 'from-rose-500 via-amber-500 to-rose-600';
    barGlow = 'shadow-rose-500/30';
    badgeBorder = 'border-rose-800/80';
    badgeBg = 'bg-rose-950/80';
    badgeText = 'text-rose-300';
    statusText = 'Delayed / Slippage';
    statusIcon = <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />;
  } else if (status === 'in_progress' || clampedProgress > 0) {
    barGradient = 'from-cyan-500 via-sky-400 to-blue-500';
    barGlow = 'shadow-cyan-500/25';
    badgeBorder = 'border-cyan-800/80';
    badgeBg = 'bg-cyan-950/80';
    badgeText = 'text-cyan-300';
    statusText = clampedProgress > 0 ? `In Progress (${clampedProgress}%)` : 'In Progress';
    statusIcon = <Clock className="w-3 h-3 text-cyan-400" />;
  } else {
    // upcoming / 0%
    barGradient = 'from-slate-600 to-slate-500';
    barGlow = 'shadow-none';
    badgeBorder = 'border-slate-800';
    badgeBg = 'bg-slate-950';
    badgeText = 'text-slate-400';
    statusText = 'Upcoming / Pending';
    statusIcon = <Clock className="w-3 h-3 text-slate-500" />;
  }

  // Height sizing
  const trackHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2.5';
  const indicatorSize = size === 'sm' ? 'w-2.5 h-2.5 -top-0.5' : size === 'lg' ? 'w-4 h-4 -top-0.5' : 'w-3.5 h-3.5 -top-0.5';

  const handleCheckpointClick = (targetPercent: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;

    if (onUpdateProgress) {
      onUpdateProgress(targetPercent);
    }
    if (onUpdateStatus) {
      if (targetPercent === 100) onUpdateStatus('completed');
      else if (targetPercent > 0) onUpdateStatus('in_progress');
      else onUpdateStatus('upcoming');
    }
  };

  return (
    <div
      className={`w-full space-y-1.5 select-none ${className}`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Milestone progress: ${clampedProgress}% (${status})`}
    >
      {/* Top Label & Status Header */}
      {showLabel && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${badgeBg} ${badgeBorder} ${badgeText}`}
            >
              {statusIcon}
              <span>{statusText}</span>
            </span>

            {/* Deliverables ratio if applicable */}
            {totalDeliverables > 0 && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                • {completedDeliverablesCount}/{totalDeliverables} Tasks Done
              </span>
            )}
          </div>

          {/* Right Percentage Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs font-bold font-mono ${
                clampedProgress >= 100
                  ? 'text-emerald-400'
                  : clampedProgress >= 50
                  ? 'text-cyan-400'
                  : clampedProgress > 0
                  ? 'text-indigo-300'
                  : 'text-slate-400'
              }`}
            >
              {clampedProgress}%
            </span>

            {interactive && (
              <span className="text-[9px] text-slate-500 hidden md:inline">
                (Click steps to update)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Track & Animated Fill Bar */}
      <div className="relative w-full">
        {/* Background Track */}
        <div className={`w-full ${trackHeight} rounded-full bg-slate-950 border border-slate-800/90 overflow-hidden relative shadow-inner`}>
          {/* Fill Bar */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out relative ${barGlow}`}
            style={{ width: `${clampedProgress}%` }}
          >
            {/* Animated Shimmer Stripe for In-Progress State */}
            {(status === 'in_progress' || (clampedProgress > 0 && clampedProgress < 100)) && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* Quarter Checkpoint Notches / Interactive Nodes */}
        {showCheckpoints && (
          <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
            {[0, 25, 50, 75, 100].map((step) => {
              const isPassed = clampedProgress >= step;
              const isCurrent = Math.abs(clampedProgress - step) < 12;

              return (
                <div
                  key={step}
                  onClick={(e) => handleCheckpointClick(step, e)}
                  title={interactive ? `Set progress to ${step}%` : `${step}% Checkpoint`}
                  className={`relative -top-1 flex flex-col items-center group/node ${
                    interactive ? 'pointer-events-auto cursor-pointer' : ''
                  }`}
                  style={{ left: `${step === 0 ? '0%' : step === 100 ? '100%' : `${step}%`}`, transform: 'translateX(-50%)' }}
                >
                  {/* Pin Dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                      isPassed
                        ? status === 'completed' || step === 100
                          ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-500/50'
                          : status === 'delayed'
                          ? 'bg-rose-400 border-rose-300 shadow-sm shadow-rose-500/50'
                          : 'bg-cyan-400 border-cyan-200 shadow-sm shadow-cyan-500/50'
                        : 'bg-slate-900 border-slate-700'
                    } ${interactive ? 'hover:scale-125' : ''}`}
                  >
                    {step === 100 && isPassed && (
                      <Check className="w-1.5 h-1.5 text-slate-950 stroke-[3]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Quick-Step Bar (when interactive is enabled) */}
      {interactive && (
        <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-slate-500">
          {[
            { label: '0% Start', pct: 0, status: 'upcoming' as const },
            { label: '25% Kickoff', pct: 25, status: 'in_progress' as const },
            { label: '50% Mid-Sprint', pct: 50, status: 'in_progress' as const },
            { label: '75% QA / Test', pct: 75, status: 'in_progress' as const },
            { label: '100% Done', pct: 100, status: 'completed' as const }
          ].map((item) => (
            <button
              key={item.pct}
              type="button"
              onClick={(e) => handleCheckpointClick(item.pct, e)}
              className={`hover:text-cyan-300 transition-colors py-0.5 px-1 rounded ${
                clampedProgress === item.pct ? 'text-cyan-400 font-bold bg-slate-800/80' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
