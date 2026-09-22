import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  Cpu,
  Calendar,
  Filter,
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Quotation, ProjectMilestone, MilestoneStatus } from '../../types';
import { deriveMilestonesFromQuotations } from '../../utils/milestoneGenerator';

interface MilestoneProgressChartProps {
  quotations: Quotation[];
  customMilestones?: ProjectMilestone[];
  onSelectMilestone?: (milestone: ProjectMilestone) => void;
}

export const MilestoneProgressChart: React.FC<MilestoneProgressChartProps> = ({
  quotations,
  customMilestones = [],
  onSelectMilestone
}) => {
  // Chart visual style: 'bar' | 'area'
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  // Selected project / quote filter
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('all');

  // Filter only active quotations (In Progress, Booked, Completed, Sent)
  const activeQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
    );
  }, [quotations]);

  // Derive milestones for active quotations
  const allActiveMilestones = useMemo(() => {
    const activeList = selectedQuoteId === 'all'
      ? (activeQuotations.length > 0 ? activeQuotations : quotations)
      : quotations.filter((q) => q.id === selectedQuoteId || q.quotationNumber === selectedQuoteId);

    const derived = deriveMilestonesFromQuotations(activeList, customMilestones);

    // Sort chronologically by targetDate or estimatedCompletionDate
    return derived.sort((a, b) => {
      const dateA = new Date(a.estimatedCompletionDate || a.targetDate).getTime();
      const dateB = new Date(b.estimatedCompletionDate || b.targetDate).getTime();
      return dateA - dateB;
    });
  }, [quotations, activeQuotations, customMilestones, selectedQuoteId]);

  // Prepare chart dataset
  const chartData = useMemo(() => {
    let runningCompletedPoints = 0;

    return allActiveMilestones.map((m, index) => {
      const completionPercent = m.progressPercent !== undefined
        ? m.progressPercent
        : m.status === 'completed'
        ? 100
        : m.status === 'in_progress'
        ? 50
        : 0;

      if (m.status === 'completed') {
        runningCompletedPoints += 100;
      } else if (m.status === 'in_progress') {
        runningCompletedPoints += 50;
      }

      // Cumulative trajectory % up to this milestone
      const cumulativeProgress = Math.min(
        100,
        Math.round((runningCompletedPoints / ((index + 1) * 100)) * 100)
      );

      // Short label for X-axis
      const shortName = m.title.length > 18 ? `${m.title.slice(0, 16)}...` : m.title;

      return {
        id: m.id,
        rawMilestone: m,
        name: shortName,
        fullTitle: m.title,
        moduleName: m.moduleName || 'General',
        phase: m.phase,
        completionPercent,
        cumulativeProgress,
        targetDate: m.targetDate,
        estimatedCompletionDate: m.estimatedCompletionDate || m.targetDate,
        status: m.status,
        quotationNumber: m.quotationNumber,
        isCustom: m.isCustom
      };
    });
  }, [allActiveMilestones]);

  // Summary Metrics
  const totalMilestones = chartData.length;
  const completedMilestones = chartData.filter((d) => d.status === 'completed').length;
  const inProgressMilestones = chartData.filter((d) => d.status === 'in_progress').length;
  const overallAvgCompletion = totalMilestones > 0
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.completionPercent, 0) / totalMilestones)
    : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs text-white">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {data.phase}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              #{data.quotationNumber}
            </span>
          </div>

          <div>
            <p className="font-bold text-slate-100 text-sm">{data.fullTitle}</p>
            {data.moduleName && (
              <p className="text-[11px] text-indigo-300 flex items-center gap-1 mt-0.5">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span>{data.moduleName}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Completion</span>
              <span className="font-extrabold text-cyan-400 text-sm">
                {data.completionPercent}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Status</span>
              <span
                className={`font-semibold capitalize ${
                  data.status === 'completed'
                    ? 'text-emerald-400'
                    : data.status === 'in_progress'
                    ? 'text-cyan-400'
                    : 'text-amber-400'
                }`}
              >
                {data.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Target Date</span>
              <span className="font-mono text-slate-300">{data.targetDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Est. Delivery</span>
              <span className="font-mono text-cyan-300 font-bold">{data.estimatedCompletionDate}</span>
            </div>
          </div>

          {chartType === 'area' && (
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Cumulative Project Velocity:</span>
              <span className="text-cyan-300 font-bold">{data.cumulativeProgress}%</span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 italic text-center pt-0.5">
            Click bar to inspect milestone details
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Milestone Completion % Progress</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800">
                  Recharts Analytics
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizing completion velocity across deliverables and scoped software modules
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Quotation Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[170px] truncate text-xs"
              title="Filter by active project quotation"
            >
              <option value="all" className="bg-slate-900">All Active Projects ({activeQuotations.length})</option>
              {activeQuotations.map((q) => (
                <option key={q.id} value={q.id} className="bg-slate-900">
                  {q.quotationNumber} - {q.customer.companyName || q.customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle: Bar vs Area */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="chart-type-bar-btn"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                chartType === 'bar'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Milestone Bars</span>
            </button>
            <button
              id="chart-type-area-btn"
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                chartType === 'area'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Velocity Area</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Velocity</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-cyan-400 font-mono">
              {overallAvgCompletion}%
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] text-slate-500">Average completion rate</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Completed</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {completedMilestones} / {totalMilestones}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500">Milestones fully signed off</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-cyan-400 block">Active Sprints</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-cyan-300 font-mono">
              {inProgressMilestones}
            </span>
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-500">In development now</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block">Target Threshold</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-white font-mono">
              100%
            </span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[10px] text-slate-500">Client acceptance baseline</span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full h-72 sm:h-80 pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <BarChart3 className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No active milestones found to chart.</p>
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedItem = state.activePayload[0].payload;
                  if (onSelectMilestone && clickedItem.rawMilestone) {
                    onSelectMilestone(clickedItem.rawMilestone);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="barGradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradUpcoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />

              <Tooltip content={<CustomTooltip />} />

              {/* 100% Target Acceptance Baseline */}
              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: '100% Target Delivery',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'top'
                }}
              />

              <Bar
                dataKey="completionPercent"
                name="Completion %"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
                className="cursor-pointer transition-all"
              >
                {chartData.map((entry, index) => {
                  let fillColor = 'url(#barGradUpcoming)';
                  if (entry.status === 'completed') {
                    fillColor = 'url(#barGradCompleted)';
                  } else if (entry.status === 'in_progress') {
                    fillColor = 'url(#barGradInProgress)';
                  }
                  return (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={fillColor}
                      stroke={entry.status === 'completed' ? '#34d399' : entry.status === 'in_progress' ? '#38bdf8' : '#818cf8'}
                      strokeWidth={1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedItem = state.activePayload[0].payload;
                  if (onSelectMilestone && clickedItem.rawMilestone) {
                    onSelectMilestone(clickedItem.rawMilestone);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="areaGradVelocity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="areaGradCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: '100% Target Delivery',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'top'
                }}
              />

              <Area
                type="monotone"
                dataKey="cumulativeProgress"
                name="Cumulative Velocity %"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradCumulative)"
              />

              <Area
                type="monotone"
                dataKey="completionPercent"
                name="Milestone Completion %"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaGradVelocity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer with Color Legend and Timeline Guidance */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
            <span>In Progress (50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
            <span>Scheduled (0%)</span>
          </div>
          {chartType === 'area' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>Cumulative Project Velocity</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any milestone bar or node to view details or adjust dates</span>
        </div>
      </div>
    </div>
  );
};
