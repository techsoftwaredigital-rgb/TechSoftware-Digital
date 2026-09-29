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
  let barGradient = 'from-cyan-600 via-sky-500 to-blue-600';
  let barGlow = 'shadow-xs';
  let badgeBorder = 'border-cyan-200';
  let badgeBg = 'bg-cyan-50';
  let badgeText = 'text-cyan-700';
  let statusText = 'In Progress';
  let statusIcon = <Clock className="w-3 h-3 text-cyan-600 animate-spin-slow" />;

  if (status === 'completed' || clampedProgress >= 100) {
    barGradient = 'from-emerald-600 via-teal-500 to-emerald-500';
    barGlow = 'shadow-xs';
    badgeBorder = 'border-emerald-200';
    badgeBg = 'bg-emerald-50';
    badgeText = 'text-emerald-700';
    statusText = 'Completed';
    statusIcon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
  } else if (status === 'delayed') {
    barGradient = 'from-rose-500 via-amber-500 to-rose-600';
    barGlow = 'shadow-xs';
    badgeBorder = 'border-rose-200';
    badgeBg = 'bg-rose-50';
    badgeText = 'text-rose-700';
    statusText = 'Delayed / Slippage';
    statusIcon = <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />;
  } else if (status === 'in_progress' || clampedProgress > 0) {
    barGradient = 'from-cyan-600 via-sky-500 to-blue-600';
    barGlow = 'shadow-xs';
    badgeBorder = 'border-cyan-200';
    badgeBg = 'bg-cyan-50';
    badgeText = 'text-cyan-700';
    statusText = clampedProgress > 0 ? `In Progress (${clampedProgress}%)` : 'In Progress';
    statusIcon = <Clock className="w-3 h-3 text-cyan-600" />;
  } else {
    // upcoming / 0%
    barGradient = 'from-slate-400 to-slate-300';
    barGlow = 'shadow-none';
    badgeBorder = 'border-slate-200';
    badgeBg = 'bg-slate-100';
    badgeText = 'text-slate-600';
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
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                • {completedDeliverablesCount}/{totalDeliverables} Tasks Done
              </span>
            )}
          </div>

          {/* Right Percentage Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs font-bold font-mono ${
                clampedProgress >= 100
                  ? 'text-emerald-700'
                  : clampedProgress >= 50
                  ? 'text-cyan-700'
                  : clampedProgress > 0
                  ? 'text-indigo-700'
                  : 'text-slate-500'
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
        <div className={`w-full ${trackHeight} rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner`}>
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
                          ? 'bg-emerald-600 border-emerald-500 shadow-xs'
                          : status === 'delayed'
                          ? 'bg-rose-600 border-rose-500 shadow-xs'
                          : 'bg-cyan-600 border-cyan-500 shadow-xs'
                        : 'bg-white border-slate-300'
                    } ${interactive ? 'hover:scale-125' : ''}`}
                  >
                    {step === 100 && isPassed && (
                      <Check className="w-1.5 h-1.5 text-white stroke-[3]" />
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
              className={`hover:text-cyan-700 transition-colors py-0.5 px-1 rounded ${
                clampedProgress === item.pct ? 'text-cyan-700 font-bold bg-slate-100' : ''
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
