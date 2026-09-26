import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import { Project, ProjectMilestone, MilestonePhase, MilestoneStatus } from '../../types';

interface ProjectGanttChartProps {
  project?: Project;
  milestones: ProjectMilestone[];
  isMobileDeviceView?: boolean;
  onSelectMilestone?: (milestone: ProjectMilestone, inEdit?: boolean) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: MilestoneStatus) => void;
}

interface GanttBarItem {
  id: string;
  title: string;
  phase: MilestonePhase;
  status: MilestoneStatus;
  moduleName?: string;
  deliverablesCount: number;
  startDate: string;
  targetDate: string;
  startOffsetDays: number;
  durationDays: number;
  progressPercent: number;
  paymentMilestone?: string;
  originalMilestone?: ProjectMilestone;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  project,
  milestones,
  isMobileDeviceView = false,
  onSelectMilestone,
  onUpdateMilestoneStatus
}) => {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);

  // Fallback project object if not provided (e.g. when used from ProjectCalendar view)
  const effectiveProject: Project = useMemo(() => {
    if (project) return project;
    return {
      id: 'proj-default',
      customerId: 'cust-all',
      customerName: 'Customer Projects',
      title: milestones[0]?.projectName || 'Active Software Development',
      description: 'Scheduled sprint deliverables and milestone progression',
      status: 'Development',
      startDate: milestones[0]?.startDate || '2026-09-18',
      expectedCompletionDate: milestones[milestones.length - 1]?.targetDate || '2026-10-25',
      amount: 150000,
      progressPercent: 50,
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-24T10:00:00Z'
    };
  }, [project, milestones]);

  // Filter project milestones or generate sensible defaults if none found
  const projectMilestones = useMemo(() => {
    if (!project) return milestones;
    const list = milestones.filter(
      (m) => m.quotationId === project.quotationId || m.projectName === project.title
    );
    if (list.length > 0) return list;

    // Fallback: generate default phased milestones based on project dates
    const start = new Date(effectiveProject.startDate || '2026-09-18');
    const end = new Date(effectiveProject.expectedCompletionDate || '2026-10-25');
    const totalSpanDays = Math.max(
      14,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    const defaultPhases: {
      phase: MilestonePhase;
      title: string;
      moduleName: string;
      startPercent: number;
      durationPercent: number;
      status: MilestoneStatus;
      deliverables: string[];
      paymentMilestone?: string;
    }[] = [
      {
        phase: 'Kickoff & Advance',
        title: 'Kickoff & Requirements Lock',
        moduleName: 'Architecture & Git Repo',
        startPercent: 0,
        durationPercent: 0.15,
        status: 'completed',
        deliverables: ['50% Advance Verified', 'Architecture Blueprint', 'Git Initialized'],
        paymentMilestone: '50% Advance'
      },
      {
        phase: 'Wireframe & Architecture',
        title: 'UI/UX Prototypes & Schema',
        moduleName: 'Figma & PostgreSQL',
        startPercent: 0.15,
        durationPercent: 0.25,
        status: 'completed',
        deliverables: ['Figma High-Fidelity UI', 'Relational Schema Modeling', 'API Spec Sign-off']
      },
      {
        phase: 'Sprint 1 Development',
        title: 'Sprint 1: Core Framework',
        moduleName: 'Auth & Layout Engine',
        startPercent: 0.35,
        durationPercent: 0.3,
        status: project.progressPercent >= 50 ? 'completed' : 'in_progress',
        deliverables: ['RBAC Auth', 'Dashboard Scaffold', 'Staging Deploy']
      },
      {
        phase: 'Sprint 2 Core Features',
        title: 'Sprint 2: Business Logic & APIs',
        moduleName: 'Payment & Business Logic',
        startPercent: 0.6,
        durationPercent: 0.25,
        status: project.progressPercent >= 75 ? 'completed' : 'in_progress',
        deliverables: ['Third-party APIs', 'POS/Store Integration', 'Payment Webhooks']
      },
      {
        phase: 'QA Testing & Security',
        title: 'QA, Security & Audit',
        moduleName: 'OWASP & Cross-Device QA',
        startPercent: 0.8,
        durationPercent: 0.12,
        status: 'upcoming',
        deliverables: ['Cross-device Browser QA', 'OWASP Security Scan', 'Lighthouse 90+ Audit']
      },
      {
        phase: 'Production Launch',
        title: 'Final Handover & Launch',
        moduleName: 'Production Cloud Deployment',
        startPercent: 0.9,
        durationPercent: 0.1,
        status: 'upcoming',
        deliverables: ['Domain DNS Pointing', 'Credentials & Code Handover'],
        paymentMilestone: 'Final 50% Balance'
      }
    ];

    return defaultPhases.map((dp, idx) => {
      const sDays = Math.round(totalSpanDays * dp.startPercent);
      const dDays = Math.max(3, Math.round(totalSpanDays * dp.durationPercent));
      const sDate = new Date(start);
      sDate.setDate(sDate.getDate() + sDays);
      const tDate = new Date(sDate);
      tDate.setDate(tDate.getDate() + dDays);

      return {
        id: `ms-fallback-${idx}`,
        quotationId: project.quotationId || 'quote-demo',
        quotationNumber: project.quotationNumber || 'TSD-2026',
        projectName: project.title,
        phase: dp.phase,
        title: dp.title,
        description: `Delivered by engineering team under ${dp.phase}`,
        startDate: sDate.toISOString().split('T')[0],
        targetDate: tDate.toISOString().split('T')[0],
        moduleName: dp.moduleName,
        status: dp.status,
        deliverables: dp.deliverables,
        paymentMilestone: dp.paymentMilestone,
        progressPercent: dp.status === 'completed' ? 100 : dp.status === 'in_progress' ? 60 : 0
      } as ProjectMilestone;
    });
  }, [milestones, project]);

  // Compute Gantt timeline bounds
  const { chartData, minDate, maxDate, totalTimelineDays, timelineWeeks } = useMemo(() => {
    let earliest = new Date(effectiveProject.startDate || '2026-09-18');
    let latest = new Date(effectiveProject.expectedCompletionDate || '2026-10-25');

    projectMilestones.forEach((m) => {
      if (m.startDate) {
        const s = new Date(m.startDate);
        if (s < earliest) earliest = s;
      }
      if (m.targetDate) {
        const t = new Date(m.targetDate);
        if (t > latest) latest = t;
      }
    });

    // Add slight buffer (1 day start, 2 days end)
    const baseStart = new Date(earliest);
    baseStart.setDate(baseStart.getDate() - 1);
    const baseEnd = new Date(latest);
    baseEnd.setDate(baseEnd.getDate() + 2);

    const totalDays = Math.max(
      10,
      Math.round((baseEnd.getTime() - baseStart.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Compute weekly marks
    const weeks: { label: string; dateStr: string; percent: number }[] = [];
    const stepDays = totalDays > 45 ? 14 : totalDays > 21 ? 7 : 4;
    for (let day = 0; day <= totalDays; day += stepDays) {
      const d = new Date(baseStart);
      d.setDate(d.getDate() + day);
      weeks.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateStr: d.toISOString().split('T')[0],
        percent: (day / totalDays) * 100
      });
    }

    const items: GanttBarItem[] = projectMilestones.map((m, idx) => {
      const s = m.startDate ? new Date(m.startDate) : new Date(baseStart);
      const t = m.targetDate ? new Date(m.targetDate) : new Date(baseEnd);

      const offsetDays = Math.max(
        0,
        Math.round((s.getTime() - baseStart.getTime()) / (1000 * 60 * 60 * 24))
      );
      const spanDays = Math.max(
        2,
        Math.round((t.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
      );

      let calcProgress = m.progressPercent ?? 0;
      if (calcProgress === 0) {
        if (m.status === 'completed') calcProgress = 100;
        else if (m.status === 'in_progress') calcProgress = 65;
        else calcProgress = 0;
      }

      return {
        id: m.id || `bar-${idx}`,
        title: m.title,
        phase: m.phase,
        status: m.status,
        moduleName: m.moduleName,
        deliverablesCount: m.deliverables ? m.deliverables.length : 0,
        startDate: m.startDate || s.toISOString().split('T')[0],
        targetDate: m.targetDate || t.toISOString().split('T')[0],
        startOffsetDays: offsetDays,
        durationDays: spanDays,
        progressPercent: calcProgress,
        paymentMilestone: m.paymentMilestone,
        originalMilestone: m
      };
    });

    return {
      chartData: items,
      minDate: baseStart,
      maxDate: baseEnd,
      totalTimelineDays: totalDays,
      timelineWeeks: weeks
    };
  }, [projectMilestones, effectiveProject]);

  // Filtered items
  const filteredBars = useMemo(() => {
    if (selectedPhaseFilter === 'all') return chartData;
    return chartData.filter((item) => item.status === selectedPhaseFilter);
  }, [chartData, selectedPhaseFilter]);

  // Today cursor calculation
  const todayPercent = useMemo(() => {
    const today = new Date('2026-09-24'); // Current applet system time
    const diff = Math.round((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    const pct = (diff / totalTimelineDays) * 100;
    return pct <= 100 ? pct : null;
  }, [minDate, totalTimelineDays]);

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return {
          bar: 'bg-emerald-500',
          fill: 'from-emerald-500 to-teal-400',
          border: 'border-emerald-400/50',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
        };
      case 'in_progress':
        return {
          bar: 'bg-cyan-500',
          fill: 'from-cyan-500 via-blue-500 to-indigo-500',
          border: 'border-cyan-400/60',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
        };
      case 'delayed':
        return {
          bar: 'bg-rose-500',
          fill: 'from-rose-500 to-amber-500',
          border: 'border-rose-400/60',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-800'
        };
      default:
        return {
          bar: 'bg-slate-600',
          fill: 'from-slate-600 to-slate-700',
          border: 'border-slate-600/50',
          badge: 'bg-slate-900 text-slate-400 border-slate-800'
        };
    }
  };

  return (
    <div className="rounded-3xl bg-slate-950/90 border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-black text-white">
              Gantt-Style Project Phase Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual milestone breakdown mapping sprint start dates, durations, and projected deliverables.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            Filter:
          </span>
          {[
            { label: 'All Phases', value: 'all' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Upcoming', value: 'upcoming' }
          ].map((tab) => {
            const isSelected = selectedPhaseFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedPhaseFilter(tab.value)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Sprint Kickoff</span>
          <span className="text-xs font-bold text-white font-mono">
            {effectiveProject.startDate || chartData[0]?.startDate || '2026-09-18'}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Target Live Date</span>
          <span className="text-xs font-bold text-cyan-400 font-mono">
            {effectiveProject.expectedCompletionDate || chartData[chartData.length - 1]?.targetDate || '2026-10-25'}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Span</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            {totalTimelineDays} Days ({Math.ceil(totalTimelineDays / 7)} Weeks)
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Milestones</span>
          <span className="text-xs font-bold text-slate-200">
            {chartData.filter((b) => b.status === 'completed').length} / {chartData.length} Completed
          </span>
        </div>
      </div>

      {/* Gantt Canvas Chart Container */}
      <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="min-w-[640px] space-y-3">
          {/* Timeline Header Ruler */}
          <div className="relative h-7 border-b border-slate-800 pl-44 pr-4">
            {timelineWeeks.map((week, idx) => (
              <div
                key={idx}
                style={{ left: `${week.percent}%` }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              >
                <span className="text-[10px] text-slate-400 font-mono font-medium whitespace-nowrap">
                  {week.label}
                </span>
                <div className="w-px h-2 bg-slate-800 mt-0.5" />
              </div>
            ))}
          </div>

          {/* Gantt Rows */}
          <div className="relative space-y-2.5">
            {/* Today marker vertical line */}
            {todayPercent !== null && (
              <div
                style={{ left: `calc(11rem + (100% - 12rem) * ${todayPercent / 100})` }}
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-cyan-500 to-transparent z-20 pointer-events-none"
              >
                <div className="absolute -top-3.5 -translate-x-1/2 px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono text-[9px] font-black shadow-lg">
                  TODAY
                </div>
              </div>
            )}

            {filteredBars.map((item) => {
              const colors = getStatusColor(item.status);
              const leftPercent = (item.startOffsetDays / totalTimelineDays) * 100;
              const widthPercent = Math.max(
                3,
                (item.durationDays / totalTimelineDays) * 100
              );
              const isHovered = hoveredBarId === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredBarId(item.id)}
                  onMouseLeave={() => setHoveredBarId(null)}
                  className={`flex items-center group transition-colors rounded-xl p-1.5 ${
                    isHovered ? 'bg-slate-900/90 ring-1 ring-slate-800' : 'hover:bg-slate-900/40'
                  }`}
                >
                  {/* Left Label & Metadata */}
                  <div className="w-44 shrink-0 pr-3 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${colors.badge}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      {item.moduleName && (
                        <span className="truncate text-slate-400" title={item.moduleName}>
                          • {item.moduleName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Timeline Bar Track */}
                  <div className="flex-1 relative h-9 bg-slate-950/60 rounded-xl border border-slate-900 overflow-hidden flex items-center">
                    {/* Vertical grid lines matching ruler */}
                    {timelineWeeks.map((week, wIdx) => (
                      <div
                        key={wIdx}
                        style={{ left: `${week.percent}%` }}
                        className="absolute inset-y-0 w-px bg-slate-900/60 pointer-events-none"
                      />
                    ))}

                    {/* Gantt Scheduled Bar */}
                    <div
                      onClick={() => {
                        if (onSelectMilestone && item.originalMilestone) {
                          onSelectMilestone(item.originalMilestone, false);
                        }
                      }}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`
                      }}
                      className={`absolute h-7 rounded-lg border ${colors.border} bg-gradient-to-r ${colors.fill} shadow-md flex items-center justify-between px-2 text-white transition-all cursor-pointer ${
                        isHovered ? 'scale-y-110 shadow-lg shadow-cyan-950/60 ring-1 ring-white/30' : ''
                      }`}
                    >
                      {/* Bar Content */}
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden text-[10px] font-bold drop-shadow-sm">
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-white shrink-0" />
                        ) : item.status === 'in_progress' ? (
                          <Clock className="w-3 h-3 text-white shrink-0 animate-spin-slow" />
                        ) : null}
                        <span className="truncate">{item.phase}</span>
                      </div>

                      <span className="font-mono text-[9px] font-black shrink-0 ml-1 bg-black/30 px-1 py-0.5 rounded">
                        {item.progressPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Detail Box when hovered */}
      {hoveredBarId && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs animate-in fade-in duration-150">
          {(() => {
            const active = chartData.find((b) => b.id === hoveredBarId);
            if (!active) return null;
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">{active.title}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase">
                      {active.phase}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Module: <strong className="text-slate-200">{active.moduleName || 'Core Feature'}</strong> •{' '}
                    {active.deliverablesCount} Deliverables in scope
                  </p>
                </div>

                <div className="text-right shrink-0 flex sm:block items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span>{active.startDate}</span> → <strong className="text-cyan-400">{active.targetDate}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Duration: <strong className="text-slate-300">{active.durationDays} calendar days</strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Gantt Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Completed Phase</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Active Sprint in Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Upcoming / Scheduled</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Hover over any milestone bar to view duration & scope details</span>
        </div>
      </div>
    </div>
  );
};
