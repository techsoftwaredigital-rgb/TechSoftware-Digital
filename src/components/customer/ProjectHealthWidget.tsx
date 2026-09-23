import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Info,
  Filter,
  Sparkles,
  RefreshCw,
  AlertOctagon
} from 'lucide-react';
import { Quotation, ProjectMilestone, MilestoneStatus } from '../../types';
import { deriveMilestonesFromQuotations } from '../../utils/milestoneGenerator';
import { MilestoneProgressBar } from './MilestoneProgressBar';

interface ProjectHealthWidgetProps {
  quotations: Quotation[];
  customMilestones?: ProjectMilestone[];
  onSelectMilestone?: (milestone: ProjectMilestone) => void;
  onNavigateToCalendar?: () => void;
}

// Calculate days variance between targetDate and estimatedCompletionDate
export function calculateDateVariance(targetDateStr: string, estDateStr?: string) {
  if (!estDateStr || estDateStr === targetDateStr) {
    return { diffDays: 0, label: 'On Schedule', isDelayed: false, isAhead: false };
  }
  const target = new Date(targetDateStr).getTime();
  const est = new Date(estDateStr).getTime();
  const diffDays = Math.round((est - target) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { diffDays, label: `+${diffDays}d Delay`, isDelayed: true, isAhead: false };
  } else if (diffDays < 0) {
    return { diffDays, label: `${Math.abs(diffDays)}d Ahead`, isDelayed: false, isAhead: true };
  }
  return { diffDays: 0, label: 'On Schedule', isDelayed: false, isAhead: false };
}

