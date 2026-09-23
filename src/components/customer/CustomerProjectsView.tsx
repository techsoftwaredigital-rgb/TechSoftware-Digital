import React from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Project, ProjectMilestone, UserAccount } from '../../types';

interface CustomerProjectsViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  milestones: ProjectMilestone[];
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
  onNavigateToMessages
}) => {
  // Filter for user
  const userProjects = projects.filter((p) => {
    if (!currentUser) return true;
    return (
      (p.customerEmail && p.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      p.customerId === currentUser.uid ||
      p.customerName.toLowerCase().includes(currentUser.displayName.toLowerCase())
    );
  });

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
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
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
        <div className="space-y-6">
          {userProjects.map((project) => {
            const projectMilestones = milestones.filter(
              (m) => m.quotationId === project.quotationId || m.projectName === project.title
            );

            return (
              <div
                key={project.id}
                className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        {project.title}
                      </h2>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {project.description || 'Full-Stack Software Architecture & Implementation'}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">Project Investment:</span>
                    <span className="text-lg font-black text-cyan-400">
                      ₹{project.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Target Completion: {project.expectedCompletionDate || '4 Weeks'}
                    </span>
                  </div>
                </div>

                {/* Stage Progression Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      Overall Delivery Progress:
                    </span>
                    <span className="font-extrabold text-cyan-400 font-mono">
                      {project.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md shadow-cyan-500/20"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>

                  {/* Stage checkpoints */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                    {STAGE_ORDER.map((stage, idx) => {
                      const currentStageIdx = STAGE_ORDER.indexOf(project.status);
                      const isPast = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div
                          key={stage}
                          className={`p-2 rounded-xl border text-center text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                              : isPast
                              ? 'bg-slate-950/80 border-emerald-900/60 text-emerald-400'
                              : 'bg-slate-950/40 border-slate-800 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            {isPast ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <span>Step {idx + 1}</span>
                            )}
                          </div>
                          <span>{stage}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestones Checklist */}
                {projectMilestones.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Project Milestones & Deliverables ({projectMilestones.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projectMilestones.map((m) => (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white truncate">{m.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                m.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : m.status === 'in_progress'
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {m.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{m.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                            <span>Target: {m.targetDate}</span>
                            {m.deliverables && (
                              <span>{m.deliverables.length} Deliverables</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer notes & quick actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                  {project.notes ? (
                    <p className="text-slate-400 italic">
                      <strong>Architect Note:</strong> {project.notes}
                    </p>
                  ) : (
                    <span className="text-slate-500">Staging branch deployed to Firebase Hosting preview.</span>
                  )}

                  <button
                    onClick={onNavigateToMessages}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
                  >
                    <span>Message Assigned Developer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
