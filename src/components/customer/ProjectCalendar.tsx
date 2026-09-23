import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Plus,
  Layers,
  Flag,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Check,
  X,
  Filter,
  Sparkles,
  ArrowRight,
  GitBranch,
  Link2,
  Cpu,
  AlertTriangle,
  CalendarClock,
  Edit3,
  Lock,
  Unlock,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import { Quotation, ProjectMilestone, MilestonePhase, MilestoneStatus } from '../../types';
import {
  deriveMilestonesFromQuotations,
  generateGoogleCalendarUrl,
  exportMilestonesToICS
} from '../../utils/milestoneGenerator';
import { ProjectGanttChart } from './ProjectGanttChart';
import { MilestoneProgressChart } from './MilestoneProgressChart';
import { ProjectHealthWidget } from './ProjectHealthWidget';
import { MilestonePaymentCalendar } from './MilestonePaymentCalendar';
import { MiniProgressRing } from './MiniProgressRing';

interface ProjectCalendarProps {
  quotations: Quotation[];
  customMilestones?: ProjectMilestone[];
  onAddCustomMilestone?: (milestone: ProjectMilestone) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: MilestoneStatus) => void;
  onUpdateMilestone?: (milestone: ProjectMilestone) => void;
  onViewQuotation?: (quotation: Quotation) => void;
}

