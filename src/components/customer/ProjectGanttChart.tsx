import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  GitBranch,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link2,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  Eye,
  Edit3,
  CalendarClock
} from 'lucide-react';
import { ProjectMilestone, MilestoneStatus } from '../../types';

interface ProjectGanttChartProps {
  milestones: ProjectMilestone[];
  onSelectMilestone?: (milestone: ProjectMilestone, startInEdit?: boolean) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: MilestoneStatus) => void;
}

// Normalized parsed milestone item for Gantt layout
interface GanttItem {
  milestone: ProjectMilestone;
  startDate: Date;
  endDate: Date;
  targetDate: Date;
  durationDays: number;
  varianceDays: number;
  isBlocked: boolean;
  rowIndex: number;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  milestones,
  onSelectMilestone,
  onUpdateMilestoneStatus
}) => {
  // Chart Display Toggles
  const [showDependencies, setShowDependencies] = useState(true);
  const [showTodayLine, setShowTodayLine] = useState(true);
  const [showBaselineTarget, setShowBaselineTarget] = useState(true);
  const [timeZoom, setTimeZoom] = useState<'fit' | 'weeks' | 'days'>('fit');
  const [groupByModule, setGroupByModule] = useState(false);

  // Hover states for interactive dependency tracing
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  // Floating tooltip state
  const [tooltipData, setTooltipData] = useState<{
    item: GanttItem;
    x: number;
    y: number;
  } | null>(null);

  // Container dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.max(entry.contentRect.width, 800));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Quick lookup map of all milestones
  const milestoneMap = useMemo(() => {
    return new Map(milestones.map((m) => [m.id, m]));
  }, [milestones]);

  // Check if a milestone is blocked by incomplete prerequisites
  const checkIsBlocked = (m: ProjectMilestone): boolean => {
    if (!m.dependencyIds || m.dependencyIds.length === 0) return false;
    return m.dependencyIds.some((id) => {
      const prereq = milestoneMap.get(id);
      return prereq && prereq.status !== 'completed';
    });
  };

  // Parse and sort items into sequential Gantt items
  const ganttItems: GanttItem[] = useMemo(() => {
    let sorted = [...milestones];

    if (groupByModule) {
      // Group by module name first, then by date
      sorted.sort((a, b) => {
        const modA = a.moduleName || 'Other';
        const modB = b.moduleName || 'Other';
        if (modA !== modB) return modA.localeCompare(modB);
        const dateA = a.estimatedCompletionDate || a.targetDate;
        const dateB = b.estimatedCompletionDate || b.targetDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    } else {
      // Chronological order by start date / estimated date
      sorted.sort((a, b) => {
        const dateA = a.startDate || a.targetDate;
        const dateB = b.startDate || b.targetDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    }

    return sorted.map((m, idx) => {
      const targetDate = new Date(m.targetDate);
      const endDate = new Date(m.estimatedCompletionDate || m.targetDate);

      // Determine clean start date
      let startDate: Date;
      if (m.startDate) {
        startDate = new Date(m.startDate);
      } else if (m.dependencyIds && m.dependencyIds.length > 0) {
        // Derive start date from prerequisites' latest end date
        const prereqEndTimes = m.dependencyIds
          .map((id) => milestoneMap.get(id))
          .filter(Boolean)
          .map((p) => new Date(p!.estimatedCompletionDate || p!.targetDate).getTime());
        if (prereqEndTimes.length > 0) {
          startDate = new Date(Math.max(...prereqEndTimes));
        } else {
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        startDate = new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      }

      // Minimum 2-day duration for visual presence
      if (endDate.getTime() <= startDate.getTime()) {
        endDate.setTime(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      }

      const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const varianceDays = Math.round((endDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      const isBlocked = checkIsBlocked(m) && m.status !== 'completed';

      return {
        milestone: m,
        startDate,
        endDate,
        targetDate,
        durationDays,
        varianceDays,
        isBlocked,
        rowIndex: idx
      };
    });
  }, [milestones, groupByModule, milestoneMap]);

  // Overall time bounds calculation
  const { minDate, maxDate } = useMemo(() => {
    if (ganttItems.length === 0) {
      const now = new Date();
      return {
        minDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        maxDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      };
    }

    const allStarts = ganttItems.map((d) => d.startDate.getTime());
    const allEnds = ganttItems.flatMap((d) => [d.endDate.getTime(), d.targetDate.getTime()]);

    const minTs = Math.min(...allStarts);
    const maxTs = Math.max(...allEnds);

    // Add padding margins (4 days before, 6 days after)
    const minD = new Date(minTs - 4 * 24 * 60 * 60 * 1000);
    const maxD = new Date(maxTs + 6 * 24 * 60 * 60 * 1000);

    return { minDate: minD, maxDate: maxD };
  }, [ganttItems]);

  // Layout sizing parameters
  const rowHeight = 52;
  const headerHeight = 60;
  const leftSidebarWidth = 300; // Fixed width for metadata table
  const chartHeight = headerHeight + ganttItems.length * rowHeight + 20;

  // Horizontal width of the Gantt timeline section
  const timelineWidth = useMemo(() => {
    const availableWidth = containerWidth - leftSidebarWidth;
    if (timeZoom === 'days') return Math.max(availableWidth, 1800);
    if (timeZoom === 'weeks') return Math.max(availableWidth, 1200);
    return Math.max(availableWidth, 800);
  }, [containerWidth, timeZoom]);

  // D3 Time Scale
  const timeScale = useMemo(() => {
    return d3.scaleTime().domain([minDate, maxDate]).range([0, timelineWidth]);
  }, [minDate, maxDate, timelineWidth]);

  // Month and Day Header Ticks computed using D3
  const timeTicks = useMemo(() => {
    // Generate week intervals
    const days = d3.timeDays(minDate, maxDate);
    const months = d3.timeMonths(minDate, maxDate);

    return { days, months };
  }, [minDate, maxDate]);

  // Today position
  const today = new Date();
  const todayX = timeScale(today);
  const isTodayVisible = today >= minDate && today <= maxDate;

  // Compute dependency paths for SVG connectors
  const dependencyLinks = useMemo(() => {
    const itemMap = new Map(ganttItems.map((it) => [it.milestone.id, it]));
    const links: {
      id: string;
      fromId: string;
      toId: string;
      fromItem: GanttItem;
      toItem: GanttItem;
      pathD: string;
      isHighlighted: boolean;
      status: 'completed' | 'blocked' | 'in_progress' | 'pending';
    }[] = [];

    ganttItems.forEach((succItem) => {
      if (!succItem.milestone.dependencyIds) return;

      succItem.milestone.dependencyIds.forEach((predId) => {
        const predItem = itemMap.get(predId);
        if (!predItem) return;

        const x1 = timeScale(predItem.endDate);
        const y1 = headerHeight + predItem.rowIndex * rowHeight + rowHeight / 2;

        const x2 = timeScale(succItem.startDate);
        const y2 = headerHeight + succItem.rowIndex * rowHeight + rowHeight / 2;

        // Path routing:
        let pathD = '';
        if (x2 >= x1 + 16) {
          // Clean forward curve
          const dx = x2 - x1;
          const cx1 = x1 + Math.max(16, dx * 0.45);
          const cx2 = x2 - Math.max(16, dx * 0.45);
          pathD = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
        } else {
          // Successor starts before or very near predecessor end -> route around
          const loopX = x1 + 18;
          const midY = (y1 + y2) / 2;
          const entryOffset = Math.max(0, x2 - 14);
          pathD = `M ${x1} ${y1} C ${loopX} ${y1}, ${loopX} ${midY}, ${loopX} ${midY} C ${loopX} ${y2}, ${entryOffset} ${y2}, ${x2} ${y2}`;
        }

        const isHighlighted =
          hoveredMilestoneId === predItem.milestone.id ||
          hoveredMilestoneId === succItem.milestone.id ||
          selectedMilestoneId === predItem.milestone.id ||
          selectedMilestoneId === succItem.milestone.id;

        let status: 'completed' | 'blocked' | 'in_progress' | 'pending' = 'pending';
        if (predItem.milestone.status === 'completed') {
          status = 'completed';
        } else if (predItem.milestone.status === 'in_progress') {
          status = 'in_progress';
        } else if (succItem.isBlocked) {
          status = 'blocked';
        }

        links.push({
          id: `link-${predId}-${succItem.milestone.id}`,
          fromId: predId,
          toId: succItem.milestone.id,
          fromItem: predItem,
          toItem: succItem,
          pathD,
          isHighlighted,
          status
        });
      });
    });

    return links;
  }, [ganttItems, timeScale, headerHeight, rowHeight, hoveredMilestoneId, selectedMilestoneId]);

  // Overall stats
  const totalItems = ganttItems.length;
  const completedItems = ganttItems.filter((i) => i.milestone.status === 'completed').length;
  const inProgressItems = ganttItems.filter((i) => i.milestone.status === 'in_progress').length;
  const blockedItems = ganttItems.filter((i) => i.isBlocked).length;
  const totalDependencyLinks = dependencyLinks.length;

  return (
    <div className="space-y-4">
      {/* Gantt Control & Customization Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Timescale Zoom */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Scale:
            </span>
            <button
              onClick={() => setTimeZoom('fit')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                timeZoom === 'fit' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fit Timeline
            </button>
            <button
              onClick={() => setTimeZoom('weeks')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                timeZoom === 'weeks' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Zoom
            </button>
            <button
              onClick={() => setTimeZoom('days')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                timeZoom === 'days' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Detailed Days
            </button>
          </div>

          {/* Grouping Toggle */}
          <button
            onClick={() => setGroupByModule((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              groupByModule
                ? 'bg-indigo-950 border-indigo-700 text-indigo-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Group by Module</span>
          </button>

          {/* Show Dependencies Toggle */}
          <button
            onClick={() => setShowDependencies((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showDependencies
                ? 'bg-cyan-950 border-cyan-800 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dependency Links ({totalDependencyLinks})</span>
          </button>

          {/* Show Baseline Target Toggle */}
          <button
            onClick={() => setShowBaselineTarget((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showBaselineTarget
                ? 'bg-emerald-950 border-emerald-800 text-emerald-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Baseline Targets</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-gradient-to-r from-emerald-500 to-teal-400 inline-block" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-gradient-to-r from-cyan-500 to-blue-500 inline-block" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-slate-700 border border-slate-600 inline-block" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-rose-600 inline-block" />
            <span>Blocked Prereq</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span>Dependency Arrow</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Gantt Container */}
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative"
      >
        {ganttItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No milestones available to display in Gantt view.</p>
          </div>
        ) : (
          <div className="flex w-full overflow-x-auto select-none relative custom-scrollbar">
            {/* LEFT FIXED/STICKY METADATA TABLE */}
            <div
              className="sticky left-0 z-30 bg-slate-900 border-r border-slate-800 shrink-0 shadow-lg"
              style={{ width: `${leftSidebarWidth}px` }}
            >
              {/* Header Cell */}
              <div
                className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 text-xs font-bold text-slate-300 uppercase tracking-wider"
              >
                <span>Software Module & Checkpoint</span>
                <span className="text-[10px] text-slate-500 lowercase">progress</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-800/80">
                {ganttItems.map((item) => {
                  const m = item.milestone;
                  const isHovered = hoveredMilestoneId === m.id;
                  const isSelected = selectedMilestoneId === m.id;
                  const progress = m.progressPercent ?? (m.status === 'completed' ? 100 : m.status === 'in_progress' ? 50 : 0);

                  return (
                    <div
                      key={`sidebar-${m.id}`}
                      onClick={() => {
                        setSelectedMilestoneId(m.id);
                        if (onSelectMilestone) onSelectMilestone(m, false);
                      }}
                      onMouseEnter={() => setHoveredMilestoneId(m.id)}
                      onMouseLeave={() => setHoveredMilestoneId(null)}
                      className={`h-[52px] px-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/60 text-white'
                          : isHovered
                          ? 'bg-slate-800/80 text-white'
                          : 'bg-slate-900 hover:bg-slate-800/50 text-slate-300'
                      }`}
                      title={`${m.title} - Click to view or edit details`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {m.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : item.isBlocked ? (
                            <Lock className="w-4 h-4 text-rose-400" />
                          ) : m.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block ml-0.5" />
                          )}
                        </div>

                        {/* Title & Module */}
                        <div className="truncate text-xs">
                          <div className="font-semibold truncate text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{m.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                            {m.moduleName && (
                              <span className="text-indigo-400 font-medium truncate">
                                {m.moduleName}
                              </span>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-400">#{m.quotationNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress percentage pill */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            m.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : m.status === 'in_progress'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SCROLLABLE GANTT TIMELINE CANVAS */}
            <div className="relative shrink-0" style={{ width: `${timelineWidth}px`, height: `${chartHeight}px` }}>
              <svg
                width={timelineWidth}
                height={chartHeight}
                className="overflow-visible block"
              >
                <defs>
                  {/* Arrow markers for dependency links */}
                  <marker
                    id="arrow-completed"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
                  </marker>

                  <marker
                    id="arrow-in-progress"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#06b6d4" />
                  </marker>

                  <marker
                    id="arrow-blocked"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f43f5e" />
                  </marker>

                  <marker
                    id="arrow-pending"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" />
                  </marker>

                  {/* Linear Gradients for Milestone Bars */}
                  <linearGradient id="grad-completed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>

                  <linearGradient id="grad-in-progress" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>

                  <linearGradient id="grad-delayed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  <linearGradient id="grad-upcoming" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>

                  <linearGradient id="grad-blocked" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#881337" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>

                {/* TIMELINE HEADER: Month & Day Axis */}
                <g className="timeline-header">
                  {/* Background for header */}
                  <rect
                    x={0}
                    y={0}
                    width={timelineWidth}
                    height={headerHeight}
                    fill="#020617"
                    className="border-b border-slate-800"
                  />
                  <line
                    x1={0}
                    y1={headerHeight}
                    x2={timelineWidth}
                    y2={headerHeight}
                    stroke="#1e293b"
                    strokeWidth={1.5}
                  />

                  {/* Day Grid Lines and Ticks */}
                  {timeTicks.days.map((day, idx) => {
                    const x = timeScale(day);
                    const isMonday = day.getDay() === 1;
                    const isFirstOfMonth = day.getDate() === 1;

                    return (
                      <g key={`day-tick-${idx}`}>
                        <line
                          x1={x}
                          y1={isMonday || isFirstOfMonth ? 28 : 42}
                          x2={x}
                          y2={chartHeight}
                          stroke={isMonday ? '#1e293b' : '#0f172a'}
                          strokeWidth={isMonday ? 1 : 0.5}
                          strokeDasharray={isMonday ? undefined : '2 4'}
                        />
                        {(timeZoom === 'days' || (timeZoom === 'weeks' && (isMonday || isFirstOfMonth))) && (
                          <text
                            x={x + 3}
                            y={50}
                            fill={isMonday ? '#94a3b8' : '#475569'}
                            fontSize={10}
                            fontFamily="monospace"
                            fontWeight={isMonday ? 'bold' : 'normal'}
                          >
                            {day.getDate()}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Month Ticks & Labels */}
                  {timeTicks.months.map((monthDate, idx) => {
                    const x = timeScale(monthDate);
                    const monthLabel = d3.timeFormat('%B %Y')(monthDate);
                    return (
                      <g key={`month-${idx}`}>
                        <line
                          x1={x}
                          y1={0}
                          x2={x}
                          y2={headerHeight}
                          stroke="#334155"
                          strokeWidth={1.5}
                        />
                        <text
                          x={x + 8}
                          y={20}
                          fill="#38bdf8"
                          fontSize={11}
                          fontWeight="bold"
                          letterSpacing="0.05em"
                        >
                          {monthLabel.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* ROW BACKGROUND TRACKS */}
                {ganttItems.map((item, idx) => {
                  const y = headerHeight + idx * rowHeight;
                  const isHovered = hoveredMilestoneId === item.milestone.id;
                  const isSelected = selectedMilestoneId === item.milestone.id;

                  return (
                    <g key={`row-track-${item.milestone.id}`}>
                      <rect
                        x={0}
                        y={y}
                        width={timelineWidth}
                        height={rowHeight}
                        fill={
                          isSelected
                            ? '#082f49'
                            : isHovered
                            ? '#1e293b'
                            : idx % 2 === 0
                            ? '#090d16'
                            : '#040711'
                        }
                        fillOpacity={isSelected ? 0.4 : isHovered ? 0.6 : 1}
                        className="transition-colors"
                      />
                      <line
                        x1={0}
                        y1={y + rowHeight}
                        x2={timelineWidth}
                        y2={y + rowHeight}
                        stroke="#1e293b"
                        strokeWidth={1}
                      />
                    </g>
                  );
                })}

                {/* TODAY VERTICAL INDICATOR LINE */}
                {showTodayLine && isTodayVisible && (
                  <g className="today-marker">
                    <line
                      x1={todayX}
                      y1={0}
                      x2={todayX}
                      y2={chartHeight}
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                    {/* Top Today Badge */}
                    <rect
                      x={todayX - 32}
                      y={4}
                      width={64}
                      height={20}
                      rx={6}
                      fill="#083344"
                      stroke="#06b6d4"
                      strokeWidth={1}
                    />
                    <text
                      x={todayX}
                      y={18}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      TODAY
                    </text>
                  </g>
                )}

                {/* DEPENDENCY ARROW LINKS (Cubic Bezier Curves) */}
                {showDependencies && (
                  <g className="dependency-links-group">
                    {dependencyLinks.map((link) => {
                      const markerUrl =
                        link.status === 'completed'
                          ? 'url(#arrow-completed)'
                          : link.status === 'in_progress'
                          ? 'url(#arrow-in-progress)'
                          : link.status === 'blocked'
                          ? 'url(#arrow-blocked)'
                          : 'url(#arrow-pending)';

                      const strokeColor =
                        link.status === 'completed'
                          ? '#10b981'
                          : link.status === 'in_progress'
                          ? '#06b6d4'
                          : link.status === 'blocked'
                          ? '#f43f5e'
                          : '#64748b';

                      const strokeWidth = link.isHighlighted ? 3 : 1.75;
                      const opacity = hoveredMilestoneId
                        ? link.isHighlighted
                          ? 1
                          : 0.15
                        : 0.75;

                      return (
                        <g key={link.id} className="transition-all duration-200">
                          <path
                            d={link.pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={link.status === 'blocked' ? '4 3' : undefined}
                            markerEnd={markerUrl}
                            opacity={opacity}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* GANTT MILESTONE BARS */}
                {ganttItems.map((item) => {
                  const m = item.milestone;
                  const y = headerHeight + item.rowIndex * rowHeight;
                  const barY = y + 10;
                  const barHeight = 28;

                  const startX = timeScale(item.startDate);
                  const endX = timeScale(item.endDate);
                  const barWidth = Math.max(24, endX - startX);

                  const targetX = timeScale(item.targetDate);

                  const progress = m.progressPercent ?? (m.status === 'completed' ? 100 : m.status === 'in_progress' ? 50 : 0);
                  const progressWidth = Math.round(barWidth * (progress / 100));

                  const isHovered = hoveredMilestoneId === m.id;
                  const isSelected = selectedMilestoneId === m.id;

                  // Bar fill gradient
                  const fillGrad =
                    m.status === 'completed'
                      ? 'url(#grad-completed)'
                      : item.isBlocked
                      ? 'url(#grad-blocked)'
                      : m.status === 'in_progress'
                      ? 'url(#grad-in-progress)'
                      : item.varianceDays > 0
                      ? 'url(#grad-delayed)'
                      : 'url(#grad-upcoming)';

                  return (
                    <g
                      key={`gantt-bar-${m.id}`}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedMilestoneId(m.id);
                        if (onSelectMilestone) onSelectMilestone(m, false);
                      }}
                      onMouseEnter={(e) => {
                        setHoveredMilestoneId(m.id);
                        const rect = containerRef.current?.getBoundingClientRect();
                        const pageX = e.clientX - (rect?.left || 0);
                        const pageY = e.clientY - (rect?.top || 0);
                        setTooltipData({ item, x: pageX, y: pageY });
                      }}
                      onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        const pageX = e.clientX - (rect?.left || 0);
                        const pageY = e.clientY - (rect?.top || 0);
                        setTooltipData({ item, x: pageX, y: pageY });
                      }}
                      onMouseLeave={() => {
                        setHoveredMilestoneId(null);
                        setTooltipData(null);
                      }}
                    >
                      {/* Baseline Contract Target Range Line (if toggled and differs from estimate) */}
                      {showBaselineTarget && (
                        <g className="baseline-target-indicator">
                          <line
                            x1={startX}
                            y1={barY + barHeight + 4}
                            x2={targetX}
                            y2={barY + barHeight + 4}
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="2 2"
                          />
                          {/* Baseline target notch */}
                          <line
                            x1={targetX}
                            y1={barY + barHeight + 1}
                            x2={targetX}
                            y2={barY + barHeight + 7}
                            stroke="#38bdf8"
                            strokeWidth={2}
                          />
                        </g>
                      )}

                      {/* Main Gantt Bar (Background) */}
                      <rect
                        x={startX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        fill={fillGrad}
                        stroke={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : '#334155'}
                        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                        className="transition-all duration-150"
                      />

                      {/* Progress Shading Overlay (Inner fill) */}
                      {progress > 0 && progress < 100 && (
                        <rect
                          x={startX}
                          y={barY}
                          width={progressWidth}
                          height={barHeight}
                          rx={6}
                          fill="#ffffff"
                          fillOpacity={0.15}
                        />
                      )}

                      {/* Milestone Diamond/Cap at Delivery Date */}
                      <g transform={`translate(${endX}, ${barY + barHeight / 2}) rotate(45)`}>
                        <rect
                          x={-4}
                          y={-4}
                          width={8}
                          height={8}
                          fill={m.status === 'completed' ? '#34d399' : '#38bdf8'}
                          stroke="#020617"
                          strokeWidth={1.5}
                        />
                      </g>

                      {/* Bar Content Label */}
                      <text
                        x={startX + 8}
                        y={barY + 18}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow-sm select-none"
                      >
                        {barWidth > 70
                          ? `${m.title.slice(0, Math.floor(barWidth / 8))} (${item.durationDays}d)`
                          : `${item.durationDays}d`}
                      </text>

                      {/* Status / Variance tag on the right of bar if space permits */}
                      {item.varianceDays !== 0 && (
                        <text
                          x={endX + 12}
                          y={barY + 18}
                          fill={item.varianceDays > 0 ? '#f59e0b' : '#34d399'}
                          fontSize={10}
                          fontWeight="bold"
                          fontFamily="monospace"
                          className="pointer-events-none"
                        >
                          {item.varianceDays > 0 ? `+${item.varianceDays}d delay` : `${Math.abs(item.varianceDays)}d ahead`}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* FLOATING HOVER TOOLTIP */}
        {tooltipData && (
          <div
            className="absolute z-50 pointer-events-none p-3.5 rounded-xl bg-slate-950/95 border border-cyan-500/50 text-white shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-sm transition-all"
            style={{
              left: `${Math.min(tooltipData.x + 15, containerWidth - 320)}px`,
              top: `${Math.max(10, tooltipData.y - 120)}px`
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {tooltipData.item.milestone.phase}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                #{tooltipData.item.milestone.quotationNumber}
              </span>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-100">{tooltipData.item.milestone.title}</div>
              {tooltipData.item.milestone.moduleName && (
                <div className="text-[11px] text-indigo-300 flex items-center gap-1 mt-0.5">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span>Module: {tooltipData.item.milestone.moduleName}</span>
                </div>
              )}
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Start Date</span>
                <span className="font-mono text-slate-200">
                  {tooltipData.item.startDate.toISOString().split('T')[0]}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Est. Completion</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {tooltipData.item.endDate.toISOString().split('T')[0]}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Target Date</span>
                <span className="font-mono text-slate-400">
                  {tooltipData.item.milestone.targetDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Duration</span>
                <span className="font-mono text-white font-bold">
                  {tooltipData.item.durationDays} Days
                </span>
              </div>
            </div>

            {/* Progress Bar in Tooltip */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Progress</span>
                <span className="font-bold text-white">
                  {tooltipData.item.milestone.progressPercent ??
                    (tooltipData.item.milestone.status === 'completed'
                      ? 100
                      : tooltipData.item.milestone.status === 'in_progress'
                      ? 50
                      : 0)}
                  %
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{
                    width: `${
                      tooltipData.item.milestone.progressPercent ??
                      (tooltipData.item.milestone.status === 'completed'
                        ? 100
                        : tooltipData.item.milestone.status === 'in_progress'
                        ? 50
                        : 0)
                    }%`
                  }}
                />
              </div>
            </div>

            {/* Dependency Status */}
            {tooltipData.item.milestone.dependencyIds &&
              tooltipData.item.milestone.dependencyIds.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80 text-[10px]">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-cyan-400" />
                    <span>Prerequisites ({tooltipData.item.milestone.dependencyIds.length}):</span>
                  </div>
                  {tooltipData.item.isBlocked ? (
                    <span className="text-rose-400 font-bold block">
                      ⚠️ Blocked until prerequisite modules complete
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold block">
                      ✓ All prerequisite dependencies met
                    </span>
                  )}
                </div>
              )}

            <div className="text-[10px] text-cyan-300 text-center font-medium pt-1">
              Click bar to edit schedule or inspect checklist
            </div>
          </div>
        )}
      </div>

      {/* Gantt Quick Summary Footer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <span>
            Showing <strong className="text-white">{totalItems}</strong> scheduled milestone bars
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-emerald-400">{completedItems}</strong> verified
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-cyan-400">{inProgressItems}</strong> in active development
          </span>
          {blockedItems > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-bold">
                {blockedItems} blocked by prerequisites
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">
            Hover over any milestone bar or dependency arrow to trace the critical path.
          </span>
        </div>
      </div>
    </div>
  );
};
