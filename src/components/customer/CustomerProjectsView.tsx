import React, { useState } from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Smartphone,
  BarChart3
} from 'lucide-react';
import { Project, ProjectMilestone, UserAccount } from '../../types';
import { ProjectWeeklySummaryModal } from '../common/ProjectWeeklySummaryModal';
import { SwipeableProjectCard } from './SwipeableProjectCard';
import { ProjectGanttChart } from './ProjectGanttChart';

interface CustomerProjectsViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  milestones: ProjectMilestone[];
  isMobileDeviceView?: boolean;
  onNavigateToMessages: () => void;
}

const STAGE_ORDER: Project['status'][] = [
  'Pending',
  'Planning',
  'Development',
  'Testing',
  'Live',
  'Completed'
];

export const CustomerProjectsView: React.FC<CustomerProjectsViewProps> = ({
  currentUser,
  projects,
  milestones,
  isMobileDeviceView = false,
  onNavigateToMessages
}) => {
  const [selectedProjectForSummary, setSelectedProjectForSummary] = useState<Project | null>(null);
  const [showGlobalGantt, setShowGlobalGantt] = useState(false);

  // Track dismissed projects locally during the session (swipe-to-dismiss)
  const [dismissedProjectIds, setDismissedProjectIds] = useState<string[]>([]);
  const [lastDismissedProject, setLastDismissedProject] = useState<{ id: string; title: string } | null>(null);

  // Filter for user
  const userProjects = projects.filter((p) => {
    if (!currentUser) return true;
    return (
      (p.customerEmail && p.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      p.customerId === currentUser.uid ||
      p.customerName.toLowerCase().includes(currentUser.displayName.toLowerCase())
    );
  });

  // Visible projects (excluding dismissed ones)
  const visibleProjects = userProjects.filter((p) => !dismissedProjectIds.includes(p.id));

  const handleDismissProject = (projectId: string, projectTitle: string) => {
    setDismissedProjectIds((prev) => [...prev, projectId]);
    setLastDismissedProject({ id: projectId, title: projectTitle });
  };

  const handleUndoDismiss = () => {
    if (lastDismissedProject) {
      setDismissedProjectIds((prev) => prev.filter((id) => id !== lastDismissedProject.id));
      setLastDismissedProject(null);
    }
  };

  const handleResetDismissed = () => {
    setDismissedProjectIds([]);
    setLastDismissedProject(null);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Live':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{status}</span>
          </span>
        );
      case 'Development':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold animate-pulse">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Sprint in Progress</span>
          </span>
        );
      case 'Testing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>QA & Security Testing</span>
          </span>
        );
      case 'On Hold':
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Project Health & Milestones</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Active Development Projects
            </h1>
            <p className="text-xs text-slate-300">
              Track sprint stages, milestone completions, delivery schedules, and live staging URLs.
            </p>
          </div>

          {userProjects.length > 0 && (
            <button
              onClick={() => setShowGlobalGantt(!showGlobalGantt)}
              className={`self-start sm:self-auto px-4 py-2.5 rounded-xl border text-xs font-black flex items-center gap-2 transition-all shadow-sm ${
                showGlobalGantt
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-950 hover:bg-slate-800 text-cyan-400 border-cyan-500/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showGlobalGantt ? 'Hide Gantt Timeline' : 'View Gantt Timeline Chart'}</span>
            </button>
          )}
        </div>

        {/* Global Gantt Chart Section when toggled from header */}
        {showGlobalGantt && userProjects.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <ProjectGanttChart
              project={userProjects[0]}
              milestones={milestones}
              isMobileDeviceView={isMobileDeviceView}
            />
          </div>
        )}
      </div>

      {userProjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Active Projects Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you accept a quotation and kickoff advance is received, our developer team initializes your active project dashboard.
          </p>
          <button
            onClick={onNavigateToMessages}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all"
          >
            Connect with Lead Developer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile swipe gesture guide banner & Reset banner */}
          <div className="flex items-center justify-between gap-3 px-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isMobileDeviceView ? (
                  <span><strong>Mobile Mode:</strong> Swipe cards left or right to dismiss</span>
                ) : (
                  <span>Touch-ready: Supports swipe gestures on mobile screens</span>
                )}
              </span>
            </div>

            {dismissedProjectIds.length > 0 && (
              <button
                onClick={handleResetDismissed}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold text-xs transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore All ({dismissedProjectIds.length})</span>
              </button>
            )}
          </div>

          {/* Last Dismissed Undo Toast */}
          {lastDismissedProject && (
            <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-slate-300 truncate">
                  Dismissed: <strong className="text-white font-medium">{lastDismissedProject.title}</strong>
                </span>
              </div>
              <button
                onClick={handleUndoDismiss}
                className="px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shrink-0 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            </div>
          )}

          {/* If all visible projects are dismissed */}
          {visibleProjects.length === 0 && dismissedProjectIds.length > 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <RotateCcw className="w-8 h-8 text-cyan-400 mx-auto animate-spin-slow" />
              <h3 className="text-base font-bold text-slate-200">All Live Project Cards Dismissed</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You have swiped away all project cards in this mobile session. Tap below to restore them to view.
              </p>
              <button
                onClick={handleResetDismissed}
                className="mt-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All {userProjects.length} Projects</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleProjects.map((project) => (
                <SwipeableProjectCard
                  key={project.id}
                  project={project}
                  milestones={milestones}
                  isMobileDeviceView={isMobileDeviceView}
                  onDismiss={handleDismissProject}
                  onOpenSummary={(p) => setSelectedProjectForSummary(p)}
                  onNavigateToMessages={onNavigateToMessages}
                  getStatusBadge={getStatusBadge}
                  STAGE_ORDER={STAGE_ORDER}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Project Summary Modal Powered by Gemini 3.8 Flash */}
      <ProjectWeeklySummaryModal
        isOpen={!!selectedProjectForSummary}
        project={selectedProjectForSummary}
        milestones={milestones}
        onClose={() => setSelectedProjectForSummary(null)}
      />
    </div>
  );
};