// Calculate days variance between targetDate and estimatedCompletionDate
function getDateVariance(targetDateStr: string, estDateStr?: string) {
  if (!estDateStr || estDateStr === targetDateStr) {
    return { diffDays: 0, label: 'On Schedule', type: 'on_track' as const };
  }
  const target = new Date(targetDateStr).getTime();
  const est = new Date(estDateStr).getTime();
  const diffDays = Math.round((est - target) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { diffDays, label: `+${diffDays}d Delay`, type: 'delayed' as const };
  } else {
    return { diffDays, label: `${Math.abs(diffDays)}d Ahead`, type: 'ahead' as const };
  }
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
  quotations,
  customMilestones = [],
  onAddCustomMilestone,
  onUpdateMilestoneStatus,
  onUpdateMilestone,
  onViewQuotation
}) => {
  // Calendar View Mode: 'gantt' | 'health' | 'payments' | 'progress' | 'roadmap' | 'month' | 'deadlines'
  const [viewMode, setViewMode] = useState<'gantt' | 'health' | 'payments' | 'progress' | 'roadmap' | 'month' | 'deadlines'>('gantt');

  // Filters
  const [selectedQuoteFilter, setSelectedQuoteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [dependencyFilter, setDependencyFilter] = useState<string>('all'); // 'all' | 'blocked' | 'cleared' | 'with_dependencies'

  // Current browsing month for calendar view
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected milestone for detail modal
  const [activeMilestoneForModal, setActiveMilestoneForModal] = useState<ProjectMilestone | null>(null);
  const [modalMode, setModalMode] = useState<'overview' | 'edit'>('overview');

  // Add custom milestone modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    title: '',
    quotationNumber: quotations[0]?.quotationNumber || 'TSD-PROJECT',
    phase: 'Sprint 1 Development' as MilestonePhase,
    moduleName: 'Authentication & Core Framework',
    targetDate: new Date().toISOString().split('T')[0],
    estimatedCompletionDate: new Date().toISOString().split('T')[0],
    dependencyIds: [] as string[],
    description: '',
    deliverable1: '',
    deliverable2: '',
    paymentMilestone: ''
  });

  // Edit milestone form state
  const [editMilestoneForm, setEditMilestoneForm] = useState<{
    id: string;
    title: string;
    moduleName: string;
    targetDate: string;
    estimatedCompletionDate: string;
    dependencyIds: string[];
    status: MilestoneStatus;
    progressPercent: number;
    description: string;
    paymentMilestone: string;
    deliverables: string[];
  } | null>(null);

  // Derive all milestones from booked/active quotes + custom ones
  const allMilestones = useMemo(() => {
    return deriveMilestonesFromQuotations(quotations, customMilestones);
  }, [quotations, customMilestones]);

  // Lookup map of all milestones by ID for rapid dependency resolution
  const allMilestonesMap = useMemo(() => {
    return new Map(allMilestones.map((m) => [m.id, m]));
  }, [allMilestones]);

  // Distinct active quotations for selector
  const activeQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
    );
  }, [quotations]);

  // Distinct modules across all milestones and quotation service items
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    // From milestones
    allMilestones.forEach((m) => {
      if (m.moduleName?.trim()) set.add(m.moduleName.trim());
    });
    // From quotations
    quotations.forEach((q) => {
      q.items.forEach((item) => {
        if (item.name?.trim()) set.add(item.name.trim());
      });
    });
    // Standard defaults if empty
    if (set.size === 0) {
      set.add('DevOps & Cloud Environment');
      set.add('UI/UX & Database Architecture');
      set.add('Authentication & Core Framework');
      set.add('Payment Gateway & Integrations');
      set.add('Security & Performance Audit');
      set.add('Client Acceptance & Demo');
      set.add('Production Deployment & DNS');
    }
    return Array.from(set);
  }, [allMilestones, quotations]);

  // Helper to inspect prerequisites for any milestone
  const getPrerequisites = (milestone: ProjectMilestone): ProjectMilestone[] => {
    if (!milestone.dependencyIds || milestone.dependencyIds.length === 0) return [];
    return milestone.dependencyIds
      .map((id) => allMilestonesMap.get(id))
      .filter(Boolean) as ProjectMilestone[];
  };

  // Helper to check if a milestone is blocked by incomplete prerequisites
  const isMilestoneBlocked = (milestone: ProjectMilestone): boolean => {
    const prereqs = getPrerequisites(milestone);
    if (prereqs.length === 0) return false;
    return prereqs.some((p) => p.status !== 'completed');
  };

  // Helper to get downstream milestones that depend on this milestone
  const getDownstreamDependents = (milestone: ProjectMilestone): ProjectMilestone[] => {
    return allMilestones.filter((m) => m.dependencyIds && m.dependencyIds.includes(milestone.id));
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      const matchQuote =
        selectedQuoteFilter === 'all' ||
        m.quotationNumber === selectedQuoteFilter ||
        m.quotationId === selectedQuoteFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchModule = moduleFilter === 'all' || m.moduleName === moduleFilter;

      let matchDependency = true;
      if (dependencyFilter === 'blocked') {
        matchDependency = isMilestoneBlocked(m);
      } else if (dependencyFilter === 'cleared') {
        const prereqs = getPrerequisites(m);
        matchDependency = prereqs.length > 0 && prereqs.every((p) => p.status === 'completed');
      } else if (dependencyFilter === 'with_dependencies') {
        matchDependency = !!(m.dependencyIds && m.dependencyIds.length > 0);
      }

      return matchQuote && matchStatus && matchModule && matchDependency;
    });
  }, [allMilestones, selectedQuoteFilter, statusFilter, moduleFilter, dependencyFilter, allMilestonesMap]);

  // Overall and filtered stats
  const totalCount = filteredMilestones.length;
  const completedCount = filteredMilestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = filteredMilestones.filter((m) => m.status === 'in_progress').length;
  const upcomingCount = filteredMilestones.filter((m) => m.status === 'upcoming').length;
  const blockedCount = filteredMilestones.filter((m) => isMilestoneBlocked(m) && m.status !== 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Next upcoming milestone
  const nextMilestone = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return filteredMilestones.find((m) => {
      const effDate = m.estimatedCompletionDate || m.targetDate;
      return effDate >= todayStr && m.status !== 'completed';
    });
  }, [filteredMilestones]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Group milestones by target date for month calendar
  const milestonesByDate = useMemo(() => {
    const map: Record<string, ProjectMilestone[]> = {};
    filteredMilestones.forEach((m) => {
      const dateKey = m.estimatedCompletionDate || m.targetDate;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(m);
    });
    return map;
  }, [filteredMilestones]);

  // Handle open modal for a milestone
  const handleOpenMilestoneModal = (milestone: ProjectMilestone, startInEdit = false) => {
    setActiveMilestoneForModal(milestone);
    setModalMode(startInEdit ? 'edit' : 'overview');
    setEditMilestoneForm({
      id: milestone.id,
      title: milestone.title,
      moduleName: milestone.moduleName || 'Core Feature Module',
      targetDate: milestone.targetDate,
      estimatedCompletionDate: milestone.estimatedCompletionDate || milestone.targetDate,
      dependencyIds: milestone.dependencyIds ? [...milestone.dependencyIds] : [],
      status: milestone.status,
      progressPercent: milestone.progressPercent || (milestone.status === 'completed' ? 100 : milestone.status === 'in_progress' ? 50 : 0),
      description: milestone.description,
      paymentMilestone: milestone.paymentMilestone || '',
      deliverables: [...milestone.deliverables]
    });
  };

  // Save changes from Edit Milestone modal
  const handleSaveMilestoneEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMilestoneForm || !activeMilestoneForModal) return;

    const updated: ProjectMilestone = {
      ...activeMilestoneForModal,
      title: editMilestoneForm.title,
      moduleName: editMilestoneForm.moduleName,
      targetDate: editMilestoneForm.targetDate,
      estimatedCompletionDate: editMilestoneForm.estimatedCompletionDate,
      dependencyIds: editMilestoneForm.dependencyIds,
      status: editMilestoneForm.status,
      progressPercent: editMilestoneForm.progressPercent,
      description: editMilestoneForm.description,
      paymentMilestone: editMilestoneForm.paymentMilestone || undefined,
      isCustom: true // Mark so custom overrides persist
    };

    if (onUpdateMilestone) {
      onUpdateMilestone(updated);
    } else if (onAddCustomMilestone) {
      onAddCustomMilestone(updated);
    }

    setActiveMilestoneForModal(updated);
    setModalMode('overview');
  };

  // Add custom milestone
  const handleSaveCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneForm.title.trim() || !newMilestoneForm.targetDate) return;

    const deliverables = [newMilestoneForm.deliverable1, newMilestoneForm.deliverable2].filter(Boolean);
    const relatedQuote = quotations.find((q) => q.quotationNumber === newMilestoneForm.quotationNumber);

    const created: ProjectMilestone = {
      id: `custom-ms-${Date.now()}`,
      quotationId: relatedQuote?.id || 'quote-custom',
      quotationNumber: newMilestoneForm.quotationNumber,
      projectName: relatedQuote?.customer.companyName || 'Custom Project Track',
      phase: newMilestoneForm.phase,
      title: newMilestoneForm.title,
      description: newMilestoneForm.description || 'Custom client-specified project milestone checkpoint.',
      targetDate: newMilestoneForm.targetDate,
      estimatedCompletionDate: newMilestoneForm.estimatedCompletionDate || newMilestoneForm.targetDate,
      moduleName: newMilestoneForm.moduleName,
      dependencyIds: newMilestoneForm.dependencyIds,
      status: 'upcoming',
      deliverables: deliverables.length > 0 ? deliverables : ['Client & Technical Review Verification'],
      assignedLead: relatedQuote?.assignedStaffName || 'Aman Sharma (Lead Architect)',
      paymentMilestone: newMilestoneForm.paymentMilestone || undefined,
      progressPercent: 0,
      isCustom: true
    };

    if (onAddCustomMilestone) {
      onAddCustomMilestone(created);
    }
    setShowAddModal(false);
    setNewMilestoneForm({
      title: '',
      quotationNumber: quotations[0]?.quotationNumber || 'TSD-PROJECT',
      phase: 'Sprint 1 Development',
      moduleName: availableModules[0] || 'Core Framework',
      targetDate: new Date().toISOString().split('T')[0],
      estimatedCompletionDate: new Date().toISOString().split('T')[0],
      dependencyIds: [],
      description: '',
      deliverable1: '',
      deliverable2: '',
      paymentMilestone: ''
    });
  };

  // Completion percentage and deliverable helpers
  const calculateMilestoneProgress = (m: ProjectMilestone): number => {
    if (m.progressPercent !== undefined) {
      return m.progressPercent;
    }
    if (m.completedDeliverables && m.deliverables && m.deliverables.length > 0) {
      return Math.round((m.completedDeliverables.length / m.deliverables.length) * 100);
    }
    if (m.status === 'completed') return 100;
    if (m.status === 'in_progress') return 50;
    return 0;
  };

  const isDeliverableCompleted = (m: ProjectMilestone, deliverable: string): boolean => {
    if (m.completedDeliverables) {
      return m.completedDeliverables.includes(deliverable);
    }
    if (m.status === 'completed') return true;
    return false;
  };

  const handleToggleDeliverable = (milestone: ProjectMilestone, deliverableText: string) => {
    const currentCompleted = milestone.completedDeliverables || (
      milestone.status === 'completed'
        ? [...milestone.deliverables]
        : milestone.status === 'in_progress'
        ? milestone.deliverables.slice(0, Math.ceil(milestone.deliverables.length / 2))
        : []
    );

    const isAlreadyCompleted = currentCompleted.includes(deliverableText);
    const nextCompleted = isAlreadyCompleted
      ? currentCompleted.filter((d) => d !== deliverableText)
      : [...currentCompleted, deliverableText];

    const total = milestone.deliverables.length;
    const newPercent = total > 0 ? Math.round((nextCompleted.length / total) * 100) : 0;

    let newStatus: MilestoneStatus = milestone.status;
    if (newPercent === 100) {
      newStatus = 'completed';
    } else if (newPercent > 0) {
      newStatus = 'in_progress';
    } else {
      newStatus = 'upcoming';
    }

    const updatedMilestone: ProjectMilestone = {
      ...milestone,
      completedDeliverables: nextCompleted,
      progressPercent: newPercent,
      status: newStatus
    };

    if (onUpdateMilestone) {
      onUpdateMilestone(updatedMilestone);
    }
    if (onUpdateMilestoneStatus && newStatus !== milestone.status) {
      onUpdateMilestoneStatus(milestone.id, newStatus);
    }
    if (activeMilestoneForModal && activeMilestoneForModal.id === milestone.id) {
      setActiveMilestoneForModal(updatedMilestone);
    }
  };

  const handleSetMilestoneProgress = (milestone: ProjectMilestone, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    let newStatus: MilestoneStatus = milestone.status;
    if (clamped === 100) newStatus = 'completed';
    else if (clamped > 0) newStatus = 'in_progress';
    else newStatus = 'upcoming';

    const total = milestone.deliverables.length;
    const countToComplete = Math.round((clamped / 100) * total);
    const nextCompleted = milestone.deliverables.slice(0, countToComplete);

    const updatedMilestone: ProjectMilestone = {
      ...milestone,
      progressPercent: clamped,
      completedDeliverables: nextCompleted,
      status: newStatus
    };

    if (onUpdateMilestone) {
      onUpdateMilestone(updatedMilestone);
    }
    if (onUpdateMilestoneStatus && newStatus !== milestone.status) {
      onUpdateMilestoneStatus(milestone.id, newStatus);
    }
    if (activeMilestoneForModal && activeMilestoneForModal.id === milestone.id) {
      setActiveMilestoneForModal(updatedMilestone);
    }
  };

  const handleCycleMilestoneProgress = (milestone: ProjectMilestone) => {
    const current = calculateMilestoneProgress(milestone);
    let next = 0;
    if (current === 0) next = 50;
    else if (current < 100) next = 100;
    else next = 0;
    handleSetMilestoneProgress(milestone, next);
  };

  const averageMilestoneProgress = useMemo(() => {
    if (filteredMilestones.length === 0) return 0;
    const sum = filteredMilestones.reduce((acc, m) => acc + calculateMilestoneProgress(m), 0);
    return Math.round(sum / filteredMilestones.length);
  }, [filteredMilestones]);

  return (
    <div id="project-milestone-tracker-root" className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Project Milestones & Software Module Tracker</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Estimated Schedules & Module Dependencies
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Track delivery timelines, adjust estimated completion dates, and manage prerequisite dependency links across scoped software modules.
                </p>
              </div>
            </div>

            {nextMilestone && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs mt-2 flex-wrap">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-slate-400">Next Upcoming Delivery:</span>
                <span className="font-bold text-white">{nextMilestone.title}</span>
                {nextMilestone.moduleName && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-semibold flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {nextMilestone.moduleName}
                  </span>
                )}
                <span className="text-cyan-400 font-mono text-[11px] font-bold bg-cyan-950/60 px-2 py-0.5 rounded">
                  Est: {nextMilestone.estimatedCompletionDate || nextMilestone.targetDate}
                </span>
                {(() => {
                  const variance = getDateVariance(nextMilestone.targetDate, nextMilestone.estimatedCompletionDate);
                  if (variance.type === 'delayed') {
                    return (
                      <span className="text-amber-400 text-[10px] font-bold bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                        {variance.label}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 p-2 rounded-xl text-center flex-wrap">
              <div className="px-2.5 flex items-center gap-2.5 border-r border-slate-800">
                <MiniProgressRing
                  progress={averageMilestoneProgress}
                  size={36}
                  strokeWidth={3}
                  title={`Overall average completion: ${averageMilestoneProgress}%`}
                />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block">Progress</span>
                  <span className="text-sm font-extrabold font-mono text-white">{averageMilestoneProgress}%</span>
                </div>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="text-base font-extrabold text-white">{totalCount}</span>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Done</span>
                <span className="text-base font-extrabold text-emerald-400">{completedCount}</span>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">Active</span>
                <span className="text-base font-extrabold text-cyan-400">{inProgressCount}</span>
              </div>
              <div className="px-2.5 border-r border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Scheduled</span>
                <span className="text-base font-extrabold text-amber-400">{upcomingCount}</span>
              </div>
              <div className="px-2.5">
                <span className="text-[10px] uppercase font-bold text-rose-400 block">Blocked</span>
                <span className={`text-base font-extrabold ${blockedCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {blockedCount}
                </span>
              </div>
            </div>

            <button
              id="export-milestones-ics-btn"
              onClick={() => exportMilestonesToICS(filteredMilestones)}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow"
              title="Download iCalendar (.ics) file for Google, Apple, or Outlook Calendar"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .ICS</span>
            </button>

            <button
              id="add-checkpoint-open-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-lg shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Checkpoint</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <span>Overall Deliverable Velocity:</span>
              <span className="text-white font-bold">{completionPercentage}% Completed</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              {completedCount} of {totalCount} checkpoints verified
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher & Granular Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-md">
        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
          <button
            id="view-mode-gantt-tab"
            onClick={() => setViewMode('gantt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'gantt'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Gantt Chart (D3)</span>
          </button>

          <button
            id="view-mode-health-tab"
            onClick={() => setViewMode('health')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'health'
                ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>Project Health (Area Chart)</span>
          </button>

          <button
            id="view-mode-payments-tab"
            onClick={() => setViewMode('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'payments'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Milestones & Payments</span>
          </button>

          <button
            id="view-mode-progress-tab"
            onClick={() => setViewMode('progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'progress'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Completion % (Recharts)</span>
          </button>

          <button
            id="view-mode-roadmap-tab"
            onClick={() => setViewMode('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'roadmap'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Roadmap & Dependencies</span>
          </button>

          <button
            id="view-mode-month-tab"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'month'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Monthly View</span>
          </button>

          <button
            id="view-mode-deadlines-tab"
            onClick={() => setViewMode('deadlines')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'deadlines'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deliverable Schedule</span>
          </button>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <select
              id="filter-software-module-select"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all" className="bg-slate-900">All Software Modules</option>
              {availableModules.map((mod) => (
                <option key={mod} value={mod} className="bg-slate-900">
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Dependency Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <select
              id="filter-dependency-select"
              value={dependencyFilter}
              onChange={(e) => setDependencyFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Dependency States</option>
              <option value="blocked" className="bg-slate-900">⚠️ Blocked by Prerequisites</option>
              <option value="cleared" className="bg-slate-900">✓ Prerequisites Cleared</option>
              <option value="with_dependencies" className="bg-slate-900">Has Linked Dependencies</option>
            </select>
          </div>

          {/* Quotation Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="filter-quotation-select"
              value={selectedQuoteFilter}
              onChange={(e) => setSelectedQuoteFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Quotations</option>
              {activeQuotations.map((q) => (
                <option key={q.id} value={q.quotationNumber} className="bg-slate-900">
                  {q.quotationNumber} ({q.customer.companyName || q.customer.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="upcoming" className="bg-slate-900">Scheduled</option>
              <option value="in_progress" className="bg-slate-900">In Progress</option>
              <option value="completed" className="bg-slate-900">Completed</option>
              <option value="delayed" className="bg-slate-900">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 0: D3 GANTT-STYLE CHART WITH PROGRESS & DEPENDENCY LINKS */}
      {viewMode === 'gantt' && (
        <ProjectGanttChart
          milestones={filteredMilestones}
          onSelectMilestone={(m, inEdit) => handleOpenMilestoneModal(m, inEdit)}
          onUpdateMilestoneStatus={onUpdateMilestoneStatus}
        />
      )}

      {/* VIEW 0.2: RECHARTS PROJECT HEALTH AREA CHART (PREDICTED VS ACTUAL & RED DELAYS) */}
      {viewMode === 'health' && (
        <ProjectHealthWidget
          quotations={quotations}
          customMilestones={customMilestones}
          onSelectMilestone={(m) => handleOpenMilestoneModal(m, false)}
          onNavigateToCalendar={() => setViewMode('gantt')}
        />
      )}

      {/* VIEW 0.3: MILESTONE & PAYMENT DUE DATES CALENDAR VIEW */}
      {viewMode === 'payments' && (
        <MilestonePaymentCalendar
          quotations={quotations}
          customMilestones={customMilestones}
          onSelectMilestone={(m) => handleOpenMilestoneModal(m, false)}
          onViewQuotation={onViewQuotation}
        />
      )}

      {/* VIEW 0.5: RECHARTS COMPLETION % PROGRESS ACROSS MILESTONES */}
      {viewMode === 'progress' && (
        <MilestoneProgressChart
          quotations={quotations}
          customMilestones={customMilestones}
          onSelectMilestone={(m) => handleOpenMilestoneModal(m, false)}
        />
      )}

      {/* VIEW 1: ROADMAP & DEPENDENCY GRAPH VIEW */}
      {viewMode === 'roadmap' && (
        <div className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-300">No Milestones Match Current Filters</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try resetting your software module or dependency filter, or add a custom milestone checkpoint.
              </p>
              <button
                onClick={() => {
                  setSelectedQuoteFilter('all');
                  setStatusFilter('all');
                  setModuleFilter('all');
                  setDependencyFilter('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold hover:bg-slate-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-slate-700 before:to-slate-800">
              {filteredMilestones.map((milestone, idx) => {
                const prereqs = getPrerequisites(milestone);
                const isBlocked = isMilestoneBlocked(milestone) && milestone.status !== 'completed';
                const downstream = getDownstreamDependents(milestone);
                const variance = getDateVariance(milestone.targetDate, milestone.estimatedCompletionDate);
                const milestoneProgress = calculateMilestoneProgress(milestone);
                const completedTasksCount = milestone.deliverables.filter((d) => isDeliverableCompleted(milestone, d)).length;

                return (
                  <div key={milestone.id} className="relative group">
                    {/* Node Dot on Timeline */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        milestone.status === 'completed'
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20'
                          : milestone.status === 'in_progress'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-400 shadow-md shadow-cyan-500/20 animate-pulse'
                          : isBlocked
                          ? 'bg-rose-950 border-rose-500 text-rose-400'
                          : 'bg-slate-900 border-slate-600 text-slate-400'
                      }`}
                    >
                      {milestone.status === 'completed' ? (
                        <Check className="w-3 h-3" />
                      ) : isBlocked ? (
                        <Lock className="w-3 h-3 text-rose-400" />
                      ) : (
                        <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div
                      id={`milestone-card-${milestone.id}`}
                      className={`p-5 rounded-2xl border transition-all ${
                        milestone.status === 'in_progress'
                          ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                          : isBlocked
                          ? 'bg-slate-900/90 border-rose-900/50 hover:border-rose-700/60'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header with Mini Progress Ring */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Milestone Completion Mini Ring */}
                          <div className="shrink-0 mt-0.5">
                            <MiniProgressRing
                              progress={milestoneProgress}
                              status={milestone.status}
                              size={42}
                              strokeWidth={3.5}
                              interactive={true}
                              title={`Milestone Task Progress: ${milestoneProgress}% (Click to cycle 0% → 50% → 100%)`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCycleMilestoneProgress(milestone);
                              }}
                            />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Phase Badge */}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-950 border border-slate-800 text-cyan-400">
                                {milestone.phase}
                              </span>

                              {/* Completion % Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                                  milestoneProgress === 100
                                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                                    : milestoneProgress >= 50
                                    ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <span>{milestoneProgress}% Done</span>
                                {milestone.deliverables.length > 0 && (
                                  <span className="text-[9px] opacity-75 font-sans">
                                    ({completedTasksCount}/{milestone.deliverables.length})
                                  </span>
                                )}
                              </span>

                              {/* Software Module Pill */}
                              {milestone.moduleName && (
                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center gap-1.5 shadow-sm">
                                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Module: {milestone.moduleName}</span>
                                </span>
                              )}

                              {/* Quote Ref */}
                              <span className="text-xs text-slate-400 font-mono">
                                #{milestone.quotationNumber}
                              </span>

                              {/* Custom Badge */}
                              {milestone.isCustom && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 border border-purple-800 text-purple-300">
                                  Custom Checkpoint
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              <span>{milestone.title}</span>
                            </h4>

                            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                              {milestone.description}
                            </p>
                          </div>
                        </div>

                        {/* Schedule & Action Header Right */}
                        <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                          {/* Schedule / Estimated Date Box */}
                          <div className="text-right bg-slate-950/90 border border-slate-800/90 p-2.5 rounded-xl min-w-[150px]">
                            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-end gap-1">
                              <CalendarClock className="w-3 h-3 text-cyan-400" />
                              <span>Est. Completion:</span>
                            </div>
                            <div className="text-sm font-extrabold font-mono text-cyan-300">
                              {milestone.estimatedCompletionDate || milestone.targetDate}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">
                                Target: {milestone.targetDate}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  variance.type === 'delayed'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : variance.type === 'ahead'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {variance.label}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`edit-schedule-btn-${milestone.id}`}
                              onClick={() => handleOpenMilestoneModal(milestone, true)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition-colors"
                              title="Set estimated completion date & module dependencies"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Schedule</span>
                            </button>

                            <button
                              id={`inspect-details-btn-${milestone.id}`}
                              onClick={() => handleOpenMilestoneModal(milestone, false)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <span>Details</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dependency Link Badges */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        {/* Dependency Status Indicator */}
                        {prereqs.length > 0 ? (
                          isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold">
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>Blocked by {prereqs.filter((p) => p.status !== 'completed').length} prerequisite module(s)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Prerequisites Met ({prereqs.length} completed)</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-slate-500">
                            <GitBranch className="w-3 h-3 text-slate-600" />
                            <span>Root milestone (No prerequisites)</span>
                          </span>
                        )}

                        {/* List of Prerequisite Chips */}
                        {prereqs.map((prereq) => (
                          <button
                            key={prereq.id}
                            onClick={() => handleOpenMilestoneModal(prereq, false)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              prereq.status === 'completed'
                                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
                                : 'bg-slate-950 border-amber-800/60 text-amber-300 hover:bg-amber-950/40'
                            }`}
                            title={`Depends on: ${prereq.title}`}
                          >
                            <Link2 className="w-3 h-3 shrink-0" />
                            <span className="max-w-[170px] truncate">
                              {prereq.moduleName ? `${prereq.moduleName}: ` : ''}
                              {prereq.title}
                            </span>
                            <span className="text-[10px] font-bold uppercase opacity-80">
                              ({prereq.status === 'completed' ? 'Done' : 'Pending'})
                            </span>
                          </button>
                        ))}

                        {/* Downstream Impact indicator */}
                        {downstream.length > 0 && (
                          <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Required for {downstream.length} subsequent module(s)</span>
                          </span>
                        )}
                      </div>

                      {/* Deliverables & Individual Task Completion Rings */}
                      {milestone.deliverables && milestone.deliverables.length > 0 && (
                        <div className="mt-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Individual Task Deliverables ({completedTasksCount}/{milestone.deliverables.length} Completed)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              Click any task to toggle status
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {milestone.deliverables.map((del, dIdx) => {
                              const isDone = isDeliverableCompleted(milestone, del);
                              return (
                                <div
                                  key={dIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleDeliverable(milestone, del);
                                  }}
                                  title="Click to toggle individual task completion"
                                  className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isDone
                                      ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200 hover:bg-emerald-950/40 shadow-sm shadow-emerald-950/30'
                                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <MiniProgressRing
                                      progress={isDone ? 100 : 0}
                                      status={isDone ? 'completed' : 'upcoming'}
                                      size={22}
                                      strokeWidth={2.5}
                                      title={isDone ? 'Task 100% Completed' : 'Task 0% Pending'}
                                    />
                                    <span className={`truncate font-medium ${isDone ? 'text-slate-400 line-through' : ''}`}>
                                      {del}
                                    </span>
                                  </div>
                                  <span
                                    className={`shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      isDone
                                        ? 'bg-emerald-900/60 text-emerald-300'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {isDone ? '100%' : '0%'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Payment & Lead */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        {milestone.paymentMilestone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/50 text-amber-300 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            <span>{milestone.paymentMilestone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Scheduled sprint deliverable</span>
                        )}

                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Lead: {milestone.assignedLead || 'TechSoftware Team'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-bold text-white">{monthName}</h4>
              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-slate-950/20 border border-transparent opacity-30"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayMilestones = milestonesByDate[dateStr] || [];

              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/20'
                      : dayMilestones.length > 0
                      ? 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayMilestones.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  {/* Day Milestones Chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayMilestones.slice(0, 2).map((m) => {
                      const isBlocked = isMilestoneBlocked(m) && m.status !== 'completed';
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleOpenMilestoneModal(m, false)}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium transition-all ${
                            m.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isBlocked
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                              : m.status === 'in_progress'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                          }`}
                          title={`${m.title} (${m.moduleName || m.phase})`}
                        >
                          {m.moduleName ? `[${m.moduleName}] ` : ''}
                          {m.title}
                        </div>
                      );
                    })}
                    {dayMilestones.length > 2 && (
                      <span className="text-[9px] text-slate-400 block text-right font-mono">
                        +{dayMilestones.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DELIVERABLE SCHEDULE / DEADLINES LIST */}
      {viewMode === 'deadlines' && (
        <div className="space-y-3">
          {filteredMilestones.map((m) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const effDate = m.estimatedCompletionDate || m.targetDate;
            const isToday = effDate === todayStr;
            const isPast = effDate < todayStr;
            const diffDays = Math.round(
              (new Date(effDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
            );
            const isBlocked = isMilestoneBlocked(m) && m.status !== 'completed';
            const variance = getDateVariance(m.targetDate, m.estimatedCompletionDate);
            const mProgress = calculateMilestoneProgress(m);

            return (
              <div
                key={m.id}
                onClick={() => handleOpenMilestoneModal(m, false)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    <MiniProgressRing
                      progress={mProgress}
                      status={m.status}
                      size={40}
                      strokeWidth={3.5}
                      title={`Task completion: ${mProgress}%`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                        {m.phase}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          mProgress === 100
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : mProgress >= 50
                            ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {mProgress}% Done
                      </span>
                      {m.moduleName && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {m.moduleName}
                        </span>
                      )}
                      <span className="text-xs text-cyan-400 font-mono">Quote: {m.quotationNumber}</span>
                      {isBlocked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          Prerequisites Pending
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {m.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      Est: {m.estimatedCompletionDate || m.targetDate}
                    </div>
                    <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                      <span className="text-[10px] text-slate-500 font-mono">Target: {m.targetDate}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          isToday
                            ? 'text-amber-400 animate-pulse'
                            : isPast
                            ? 'text-emerald-400'
                            : diffDays <= 7
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isToday ? 'Due Today' : isPast ? 'Completed' : `In ${diffDays} days`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMilestoneModal(m, true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Edit Schedule & Dependencies"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <a
                    href={generateGoogleCalendarUrl(m)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Add to Google Calendar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Milestone Detail & Interactive Schedule / Dependency Editor */}
      {activeMilestoneForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              id="close-milestone-modal-btn"
              onClick={() => {
                setActiveMilestoneForModal(null);
                setEditMilestoneForm(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Mode Selector */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 pr-10">
              <button
                id="modal-mode-overview-tab"
                onClick={() => setModalMode('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  modalMode === 'overview'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Overview & Acceptance Criteria
              </button>

              <button
                id="modal-mode-edit-tab"
                onClick={() => {
                  setModalMode('edit');
                  if (!editMilestoneForm) {
                    setEditMilestoneForm({
                      id: activeMilestoneForModal.id,
                      title: activeMilestoneForModal.title,
                      moduleName: activeMilestoneForModal.moduleName || 'Core Feature Module',
                      targetDate: activeMilestoneForModal.targetDate,
                      estimatedCompletionDate:
                        activeMilestoneForModal.estimatedCompletionDate || activeMilestoneForModal.targetDate,
                      dependencyIds: activeMilestoneForModal.dependencyIds
                        ? [...activeMilestoneForModal.dependencyIds]
                        : [],
                      status: activeMilestoneForModal.status,
                      progressPercent: activeMilestoneForModal.progressPercent || 0,
                      description: activeMilestoneForModal.description,
                      paymentMilestone: activeMilestoneForModal.paymentMilestone || '',
                      deliverables: [...activeMilestoneForModal.deliverables]
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  modalMode === 'edit'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Schedule & Dependencies</span>
              </button>
            </div>

            {/* TAB CONTENT A: OVERVIEW */}
            {modalMode === 'overview' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    <MiniProgressRing
                      progress={calculateMilestoneProgress(activeMilestoneForModal)}
                      status={activeMilestoneForModal.status}
                      size={48}
                      strokeWidth={3.8}
                      title={`Milestone Task Progress: ${calculateMilestoneProgress(activeMilestoneForModal)}%`}
                    />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-950 border border-slate-800 text-cyan-400">
                        {activeMilestoneForModal.phase}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          calculateMilestoneProgress(activeMilestoneForModal) === 100
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : calculateMilestoneProgress(activeMilestoneForModal) >= 50
                            ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {calculateMilestoneProgress(activeMilestoneForModal)}% Complete
                      </span>
                      {activeMilestoneForModal.moduleName && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Module: {activeMilestoneForModal.moduleName}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        Quote #{activeMilestoneForModal.quotationNumber}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{activeMilestoneForModal.title}</h3>
                    <p className="text-xs text-slate-400">{activeMilestoneForModal.projectName}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {activeMilestoneForModal.description}
                </p>

                {/* Target vs Estimated Completion Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Contractual Target Date
                    </span>
                    <span className="text-sm font-extrabold font-mono text-slate-300">
                      {activeMilestoneForModal.targetDate}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                        Estimated Completion Date
                      </span>
                      {(() => {
                        const variance = getDateVariance(
                          activeMilestoneForModal.targetDate,
                          activeMilestoneForModal.estimatedCompletionDate
                        );
                        return (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              variance.type === 'delayed'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : variance.type === 'ahead'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {variance.label}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-sm font-extrabold font-mono text-cyan-300">
                      {activeMilestoneForModal.estimatedCompletionDate || activeMilestoneForModal.targetDate}
                    </span>
                  </div>
                </div>

                {/* Dependency Link Inspection */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      <span>Software Module Dependencies</span>
                    </span>
                    <button
                      onClick={() => setModalMode('edit')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      + Adjust Links
                    </button>
                  </div>

                  {/* Prerequisites */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Prerequisites (Must be completed first):
                    </span>
                    {(() => {
                      const prereqs = getPrerequisites(activeMilestoneForModal);
                      if (prereqs.length === 0) {
                        return (
                          <div className="text-xs text-slate-500 italic px-2 py-1">
                            No prerequisite dependencies linked to this milestone.
                          </div>
                        );
                      }
                      return prereqs.map((prereq) => (
                        <div
                          key={prereq.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {prereq.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-white block">{prereq.title}</span>
                              <span className="text-[10px] text-indigo-300">
                                Module: {prereq.moduleName || prereq.phase}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              prereq.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {prereq.status === 'completed' ? 'Completed' : 'Blocking'}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Downstream dependencies */}
                  {(() => {
                    const downstream = getDownstreamDependents(activeMilestoneForModal);
                    if (downstream.length > 0) {
                      return (
                        <div className="space-y-1.5 pt-2 border-t border-slate-900">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Subsequent Modules Waiting on this:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {downstream.map((down) => (
                              <span
                                key={down.id}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1"
                              >
                                <ArrowRight className="w-3 h-3 text-cyan-400" />
                                <span>{down.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Deliverables Checklist with Individual Task Mini Progress Rings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Deliverables & Individual Tasks:
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {activeMilestoneForModal.deliverables.filter((d) => isDeliverableCompleted(activeMilestoneForModal, d)).length} of {activeMilestoneForModal.deliverables.length} Tasks ({calculateMilestoneProgress(activeMilestoneForModal)}%)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeMilestoneForModal.deliverables.map((item, idx) => {
                      const isDone = isDeliverableCompleted(activeMilestoneForModal, item);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleDeliverable(activeMilestoneForModal, item)}
                          title="Click to toggle individual task status"
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isDone
                              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200 hover:bg-emerald-950/50 shadow-sm shadow-emerald-950/40'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MiniProgressRing
                              progress={isDone ? 100 : 0}
                              status={isDone ? 'completed' : 'upcoming'}
                              size={22}
                              strokeWidth={2.5}
                              title={isDone ? 'Task 100% Completed' : 'Task 0% Pending'}
                            />
                            <span className={isDone ? 'line-through text-slate-400' : 'font-medium'}>
                              {item}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                              isDone ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isDone ? '100%' : '0%'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Status & Quick Completion % Presets */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 block">Quick Completion % Presets:</span>
                    <span className="text-xs font-mono font-extrabold text-cyan-400">
                      Current: {calculateMilestoneProgress(activeMilestoneForModal)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 25, 50, 75, 100].map((pct) => {
                      const isCurrent = calculateMilestoneProgress(activeMilestoneForModal) === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetMilestoneProgress(activeMilestoneForModal, pct)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center gap-1 border ${
                            isCurrent
                              ? pct === 100
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                                : 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <MiniProgressRing
                            progress={pct}
                            status={pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'upcoming'}
                            size={18}
                            strokeWidth={2}
                            showText={false}
                          />
                          <span>{pct}%</span>
                        </button>
                      );
                    })}
                  </div>

                  {onUpdateMilestoneStatus && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 block">Update Progress Status:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            handleSetMilestoneProgress(activeMilestoneForModal, 100);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            activeMilestoneForModal.status === 'completed'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          Completed
                        </button>

                        <button
                          onClick={() => {
                            handleSetMilestoneProgress(activeMilestoneForModal, 50);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            activeMilestoneForModal.status === 'in_progress'
                              ? 'bg-cyan-600 text-white border-cyan-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          In Progress
                        </button>

                        <button
                          onClick={() => {
                            handleSetMilestoneProgress(activeMilestoneForModal, 0);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            activeMilestoneForModal.status === 'upcoming'
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          Scheduled
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <a
                    href={generateGoogleCalendarUrl(activeMilestoneForModal)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Add to Google Calendar</span>
                  </a>

                  <button
                    onClick={() =>
                      exportMilestonesToICS([activeMilestoneForModal], `${activeMilestoneForModal.title}.ics`)
                    }
                    className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    title="Download .ics file"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>.ICS</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT B: EDIT SCHEDULE & DEPENDENCIES */}
            {modalMode === 'edit' && editMilestoneForm && (
              <form onSubmit={handleSaveMilestoneEdit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Milestone / Deliverable Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editMilestoneForm.title}
                    onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Software Module Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Software Module Link *</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Links checkpoint to a specific system module</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={editMilestoneForm.moduleName}
                      onChange={(e) =>
                        setEditMilestoneForm({ ...editMilestoneForm, moduleName: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {availableModules.map((mod) => (
                        <option key={mod} value={mod} className="bg-slate-900">
                          {mod}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Or enter custom software module..."
                      value={editMilestoneForm.moduleName}
                      onChange={(e) =>
                        setEditMilestoneForm({ ...editMilestoneForm, moduleName: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Date Controls: Target vs Estimated Completion */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Contractual Target Date
                      </label>
                      <input
                        type="date"
                        required
                        value={editMilestoneForm.targetDate}
                        onChange={(e) =>
                          setEditMilestoneForm({ ...editMilestoneForm, targetDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-cyan-300 block mb-1 flex items-center justify-between">
                        <span>Estimated Completion Date *</span>
                        {(() => {
                          const v = getDateVariance(
                            editMilestoneForm.targetDate,
                            editMilestoneForm.estimatedCompletionDate
                          );
                          return <span className="text-[10px] text-cyan-400 font-bold">{v.label}</span>;
                        })()}
                      </label>
                      <input
                        type="date"
                        required
                        value={editMilestoneForm.estimatedCompletionDate}
                        onChange={(e) =>
                          setEditMilestoneForm({
                            ...editMilestoneForm,
                            estimatedCompletionDate: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/60 text-cyan-200 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Quick Offset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Quick Adjust:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          estimatedCompletionDate: editMilestoneForm.targetDate
                        });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                    >
                      Same as Target
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(editMilestoneForm.estimatedCompletionDate || editMilestoneForm.targetDate);
                        cur.setDate(cur.getDate() + 1);
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          estimatedCompletionDate: cur.toISOString().split('T')[0]
                        });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold transition-colors"
                    >
                      +1 Day
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(editMilestoneForm.estimatedCompletionDate || editMilestoneForm.targetDate);
                        cur.setDate(cur.getDate() + 3);
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          estimatedCompletionDate: cur.toISOString().split('T')[0]
                        });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold transition-colors"
                    >
                      +3 Days
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(editMilestoneForm.estimatedCompletionDate || editMilestoneForm.targetDate);
                        cur.setDate(cur.getDate() + 7);
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          estimatedCompletionDate: cur.toISOString().split('T')[0]
                        });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold transition-colors"
                    >
                      +1 Week
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(editMilestoneForm.estimatedCompletionDate || editMilestoneForm.targetDate);
                        cur.setDate(cur.getDate() - 1);
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          estimatedCompletionDate: cur.toISOString().split('T')[0]
                        });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold transition-colors"
                    >
                      -1 Day Ahead
                    </button>
                  </div>
                </div>

                {/* Prerequisite Dependencies Checklist */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Select Prerequisite Modules / Milestones</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {editMilestoneForm.dependencyIds.length} dependencies linked
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This milestone cannot proceed until all checked prerequisite checkpoints are marked as completed.
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 mt-2">
                    {allMilestones
                      .filter((other) => other.id !== editMilestoneForm.id) // Avoid cyclic self-dependency
                      .map((other) => {
                        const isChecked = editMilestoneForm.dependencyIds.includes(other.id);
                        return (
                          <label
                            key={other.id}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-cyan-950/40 border-cyan-800/80 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditMilestoneForm({
                                      ...editMilestoneForm,
                                      dependencyIds: [...editMilestoneForm.dependencyIds, other.id]
                                    });
                                  } else {
                                    setEditMilestoneForm({
                                      ...editMilestoneForm,
                                      dependencyIds: editMilestoneForm.dependencyIds.filter(
                                        (id) => id !== other.id
                                      )
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded text-cyan-500 border-slate-700 bg-slate-950 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <span className="font-semibold text-xs block">{other.title}</span>
                                <span className="text-[10px] text-indigo-300">
                                  {other.moduleName ? `Module: ${other.moduleName}` : other.phase} • Target:{' '}
                                  {other.targetDate}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                other.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {other.status}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Status & Progress Percent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Current Milestone Status
                    </label>
                    <select
                      value={editMilestoneForm.status}
                      onChange={(e) =>
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          status: e.target.value as MilestoneStatus
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="upcoming">Scheduled (Upcoming)</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Sprint Progress: {editMilestoneForm.progressPercent}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={editMilestoneForm.progressPercent}
                      onChange={(e) =>
                        setEditMilestoneForm({
                          ...editMilestoneForm,
                          progressPercent: parseInt(e.target.value, 10)
                        })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Description & Deliverable Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editMilestoneForm.description}
                    onChange={(e) =>
                      setEditMilestoneForm({ ...editMilestoneForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('overview')}
                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Schedule & Dependencies</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Add Custom Checkpoint / Milestone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Software Module Checkpoint</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set a custom deadline, estimated completion date, and prerequisite dependencies for this module.
              </p>
            </div>

            <form onSubmit={handleSaveCustomMilestone} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Milestone / Checkpoint Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay Integration & Webhook Testing"
                  value={newMilestoneForm.title}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Related Quotation *
                  </label>
                  <select
                    value={newMilestoneForm.quotationNumber}
                    onChange={(e) =>
                      setNewMilestoneForm({ ...newMilestoneForm, quotationNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {activeQuotations.map((q) => (
                      <option key={q.id} value={q.quotationNumber} className="bg-slate-900">
                        {q.quotationNumber} ({q.customer.companyName || q.customer.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Software Module *</span>
                  </label>
                  <select
                    value={newMilestoneForm.moduleName}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, moduleName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {availableModules.map((mod) => (
                      <option key={mod} value={mod} className="bg-slate-900">
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Dates: Target vs Estimated */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Contractual Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMilestoneForm.targetDate}
                    onChange={(e) =>
                      setNewMilestoneForm({
                        ...newMilestoneForm,
                        targetDate: e.target.value,
                        estimatedCompletionDate: newMilestoneForm.estimatedCompletionDate || e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-cyan-300 block mb-1">
                    Estimated Completion Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMilestoneForm.estimatedCompletionDate}
                    onChange={(e) =>
                      setNewMilestoneForm({ ...newMilestoneForm, estimatedCompletionDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/60 text-cyan-200 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dependencies Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Prerequisite Dependency Links</span>
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {allMilestones.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No existing milestones to link</span>
                  ) : (
                    allMilestones.map((m) => {
                      const isChecked = newMilestoneForm.dependencyIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMilestoneForm({
                                  ...newMilestoneForm,
                                  dependencyIds: [...newMilestoneForm.dependencyIds, m.id]
                                });
                              } else {
                                setNewMilestoneForm({
                                  ...newMilestoneForm,
                                  dependencyIds: newMilestoneForm.dependencyIds.filter((id) => id !== m.id)
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-cyan-500 border-slate-700 bg-slate-950 cursor-pointer"
                          />
                          <span className="truncate">{m.title}</span>
                          <span className="text-[10px] text-slate-500 ml-auto shrink-0 font-mono">
                            {m.moduleName || m.phase}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Project Phase
                  </label>
                  <select
                    value={newMilestoneForm.phase}
                    onChange={(e) =>
                      setNewMilestoneForm({ ...newMilestoneForm, phase: e.target.value as MilestonePhase })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Kickoff & Advance">Kickoff & Advance</option>
                    <option value="Wireframe & Architecture">Wireframe & Architecture</option>
                    <option value="Sprint 1 Development">Sprint 1 Development</option>
                    <option value="Sprint 2 Core Features">Sprint 2 Core Features</option>
                    <option value="QA Testing & Security">QA Testing & Security</option>
                    <option value="UAT & Client Demo">UAT & Client Demo</option>
                    <option value="Production Launch">Production Launch</option>
                    <option value="Warranty & AMC">Warranty & AMC</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Payment Trigger (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50% Milestone settlement"
                    value={newMilestoneForm.paymentMilestone}
                    onChange={(e) =>
                      setNewMilestoneForm({ ...newMilestoneForm, paymentMilestone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables, API blueprints, or review criteria..."
                  value={newMilestoneForm.description}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Deliverable 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Core API Endpoints Functional"
                    value={newMilestoneForm.deliverable1}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, deliverable1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Deliverable 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Integration Tests Passing"
                    value={newMilestoneForm.deliverable2}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, deliverable2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