export const ProjectHealthWidget: React.FC<ProjectHealthWidgetProps> = ({
  quotations,
  customMilestones = [],
  onSelectMilestone,
  onNavigateToCalendar
}) => {
  // Chart metric view: 'trajectory' (% progress) | 'days' (timeline calendar days)
  const [chartMetric, setChartMetric] = useState<'trajectory' | 'days'>('trajectory');
  // Selected Quote Filter
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('all');
  // Simulation toggle for testing schedule delays
  const [simulateDelay, setSimulateDelay] = useState<boolean>(false);
  // Hovered data point
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active quotations (In Progress, Booked, Completed, Sent)
  const activeQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
    );
  }, [quotations]);

  // Derive all active milestones
  const allActiveMilestones = useMemo(() => {
    const activeList = selectedQuoteId === 'all'
      ? (activeQuotations.length > 0 ? activeQuotations : quotations)
      : quotations.filter((q) => q.id === selectedQuoteId || q.quotationNumber === selectedQuoteId);

    const derived = deriveMilestonesFromQuotations(activeList, customMilestones);

    // Sort chronologically by targetDate or estimatedCompletionDate
    return derived.sort((a, b) => {
      const dateA = new Date(a.targetDate).getTime();
      const dateB = new Date(b.targetDate).getTime();
      return dateA - dateB;
    });
  }, [quotations, activeQuotations, customMilestones, selectedQuoteId]);

  // Prepare chart dataset comparing Predicted vs Actual with Delay Highlighting
  const chartData = useMemo(() => {
    if (allActiveMilestones.length === 0) return [];

    const totalCount = allActiveMilestones.length;
    const projectStartDate = new Date(allActiveMilestones[0].startDate || allActiveMilestones[0].targetDate).getTime();

    let cumulativeActualPoints = 0;

    return allActiveMilestones.map((m, idx) => {
      // 1. Predicted / Scheduled completion % (linear baseline trajectory to 100%)
      const predictedPercent = Math.round(((idx + 1) / totalCount) * 100);

      // 2. Actual completion % for this milestone
      const milestoneActualPercent = m.progressPercent !== undefined
        ? m.progressPercent
        : m.status === 'completed'
        ? 100
        : m.status === 'in_progress'
        ? 50
        : 0;

      cumulativeActualPoints += milestoneActualPercent;
      let actualCumulativePercent = Math.min(
        100,
        Math.round((cumulativeActualPoints / ((idx + 1) * 100)) * 100)
      );

      // Days from project start for timeline days view
      const targetTime = new Date(m.targetDate).getTime();
      let estTime = new Date(m.estimatedCompletionDate || m.targetDate).getTime();

      // If simulated delay is enabled and milestone is mid-project (e.g. index 2 or 3), inject a delay
      let effectiveEstimatedDate = m.estimatedCompletionDate || m.targetDate;
      let isSimulated = false;

      if (simulateDelay && idx === Math.min(2, totalCount - 1)) {
        isSimulated = true;
        const delayedObj = new Date(targetTime + 5 * 24 * 60 * 60 * 1000);
        effectiveEstimatedDate = delayedObj.toISOString().split('T')[0];
        estTime = delayedObj.getTime();
        // reduce actual cumulative progress to reflect delay lag
        actualCumulativePercent = Math.max(0, actualCumulativePercent - 25);
      } else if (simulateDelay && idx > Math.min(2, totalCount - 1)) {
        isSimulated = true;
        const delayedObj = new Date(targetTime + 4 * 24 * 60 * 60 * 1000);
        effectiveEstimatedDate = delayedObj.toISOString().split('T')[0];
        estTime = delayedObj.getTime();
        actualCumulativePercent = Math.max(0, actualCumulativePercent - 18);
      }

      const variance = calculateDateVariance(m.targetDate, effectiveEstimatedDate);

      const plannedDays = Math.max(1, Math.round((targetTime - projectStartDate) / (1000 * 60 * 60 * 24)));
      const actualDays = Math.max(1, Math.round((estTime - projectStartDate) / (1000 * 60 * 60 * 24)));

      // Delay gap in percentage (when actual lags behind predicted)
      const isProgressLagging = actualCumulativePercent < predictedPercent && m.status !== 'completed';
      const delayPercentageGap = isProgressLagging
        ? Math.max(0, predictedPercent - actualCumulativePercent)
        : variance.isDelayed
        ? Math.min(25, variance.diffDays * 5)
        : 0;

      // Delay days gap
      const delayDaysGap = Math.max(0, actualDays - plannedDays);

      const isDelayed = variance.isDelayed || isProgressLagging || m.status === 'delayed';

      // Short label
      const shortTitle = m.title.length > 16 ? `${m.title.slice(0, 14)}...` : m.title;

      return {
        id: m.id,
        rawMilestone: m,
        index: idx + 1,
        title: m.title,
        shortTitle,
        phase: m.phase,
        moduleName: m.moduleName || 'Core Feature',
        quotationNumber: m.quotationNumber,
        status: m.status,
        targetDate: m.targetDate,
        estimatedCompletionDate: effectiveEstimatedDate,
        variance,
        isDelayed,
        isSimulated,
        // Trajectory metrics (%):
        predictedProgress: predictedPercent,
        actualProgress: actualCumulativePercent,
        // Red delay highlight area: where actual lags behind predicted
        delayHighlightPercent: isDelayed ? delayPercentageGap : 0,
        delayBaselinePercent: Math.min(predictedPercent, actualCumulativePercent),
        // Days metrics:
        plannedDays,
        actualDays,
        delayDaysGap
      };
    });
  }, [allActiveMilestones, simulateDelay]);

  // Overall Health Metrics & Status Evaluation
  const healthMetrics = useMemo(() => {
    const total = chartData.length;
    if (total === 0) {
      return {
        score: 100,
        status: 'Optimal' as const,
        statusColor: 'emerald',
        delayedCount: 0,
        onTimeCount: 0,
        totalVarianceDays: 0,
        avgDelayDays: 0,
        completedCount: 0,
        criticalMilestones: []
      };
    }

    const delayedList = chartData.filter((d) => d.isDelayed || d.variance.diffDays > 0);
    const completedList = chartData.filter((d) => d.status === 'completed');
    const delayedCount = delayedList.length;
    const onTimeCount = total - delayedCount;

    const totalVarianceDays = chartData.reduce(
      (acc, curr) => acc + (curr.variance.diffDays > 0 ? curr.variance.diffDays : 0),
      0
    );
    const avgDelayDays = delayedCount > 0 ? Math.round((totalVarianceDays / delayedCount) * 10) / 10 : 0;

    // Health Score calculation (0 - 100)
    // Baseline: 100
    // Deduct for delayed milestones and slippage days
    let rawScore = 100 - (delayedCount * 14) - (totalVarianceDays * 3);
    const score = Math.max(20, Math.min(100, Math.round(rawScore)));

    let status: 'Optimal' | 'On Track' | 'At Risk' | 'Delayed' = 'Optimal';
    let statusColor: 'emerald' | 'cyan' | 'amber' | 'rose' = 'emerald';

    if (score >= 90 && delayedCount === 0) {
      status = 'Optimal';
      statusColor = 'emerald';
    } else if (score >= 78) {
      status = 'On Track';
      statusColor = 'cyan';
    } else if (score >= 60 || delayedCount === 1) {
      status = 'At Risk';
      statusColor = 'amber';
    } else {
      status = 'Delayed';
      statusColor = 'rose';
    }

    return {
      score,
      status,
      statusColor,
      delayedCount,
      onTimeCount,
      totalVarianceDays,
      avgDelayDays,
      completedCount: completedList.length,
      criticalMilestones: delayedList
    };
  }, [chartData]);

  // Custom Chart Tooltip
  const CustomHealthTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isDelayed = data.isDelayed;

      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5 max-w-sm text-white">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {data.phase}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                #{data.quotationNumber}
              </span>
            </div>
            {isDelayed ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 border border-rose-800 text-rose-300 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{data.variance.label || 'Schedule Delay'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>On Schedule</span>
              </span>
            )}
          </div>

          <div>
            <h4 className="font-bold text-white text-sm leading-snug">{data.title}</h4>
            <p className="text-[11px] text-indigo-300 flex items-center gap-1 mt-0.5">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>{data.moduleName}</span>
            </p>
          </div>

          {/* Metric Comparison */}
          {chartMetric === 'trajectory' ? (
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-cyan-400 block">Predicted Baseline</span>
                <span className="text-sm font-extrabold font-mono text-cyan-300">{data.predictedProgress}%</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">Actual Progress</span>
                <span className={`text-sm font-extrabold font-mono ${isDelayed ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {data.actualProgress}%
                </span>
              </div>
              {isDelayed && (
                <div className="col-span-2 pt-1 border-t border-rose-900/40 text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Delay Gap: {data.predictedProgress - data.actualProgress}% progress lag behind predicted trajectory</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-cyan-400 block">Planned Target</span>
                <span className="text-xs font-mono font-bold text-slate-200">{data.targetDate}</span>
                <span className="text-[10px] text-slate-400 block">Day {data.plannedDays}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">Actual / Estimated</span>
                <span className={`text-xs font-mono font-bold ${isDelayed ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {data.estimatedCompletionDate}
                </span>
                <span className="text-[10px] text-slate-400 block">Day {data.actualDays}</span>
              </div>
              {isDelayed && (
                <div className="col-span-2 pt-1 border-t border-rose-900/40 text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Schedule Slippage: {data.variance.diffDays} day delay highlighted in red</span>
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
            <span>Status: <strong className="capitalize text-slate-200">{data.status.replace('_', ' ')}</strong></span>
            {data.isSimulated && (
              <span className="text-amber-400 font-semibold">(Simulated Scenario)</span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="project-health-widget" className="space-y-4">
      {/* Widget Main Container */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              healthMetrics.statusColor === 'emerald'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400 shadow-md shadow-emerald-950/40'
                : healthMetrics.statusColor === 'cyan'
                ? 'bg-cyan-950/80 border-cyan-700/60 text-cyan-400 shadow-md shadow-cyan-950/40'
                : healthMetrics.statusColor === 'amber'
                ? 'bg-amber-950/80 border-amber-700/60 text-amber-400 shadow-md shadow-amber-950/40'
                : 'bg-rose-950/80 border-rose-700/60 text-rose-400 shadow-md shadow-rose-950/40 animate-pulse'
            }`}>
              <Activity className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Project Health</span>
                  <span className="text-xs font-normal text-slate-400">| Predictive Timeline & Milestones</span>
                </h3>

                {/* Health Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${
                  healthMetrics.statusColor === 'emerald'
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                    : healthMetrics.statusColor === 'cyan'
                    ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                    : healthMetrics.statusColor === 'amber'
                    ? 'bg-amber-950 border-amber-800 text-amber-300'
                    : 'bg-rose-950 border-rose-700 text-rose-300 shadow-sm shadow-rose-950'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    healthMetrics.statusColor === 'emerald'
                      ? 'bg-emerald-400 animate-pulse'
                      : healthMetrics.statusColor === 'cyan'
                      ? 'bg-cyan-400'
                      : healthMetrics.statusColor === 'amber'
                      ? 'bg-amber-400'
                      : 'bg-rose-500 animate-ping'
                  }`} />
                  <span>{healthMetrics.status}</span>
                  <span className="text-[10px] opacity-80">({healthMetrics.score}/100)</span>
                </span>

                {healthMetrics.delayedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/90 border border-rose-800 text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{healthMetrics.delayedCount} Delayed Milestones</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-0.5">
                Area chart comparison of predicted completion velocity vs. actual sprint deliveries, highlighting schedule delays in red.
              </p>
            </div>
          </div>

          {/* Controls: Metric Toggle & Simulation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Metric Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMetric('trajectory')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMetric === 'trajectory'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Completion % Trajectory</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMetric('days')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMetric === 'days'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Timeline Days (Calendar)</span>
              </button>
            </div>

            {/* Quote Selector Filter */}
            {activeQuotations.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-slate-900">All Project Quotations</option>
                  {activeQuotations.map((q) => (
                    <option key={q.id} value={q.id} className="bg-slate-900">
                      {q.quotationNumber} ({q.customer.companyName || 'Project'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delay Simulation Button */}
            <button
              type="button"
              id="simulate-delay-btn"
              onClick={() => setSimulateDelay((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                simulateDelay
                  ? 'bg-rose-950 border-rose-700 text-rose-300 shadow-md shadow-rose-950/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title="Toggle to simulate a 5-day schedule delay and observe live red delay area highlighting"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${simulateDelay ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{simulateDelay ? 'Simulated Delay (Active)' : 'Simulate Delay'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Health Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80">
          {/* Health Score */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Project Health Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                healthMetrics.statusColor === 'emerald'
                  ? 'text-emerald-400'
                  : healthMetrics.statusColor === 'cyan'
                  ? 'text-cyan-400'
                  : healthMetrics.statusColor === 'amber'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {healthMetrics.score}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Calculated on-time velocity index
            </span>
          </div>

          {/* On-Time vs Delayed Ratio */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Delivery Status</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {healthMetrics.onTimeCount}
                </span>
                <span className="text-xs text-slate-500">/ {chartData.length}</span>
              </div>
              {healthMetrics.delayedCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-rose-950 border border-rose-800 text-rose-300">
                  {healthMetrics.delayedCount} Delayed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-emerald-950 border border-emerald-800 text-emerald-300">
                  100% On-Time
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Milestone execution fidelity
            </span>
          </div>

          {/* Delay Variance Highlight */}
          <div className={`p-3.5 rounded-2xl border ${
            healthMetrics.totalVarianceDays > 0
              ? 'bg-rose-950/30 border-rose-800/80 shadow-inner'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[11px] font-medium block text-slate-400">
              Schedule Slippage (Days)
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-2xl font-black font-mono ${
                healthMetrics.totalVarianceDays > 0 ? 'text-rose-400' : 'text-cyan-400'
              }`}>
                {healthMetrics.totalVarianceDays > 0 ? `+${healthMetrics.totalVarianceDays} Days` : '0 Days'}
              </span>
              <AlertTriangle className={`w-4 h-4 ${
                healthMetrics.totalVarianceDays > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-600'
              }`} />
            </div>
            <span className={`text-[10px] block mt-0.5 font-medium ${
              healthMetrics.totalVarianceDays > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'
            }`}>
              {healthMetrics.totalVarianceDays > 0
                ? 'Delays highlighted in red below'
                : 'Project pacing on scheduled baseline'}
            </span>
          </div>

          {/* Project Completion Stage */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Completed Sprints</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">
                  {healthMetrics.completedCount}
                </span>
                <span className="text-xs text-slate-500">/ {chartData.length}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Verified deliverables & client demos
            </span>
          </div>
        </div>

        {/* Delay Alert Banner (Rendered when delayed milestones exist) */}
        {healthMetrics.delayedCount > 0 && (
          <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-700/80 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/30">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-rose-900/80 text-rose-300 shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4 text-rose-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-100 flex items-center gap-1.5">
                  <span>Schedule Drift Detected: {healthMetrics.delayedCount} Milestone{healthMetrics.delayedCount > 1 ? 's' : ''} Behind Predicted Target</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-900 border border-rose-600 text-rose-200 font-mono">
                    +{healthMetrics.totalVarianceDays} Days Slippage
                  </span>
                </p>
                <p className="text-[11px] text-rose-300 mt-0.5">
                  The red shaded area in the chart highlights the schedule slippage between scheduled target milestones and revised completion forecasts.
                </p>
              </div>
            </div>

            {onNavigateToCalendar && (
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 shrink-0 self-start sm:self-auto"
              >
                Inspect in Gantt & Calendar
              </button>
            )}
          </div>
        )}

        {/* Legend & Instructions Bar */}
        <div className="px-5 pt-4 pb-1 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Predicted Curve Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400 inline-block" />
              <span className="text-slate-300 font-medium">
                {chartMetric === 'trajectory' ? 'Predicted Completion Timeline (Planned Baseline)' : 'Planned Target Days'}
              </span>
            </div>

            {/* Actual Curve Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400 inline-block" />
              <span className="text-slate-300 font-medium">
                {chartMetric === 'trajectory' ? 'Actual Milestone Progress' : 'Actual / Estimated Delivery Days'}
              </span>
            </div>

            {/* Delay Area in Red Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-rose-600 to-red-500 border border-rose-400 inline-block animate-pulse" />
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span>Schedule Delay Slippage (In Red)</span>
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hover over any milestone point to inspect exact dates and variance</span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="p-4 sm:p-5 pt-2">
          {chartData.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No active milestones found for this selection.</p>
              <p className="text-xs text-slate-500 mt-1">Accept or book a quotation to track predictive timelines.</p>
            </div>
          ) : (
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setHoveredIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <defs>
                    {/* Cyan / Blue Gradient for Predicted Timeline */}
                    <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>

                    {/* Emerald Gradient for Actual Milestone Progress */}
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>

                    {/* Red / Rose Gradient Highlighting Schedule Delays */}
                    <linearGradient id="delayRedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.75} />
                      <stop offset="50%" stopColor="#dc2626" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0.08} />
                    </linearGradient>

                    {/* Hatch pattern for delayed zones */}
                    <pattern id="delayStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.4" />
                    </pattern>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                  <XAxis
                    dataKey="shortTitle"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={chartMetric === 'trajectory' ? [0, 100] : [0, 'auto']}
                    unit={chartMetric === 'trajectory' ? '%' : 'd'}
                  />

                  <Tooltip content={<CustomHealthTooltip />} />

                  {/* 100% Target Reference Line in Trajectory View */}
                  {chartMetric === 'trajectory' && (
                    <ReferenceLine
                      y={100}
                      stroke="#059669"
                      strokeDasharray="4 4"
                      label={{
                        value: '100% Full Delivery',
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideTopRight'
                      }}
                    />
                  )}

                  {chartMetric === 'trajectory' ? (
                    <>
                      {/* Predicted Project Completion Timeline (Planned Baseline) */}
                      <Area
                        type="monotone"
                        dataKey="predictedProgress"
                        name="Predicted Timeline"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="url(#predictedGradient)"
                        activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Actual Milestones Progress (Emerald when healthy) */}
                      <Area
                        type="monotone"
                        dataKey="actualProgress"
                        name="Actual Progress"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#actualGradient)"
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Schedule Delay Highlight Area (RED) - Highlights where actual progress is delayed */}
                      <Area
                        type="monotone"
                        dataKey="delayHighlightPercent"
                        name="Schedule Delay"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#delayRedGradient)"
                        activeDot={{ r: 7, fill: '#ef4444', stroke: '#fecaca', strokeWidth: 2 }}
                      />
                    </>
                  ) : (
                    <>
                      {/* Planned Target Days */}
                      <Area
                        type="monotone"
                        dataKey="plannedDays"
                        name="Planned Days"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="url(#predictedGradient)"
                        activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Actual / Forecasted Days */}
                      <Area
                        type="monotone"
                        dataKey="actualDays"
                        name="Actual Days"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#actualGradient)"
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Schedule Delay Slippage Days Highlighted in RED */}
                      <Area
                        type="monotone"
                        dataKey="delayDaysGap"
                        name="Days Delayed"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#delayRedGradient)"
                        activeDot={{ r: 7, fill: '#ef4444', stroke: '#fecaca', strokeWidth: 2 }}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Milestone Breakdown Bar with Delay Indicators */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Milestone Trajectory Breakdown & Critical Path</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {chartData.length} sequential milestones tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {chartData.map((item, idx) => {
              const isSelected = hoveredIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMilestone && onSelectMilestone(item.rawMilestone)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    item.isDelayed
                      ? 'bg-rose-950/20 border-rose-800/80 hover:bg-rose-950/40 shadow-sm shadow-rose-950/30'
                      : isSelected
                      ? 'bg-slate-800 border-cyan-500'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                      #{idx + 1} {item.phase}
                    </span>

                    {/* Delay Badge in Red vs On Track in Emerald */}
                    {item.isDelayed ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{item.variance.label || 'Delayed'}</span>
                      </span>
                    ) : item.status === 'completed' ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                        On Schedule
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Target Deadline</span>
                      <span className="font-mono text-slate-300 text-[10px]">{item.targetDate}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block">
                        {item.isDelayed ? 'Forecast / Actual' : 'Est. Delivery'}
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${item.isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.estimatedCompletionDate}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar beneath milestone in health widget */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <MilestoneProgressBar
                      progress={item.actualProgress}
                      status={item.isDelayed ? 'delayed' : item.status}
                      milestone={item.rawMilestone}
                      size="sm"
                      showLabel={true}
                      showCheckpoints={false}
                      interactive={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
