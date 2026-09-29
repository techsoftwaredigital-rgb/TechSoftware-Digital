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
        <div className="bg-white/95 border border-slate-200 p-3.5 rounded-2xl shadow-xl backdrop-blur-md text-xs space-y-2.5 max-w-sm text-slate-800">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {data.phase}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                #{data.quotationNumber}
              </span>
            </div>
            {isDelayed ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>{data.variance.label || 'Schedule Delay'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>On Schedule</span>
              </span>
            )}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">{data.title}</h4>
            <p className="text-[11px] text-indigo-700 flex items-center gap-1 mt-0.5">
              <Cpu className="w-3 h-3 text-indigo-600" />
              <span>{data.moduleName}</span>
            </p>
          </div>

          {/* Metric Comparison */}
          {chartMetric === 'trajectory' ? (
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[9px] uppercase font-bold text-cyan-700 block">Predicted Baseline</span>
                <span className="text-sm font-extrabold font-mono text-cyan-800">{data.predictedProgress}%</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-700 block">Actual Progress</span>
                <span className={`text-sm font-extrabold font-mono ${isDelayed ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {data.actualProgress}%
                </span>
              </div>
              {isDelayed && (
                <div className="col-span-2 pt-1 border-t border-rose-200 text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Delay Gap: {data.predictedProgress - data.actualProgress}% progress lag behind predicted trajectory</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[9px] uppercase font-bold text-cyan-700 block">Planned Target</span>
                <span className="text-xs font-mono font-bold text-slate-800">{data.targetDate}</span>
                <span className="text-[10px] text-slate-500 block">Day {data.plannedDays}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-700 block">Actual / Estimated</span>
                <span className={`text-xs font-mono font-bold ${isDelayed ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {data.estimatedCompletionDate}
                </span>
                <span className="text-[10px] text-slate-500 block">Day {data.actualDays}</span>
              </div>
              {isDelayed && (
                <div className="col-span-2 pt-1 border-t border-rose-200 text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Schedule Slippage: {data.variance.diffDays} day delay highlighted in red</span>
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
            <span>Status: <strong className="capitalize text-slate-800">{data.status.replace('_', ' ')}</strong></span>
            {data.isSimulated && (
              <span className="text-amber-700 font-semibold">(Simulated Scenario)</span>
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
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Header Bar */}
        <div className="p-5 bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              healthMetrics.statusColor === 'emerald'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
                : healthMetrics.statusColor === 'cyan'
                ? 'bg-cyan-50 border-cyan-200 text-cyan-700 shadow-xs'
                : healthMetrics.statusColor === 'amber'
                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
                : 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs animate-pulse'
            }`}>
              <Activity className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Project Health</span>
                  <span className="text-xs font-normal text-slate-500">| Predictive Timeline & Milestones</span>
                </h3>

                {/* Health Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${
                  healthMetrics.statusColor === 'emerald'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : healthMetrics.statusColor === 'cyan'
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    : healthMetrics.statusColor === 'amber'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    healthMetrics.statusColor === 'emerald'
                      ? 'bg-emerald-500 animate-pulse'
                      : healthMetrics.statusColor === 'cyan'
                      ? 'bg-cyan-500'
                      : healthMetrics.statusColor === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500 animate-ping'
                  }`} />
                  <span>{healthMetrics.status}</span>
                  <span className="text-[10px] opacity-80">({healthMetrics.score}/100)</span>
                </span>

                {healthMetrics.delayedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{healthMetrics.delayedCount} Delayed Milestones</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-0.5">
                Area chart comparison of predicted completion velocity vs. actual sprint deliveries, highlighting schedule delays in red.
              </p>
            </div>
          </div>

          {/* Controls: Metric Toggle & Simulation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Metric Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMetric('trajectory')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartMetric === 'trajectory'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Timeline Days (Calendar)</span>
              </button>
            </div>

            {/* Quote Selector Filter */}
            {activeQuotations.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <Filter className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="bg-transparent text-slate-800 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-white">All Project Quotations</option>
                  {activeQuotations.map((q) => (
                    <option key={q.id} value={q.id} className="bg-white">
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
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              title="Toggle to simulate a 5-day schedule delay and observe live red delay area highlighting"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${simulateDelay ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{simulateDelay ? 'Simulated Delay (Active)' : 'Simulate Delay'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Health Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/60 border-b border-slate-200">
          {/* Health Score */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Project Health Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                healthMetrics.statusColor === 'emerald'
                  ? 'text-emerald-700'
                  : healthMetrics.statusColor === 'cyan'
                  ? 'text-cyan-700'
                  : healthMetrics.statusColor === 'amber'
                  ? 'text-amber-700'
                  : 'text-rose-700'
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
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Delivery Status</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {healthMetrics.onTimeCount}
                </span>
                <span className="text-xs text-slate-500">/ {chartData.length}</span>
              </div>
              {healthMetrics.delayedCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700">
                  {healthMetrics.delayedCount} Delayed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
                  100% On-Time
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Milestone execution fidelity
            </span>
          </div>

          {/* Delay Variance Highlight */}
          <div className={`p-3.5 rounded-2xl border shadow-xs ${
            healthMetrics.totalVarianceDays > 0
              ? 'bg-rose-50/50 border-rose-200'
              : 'bg-white border-slate-200'
          }`}>
            <span className="text-[11px] font-medium block text-slate-500">
              Schedule Slippage (Days)
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-2xl font-black font-mono ${
                healthMetrics.totalVarianceDays > 0 ? 'text-rose-700' : 'text-cyan-700'
              }`}>
                {healthMetrics.totalVarianceDays > 0 ? `+${healthMetrics.totalVarianceDays} Days` : '0 Days'}
              </span>
              <AlertTriangle className={`w-4 h-4 ${
                healthMetrics.totalVarianceDays > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
              }`} />
            </div>
            <span className={`text-[10px] block mt-0.5 font-medium ${
              healthMetrics.totalVarianceDays > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'
            }`}>
              {healthMetrics.totalVarianceDays > 0
                ? 'Delays highlighted in red below'
                : 'Project pacing on scheduled baseline'}
            </span>
          </div>

          {/* Project Completion Stage */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Completed Sprints</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {healthMetrics.completedCount}
                </span>
                <span className="text-xs text-slate-500">/ {chartData.length}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Verified deliverables & client demos
            </span>
          </div>
        </div>

        {/* Delay Alert Banner (Rendered when delayed milestones exist) */}
        {healthMetrics.delayedCount > 0 && (
          <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span>Schedule Drift Detected: {healthMetrics.delayedCount} Milestone{healthMetrics.delayedCount > 1 ? 's' : ''} Behind Predicted Target</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 border border-rose-300 text-rose-800 font-mono">
                    +{healthMetrics.totalVarianceDays} Days Slippage
                  </span>
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5">
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
              <span className="text-slate-700 font-medium">
                {chartMetric === 'trajectory' ? 'Predicted Completion Timeline (Planned Baseline)' : 'Planned Target Days'}
              </span>
            </div>

            {/* Actual Curve Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400 inline-block" />
              <span className="text-slate-700 font-medium">
                {chartMetric === 'trajectory' ? 'Actual Milestone Progress' : 'Actual / Estimated Delivery Days'}
              </span>
            </div>

            {/* Delay Area in Red Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-rose-600 to-red-500 border border-rose-400 inline-block animate-pulse" />
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <span>Schedule Delay Slippage (In Red)</span>
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-600" />
            <span>Hover over any milestone point to inspect exact dates and variance</span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="p-4 sm:p-5 pt-2">
          {chartData.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No active milestones found for this selection.</p>
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
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>

                    {/* Emerald Gradient for Actual Milestone Progress */}
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>

                    {/* Red / Rose Gradient Highlighting Schedule Delays */}
                    <linearGradient id="delayRedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.65} />
                      <stop offset="50%" stopColor="#dc2626" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0.05} />
                    </linearGradient>

                    {/* Hatch pattern for delayed zones */}
                    <pattern id="delayStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.4" />
                    </pattern>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                  <XAxis
                    dataKey="shortTitle"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />

                  <YAxis
                    stroke="#94a3b8"
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
                        stroke="#0891b2"
                        strokeWidth={2.5}
                        fill="url(#predictedGradient)"
                        activeDot={{ r: 6, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Actual Milestones Progress (Emerald when healthy) */}
                      <Area
                        type="monotone"
                        dataKey="actualProgress"
                        name="Actual Progress"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fill="url(#actualGradient)"
                        activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Schedule Delay Highlight Area (RED) - Highlights where actual progress is delayed */}
                      <Area
                        type="monotone"
                        dataKey="delayHighlightPercent"
                        name="Schedule Delay"
                        stroke="#dc2626"
                        strokeWidth={2.5}
                        fill="url(#delayRedGradient)"
                        activeDot={{ r: 7, fill: '#dc2626', stroke: '#fee2e2', strokeWidth: 2 }}
                      />
                    </>
                  ) : (
                    <>
                      {/* Planned Target Days */}
                      <Area
                        type="monotone"
                        dataKey="plannedDays"
                        name="Planned Days"
                        stroke="#0891b2"
                        strokeWidth={2.5}
                        fill="url(#predictedGradient)"
                        activeDot={{ r: 6, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Actual / Forecasted Days */}
                      <Area
                        type="monotone"
                        dataKey="actualDays"
                        name="Actual Days"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fill="url(#actualGradient)"
                        activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Schedule Delay Slippage Days Highlighted in RED */}
                      <Area
                        type="monotone"
                        dataKey="delayDaysGap"
                        name="Days Delayed"
                        stroke="#dc2626"
                        strokeWidth={3}
                        fill="url(#delayRedGradient)"
                        activeDot={{ r: 7, fill: '#dc2626', stroke: '#fee2e2', strokeWidth: 2 }}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Milestone Breakdown Bar with Delay Indicators */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              <span>Milestone Trajectory Breakdown & Critical Path</span>
            </span>
            <span className="text-[11px] text-slate-500">
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
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50 shadow-xs'
                      : isSelected
                      ? 'bg-white border-cyan-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      #{idx + 1} {item.phase}
                    </span>

                    {/* Delay Badge in Red vs On Track in Emerald */}
                    {item.isDelayed ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{item.variance.label || 'Delayed'}</span>
                      </span>
                    ) : item.status === 'completed' ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                        On Schedule
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Target Deadline</span>
                      <span className="font-mono text-slate-700 text-[10px]">{item.targetDate}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block">
                        {item.isDelayed ? 'Forecast / Actual' : 'Est. Delivery'}
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${item.isDelayed ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {item.estimatedCompletionDate}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar beneath milestone in health widget */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
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
