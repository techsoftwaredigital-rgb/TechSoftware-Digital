import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Layers,
  Zap,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Timer,
  Milestone,
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { QuotationSelectedService } from '../../types';

interface ProjectTimelineVisualizerProps {
  selectedServices: QuotationSelectedService[];
  currentTimelineSelection: string;
  onSelectTimeline: (timelineString: string) => void;
}

interface ServiceTimelineEstimate {
  id: string;
  name: string;
  category: string;
  estimatedWeeks: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Enterprise';
  workingDays: number;
}

interface MilestonePhase {
  phase: number;
  title: string;
  durationLabel: string;
  description: string;
  tasks: string[];
  weekRange: string;
}

export const ProjectTimelineVisualizer: React.FC<ProjectTimelineVisualizerProps> = ({
  selectedServices,
  currentTimelineSelection,
  onSelectTimeline
}) => {
  const [sprintPace, setSprintPace] = useState<'standard' | 'express'>('standard');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Compute realistic delivery estimation based on selected services
  const timelineData = useMemo(() => {
    if (!selectedServices || selectedServices.length === 0) {
      return {
        minWeeks: 1,
        maxWeeks: 2,
        recommendedLabel: '1-2 Weeks (Express)',
        complexityScore: 'Standard',
        estimatedTotalDays: 7,
        serviceEstimates: [] as ServiceTimelineEstimate[],
        targetCompletionDate: '',
        milestones: [] as MilestonePhase[]
      };
    }

    // Map each service to estimated working days & complexity
    const estimates: ServiceTimelineEstimate[] = selectedServices.map((service) => {
      const name = service.name.toLowerCase();
      const cat = (service.category || '').toLowerCase();
      let days = 5;
      let comp: 'Low' | 'Medium' | 'High' | 'Enterprise' = 'Medium';
      let weeks = '1-2 Weeks';

      if (cat.includes('saas') || name.includes('saas') || cat.includes('erp') || name.includes('erp')) {
        days = 28;
        comp = 'Enterprise';
        weeks = '4-6 Weeks';
      } else if (cat.includes('mobile') || name.includes('mobile app') || name.includes('flutter')) {
        days = 24;
        comp = 'High';
        weeks = '4-5 Weeks';
      } else if (cat.includes('business software') || name.includes('crm') || name.includes('pos')) {
        days = 22;
        comp = 'High';
        weeks = '3-5 Weeks';
      } else if (cat.includes('web application') || name.includes('web app') || name.includes('portal')) {
        days = 18;
        comp = 'High';
        weeks = '3-4 Weeks';
      } else if (name.includes('ecommerce') || name.includes('e-commerce') || name.includes('marketplace')) {
        days = 16;
        comp = 'Medium';
        weeks = '2-4 Weeks';
      } else if (cat.includes('ai') || name.includes('ai ') || name.includes('gemini') || name.includes('bot')) {
        days = 12;
        comp = 'Medium';
        weeks = '2-3 Weeks';
      } else if (name.includes('premium') && cat.includes('website')) {
        days = 12;
        comp = 'Medium';
        weeks = '2-3 Weeks';
      } else if (name.includes('business website') || name.includes('corporate')) {
        days = 10;
        comp = 'Medium';
        weeks = '1-2 Weeks';
      } else if (name.includes('landing') || cat.includes('web invitation')) {
        days = 4;
        comp = 'Low';
        weeks = '3-5 Days';
      } else if (cat.includes('add-on') || cat.includes('ui/ux') || cat.includes('security') || cat.includes('hosting')) {
        days = 4;
        comp = 'Low';
        weeks = '3-5 Days';
      }

      // Multiply slight factor if quantity > 1
      const effectiveDays = Math.round(days * (1 + (service.qty - 1) * 0.4));

      return {
        id: service.serviceId,
        name: service.name,
        category: service.category,
        estimatedWeeks: weeks,
        complexity: comp,
        workingDays: effectiveDays
      };
    });

    // In modern agile software development, multiple services pipeline in parallel
    // Primary anchor service duration (the most complex item takes the critical path)
    const maxSingleDays = Math.max(...estimates.map((e) => e.workingDays), 5);
    const secondaryDaysSum = estimates
      .map((e) => e.workingDays)
      .filter((d) => d < maxSingleDays)
      .reduce((acc, curr) => acc + curr, 0);

    // Concurrency factor: secondary tasks overlap by ~70%
    let totalWorkingDays = Math.round(maxSingleDays + secondaryDaysSum * 0.3);

    // Apply sprint pace
    if (sprintPace === 'express') {
      totalWorkingDays = Math.max(4, Math.round(totalWorkingDays * 0.75));
    }

    const calculatedWeeks = Math.ceil(totalWorkingDays / 5); // 5 working days per week

    let minWeeks = Math.max(1, calculatedWeeks - 1);
    let maxWeeks = calculatedWeeks + 1;

    if (totalWorkingDays <= 6) {
      minWeeks = 1;
      maxWeeks = 2;
    } else if (totalWorkingDays <= 14) {
      minWeeks = 2;
      maxWeeks = 3;
    } else if (totalWorkingDays <= 22) {
      minWeeks = 3;
      maxWeeks = 4;
    } else if (totalWorkingDays <= 32) {
      minWeeks = 5;
      maxWeeks = 6;
    } else if (totalWorkingDays <= 45) {
      minWeeks = 6;
      maxWeeks = 8;
    } else {
      minWeeks = 8;
      maxWeeks = 12;
    }

    let recommendedLabel = '3-4 Weeks';
    if (maxWeeks <= 2) {
      recommendedLabel = '1-2 Weeks (Express)';
    } else if (maxWeeks <= 4) {
      recommendedLabel = '3-4 Weeks';
    } else if (maxWeeks <= 8) {
      recommendedLabel = '6-8 Weeks';
    } else {
      recommendedLabel = '3+ Months';
    }

    // Complexity label
    let complexityScore = 'Standard Delivery';
    if (estimates.some((e) => e.complexity === 'Enterprise') || totalWorkingDays > 30) {
      complexityScore = 'Enterprise Architecture (Multi-Sprint)';
    } else if (estimates.some((e) => e.complexity === 'High') || totalWorkingDays > 18) {
      complexityScore = 'Comprehensive System Sprint';
    } else if (totalWorkingDays <= 8) {
      complexityScore = 'Rapid Express Sprint';
    }

    // Target estimated completion date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + maxWeeks * 7);
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    const targetCompletionDate = targetDate.toLocaleDateString('en-IN', dateOptions);

    // Dynamic agile phases
    const milestones: MilestonePhase[] = [
      {
        phase: 1,
        title: 'Kickoff & UI/UX Wireframing',
        weekRange: minWeeks === 1 ? 'Days 1-3' : 'Week 1',
        durationLabel: `${Math.round(totalWorkingDays * 0.2)} Days`,
        description: 'Requirement baselining, interactive Figma prototypes, architecture & database schema blueprint.',
        tasks: ['User Flow Design', 'Technical Architecture', 'Client Milestone Sign-off']
      },
      {
        phase: 2,
        title: 'Core Development & API Logic',
        weekRange: minWeeks <= 2 ? 'Week 1-2' : `Weeks 2-${Math.max(2, Math.floor(maxWeeks * 0.6))}`,
        durationLabel: `${Math.round(totalWorkingDays * 0.45)} Days`,
        description: 'Module coding, state management, database integration, security layers & custom business logic.',
        tasks: ['Core Services Implementation', 'Responsive Views', 'Backend Endpoints']
      },
      {
        phase: 3,
        title: 'Integrations & QA Hardening',
        weekRange: minWeeks <= 2 ? 'Week 2' : `Weeks ${Math.max(3, Math.floor(maxWeeks * 0.6) + 1)}-${Math.max(3, maxWeeks - 1)}`,
        durationLabel: `${Math.round(totalWorkingDays * 0.2)} Days`,
        description: 'Payment gateway hooks, automated test runs, cross-browser compatibility & security audits.',
        tasks: ['Payment & Auth Integration', 'End-to-End Testing', 'Performance Tuning']
      },
      {
        phase: 4,
        title: 'UAT, Staging & Production Launch',
        weekRange: `Week ${maxWeeks}`,
        durationLabel: `${Math.round(totalWorkingDays * 0.15)} Days`,
        description: 'Client review, milestone verification, Cloud Run deployment, domain configuration and handover.',
        tasks: ['Client Acceptance Demo', 'Production Deployment', 'Source Code & Warranty Handover']
      }
    ];

    return {
      minWeeks,
      maxWeeks,
      recommendedLabel,
      complexityScore,
      estimatedTotalDays: totalWorkingDays,
      serviceEstimates: estimates,
      targetCompletionDate,
      milestones
    };
  }, [selectedServices, sprintPace]);

  const isCurrentSelectionMatched = currentTimelineSelection === timelineData.recommendedLabel;

  return (
    <div
      id="project-timeline-visualizer"
      className="bg-slate-900/90 rounded-2xl border border-cyan-900/40 p-4 sm:p-5 shadow-xl space-y-4 transition-all"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/90 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Project Timeline Estimation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider">
                Automated Estimate
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sprint projection based on {selectedServices.length} selected{' '}
              {selectedServices.length === 1 ? 'service module' : 'service modules'}
            </p>
          </div>
        </div>

        {/* Sprint Pace Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            id="sprint-pace-standard"
            onClick={() => setSprintPace('standard')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sprintPace === 'standard'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard Agile
          </button>
          <button
            type="button"
            id="sprint-pace-express"
            onClick={() => setSprintPace('express')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sprintPace === 'express'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dedicated dual-developer focus with accelerated milestone sprints"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Express Track</span>
          </button>
        </div>
      </div>

      {/* Primary Visual Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Estimated Duration Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Estimated Delivery Window</span>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {timelineData.minWeeks}-{timelineData.maxWeeks}{' '}
            <span className="text-xs font-sans font-bold text-cyan-400">Weeks</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              ~{timelineData.estimatedTotalDays} working days
            </span>
            <span className="text-cyan-300 font-medium">
              {sprintPace === 'express' ? '⚡ 25% Faster' : 'Standard Cadence'}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
        </div>

        {/* Target Delivery Date */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Projected Completion</span>
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-300 tracking-tight">
            {timelineData.targetCompletionDate}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            From 50% advance realization date
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Complexity & Sprint Profile */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Sprint Architecture</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-100 line-clamp-1">
            {timelineData.complexityScore}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] text-slate-400">
              Parallel module development
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
      </div>

      {/* Sync with Quotation Form Notice / 1-Click Action */}
      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-slate-200">
              Recommended Quotation Timeline Setting:{' '}
              <strong className="text-cyan-300">{timelineData.recommendedLabel}</strong>
            </span>
            {isCurrentSelectionMatched ? (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Synced with Quote
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                (Quotation form currently has: "{currentTimelineSelection}")
              </span>
            )}
          </div>
        </div>

        {!isCurrentSelectionMatched && (
          <button
            type="button"
            id="sync-timeline-btn"
            onClick={() => onSelectTimeline(timelineData.recommendedLabel)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span>Apply to Quote Form</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Agile Sprint Phase Milestone Progression */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-1.5 text-slate-200">
            <Milestone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agile Delivery Phases & Milestone Schedule</span>
          </span>
          <span className="text-[11px] text-slate-500">4-Stage Pipeline</span>
        </div>

        {/* Phase Progress Bar / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {timelineData.milestones.map((milestone, idx) => (
            <div
              key={milestone.phase}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                    Phase 0{milestone.phase}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 font-semibold">
                    {milestone.weekRange}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 mb-1 leading-snug">
                  {milestone.title}
                </h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-2">
                  {milestone.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                <span>Duration: {milestone.durationLabel}</span>
                <span className="text-emerald-400 font-medium">Sprint Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Service Breakdown Toggle */}
      <div className="pt-1">
        <button
          type="button"
          id="toggle-detailed-timeline-breakdown"
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {showDetailedBreakdown
                ? 'Hide Per-Service Timeline Estimates'
                : `View Per-Service Estimated Turnaround (${timelineData.serviceEstimates.length} items)`}
            </span>
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              showDetailedBreakdown ? 'rotate-90' : ''
            }`}
          />
        </button>

        {showDetailedBreakdown && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex justify-between">
              <span>Service Item</span>
              <span>Individual Sprint Turnaround</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {timelineData.serviceEstimates.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{item.name}</div>
                    <div className="text-[10.5px] text-cyan-400/90">{item.category}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-200 block text-xs">
                      {item.estimatedWeeks}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        item.complexity === 'Enterprise'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : item.complexity === 'High'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : item.complexity === 'Medium'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.complexity} Complexity (~{item.workingDays}d)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparency Guarantee Note */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-[11px] text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-slate-300 font-semibold">
            Sprint Execution Transparency & Kickoff Policy:
          </p>
          <p className="text-slate-400 leading-relaxed">
            Project sprints commence on Day 1 following payment receipt of the mandatory 50% advance
            and the handover of required branding content. Weekly milestone demonstrations and staging
            previews are provided to guarantee timely delivery.
          </p>
        </div>
      </div>
    </div>
  );
};
