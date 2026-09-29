import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  CheckCircle2,
  Activity,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Project, ProjectMilestone } from '../../types';
import { ProjectGanttChart } from './ProjectGanttChart';

interface SwipeableProjectCardProps {
  project: Project;
  milestones: ProjectMilestone[];
  isMobileDeviceView?: boolean;
  onDismiss: (projectId: string, projectTitle: string) => void;
  onOpenSummary: (project: Project) => void;
  onNavigateToMessages: () => void;
  getStatusBadge: (status: Project['status']) => React.ReactNode;
  STAGE_ORDER: Project['status'][];
}

const DISMISS_THRESHOLD = 90; // Pixels required to trigger swipe dismissal

export const SwipeableProjectCard: React.FC<SwipeableProjectCardProps> = ({
  project,
  milestones,
  isMobileDeviceView = false,
  onDismiss,
  onOpenSummary,
  onNavigateToMessages,
  getStatusBadge,
  STAGE_ORDER
}) => {
  // Swipe gesture state
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showGanttTimeline, setShowGanttTimeline] = useState(false);

  // Touch tracking refs
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable touch gesture if in Mobile Device View or on small touch screens
    if (e.touches.length !== 1) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    // Detect if the user's initial movement is horizontal or vertical scrolling
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // If it's a horizontal swipe, damp the drag and prevent page scrolling
    if (isHorizontalSwipeRef.current) {
      // Damped movement with a max limit
      const dampedX = deltaX * 0.9;
      setOffsetX(dampedX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    // Check if threshold exceeded
    if (Math.abs(offsetX) >= DISMISS_THRESHOLD) {
      // Trigger dismissal animation
      setIsDismissing(true);
      const exitDirection = offsetX > 0 ? 500 : -500;
      setOffsetX(exitDirection);

      setTimeout(() => {
        onDismiss(project.id, project.title);
      }, 300);
    } else {
      // Snap back
      setOffsetX(0);
    }

    isHorizontalSwipeRef.current = null;
  };

  // Mouse drag support for desktop simulator testing in mobile device view
  const mouseStartXRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow mouse drag dismiss when in mobile simulator mode
    if (!isMobileDeviceView) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    setOffsetX(deltaX * 0.85);
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsSwiping(false);

    if (Math.abs(offsetX) >= DISMISS_THRESHOLD) {
      setIsDismissing(true);
      const exitDirection = offsetX > 0 ? 500 : -500;
      setOffsetX(exitDirection);

      setTimeout(() => {
        onDismiss(project.id, project.title);
      }, 300);
    } else {
      setOffsetX(0);
    }
  };

  // Milestone items
  const projectMilestones = milestones.filter(
    (m) => m.quotationId === project.quotationId || m.projectName === project.title
  );

  const isSwipePastThreshold = Math.abs(offsetX) >= DISMISS_THRESHOLD;
  const swipeProgress = Math.min(1, Math.abs(offsetX) / DISMISS_THRESHOLD);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${
        isDismissing ? 'max-h-0 opacity-0 my-0 py-0 overflow-hidden' : 'max-h-[1200px]'
      }`}
    >
      {/* Background revealed during swipe */}
      <div
        className={`absolute inset-0 rounded-3xl flex items-center justify-between px-6 transition-colors duration-200 ${
          isSwipePastThreshold
            ? 'bg-rose-100 border border-rose-300'
            : 'bg-slate-100 border border-slate-200'
        }`}
      >
        {/* Left Indicator (revealed on right swipe) */}
        <div
          className={`flex items-center gap-2 font-bold text-xs transition-transform ${
            offsetX > 20 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } ${isSwipePastThreshold ? 'text-rose-900' : 'text-rose-600'}`}
        >
          <div className="w-9 h-9 rounded-full bg-rose-200 border border-rose-300 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-rose-600 animate-pulse" />
          </div>
          <div>
            <span className="block font-black">
              {isSwipePastThreshold ? 'Release to Dismiss' : 'Swipe to Dismiss'}
            </span>
            <span className="text-[10px] text-rose-600/80">Hide from mobile live view</span>
          </div>
        </div>

        {/* Right Indicator (revealed on left swipe) */}
        <div
          className={`flex items-center gap-2 font-bold text-xs text-right transition-transform ml-auto ${
            offsetX < -20 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } ${isSwipePastThreshold ? 'text-rose-900' : 'text-rose-600'}`}
        >
          <div>
            <span className="block font-black">
              {isSwipePastThreshold ? 'Release to Dismiss' : 'Swipe to Dismiss'}
            </span>
            <span className="text-[10px] text-rose-600/80">Hide from mobile live view</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-200 border border-rose-300 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-rose-600 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Foreground Swipeable Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translateX(${offsetX}px) rotate(${offsetX * 0.03}deg)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
          opacity: 1 - Math.min(0.6, (Math.abs(offsetX) / 400))
        }}
        className={`relative z-10 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 select-none touch-pan-y ${
          isMobileDeviceView ? 'cursor-grab active:cursor-grabbing ring-1 ring-slate-200' : ''
        }`}
      >
        {/* Mobile Swipe Hint Banner inside card */}
        <div className="flex items-center justify-between gap-2 -mt-1 pb-1 border-b border-slate-200 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-cyan-600" />
            <span>Mobile Gesture:</span>
            <span className="text-slate-600 font-medium">Swipe card left or right to dismiss</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <ChevronLeft className="w-3 h-3 animate-pulse text-cyan-600" />
            <span>Swipe</span>
            <ChevronRight className="w-3 h-3 animate-pulse text-cyan-600" />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {project.title}
              </h2>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {project.description || 'Full-Stack Software Architecture & Implementation'}
            </p>
          </div>

          <div className="sm:text-right shrink-0 flex items-center sm:block justify-between pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <span className="text-[11px] text-slate-500 block">Project Investment:</span>
            <span className="text-base sm:text-lg font-black text-cyan-700">
              ₹{project.amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Stage Progression Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              Delivery Progress:
            </span>
            <span className="font-extrabold text-cyan-700 font-mono">
              {project.progressPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>

          {/* Stage checkpoints */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1.5">
            {STAGE_ORDER.map((stage, idx) => {
              const currentStageIdx = STAGE_ORDER.indexOf(project.status);
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div
                  key={stage}
                  className={`p-1.5 rounded-xl border text-center text-[9px] sm:text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-2xs'
                      : isPast
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    {isPast ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    ) : (
                      <span>Step {idx + 1}</span>
                    )}
                  </div>
                  <span className="truncate block">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones Checklist */}
        {projectMilestones.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Project Milestones ({projectMilestones.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projectMilestones.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-800 truncate text-xs">{m.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        m.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'in_progress'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{m.description}</p>
                  <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200">
                    Target: {m.targetDate}
                  </div>
                </div>
              ))}
            </div>
            {projectMilestones.length > 2 && (
              <span className="text-[10px] text-slate-500 block text-right">
                +{projectMilestones.length - 2} more deliverables in scope
              </span>
            )}
          </div>
        )}

        {/* Footer notes & quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="text-slate-500 text-[11px]">
            Target Completion: <strong className="text-slate-800">{project.expectedCompletionDate || '4 Weeks'}</strong>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            <button
              onClick={() => setShowGanttTimeline(!showGanttTimeline)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                showGanttTimeline
                  ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
              <span>{showGanttTimeline ? 'Hide Gantt Chart' : 'Gantt Timeline'}</span>
            </button>

            <button
              onClick={() => onOpenSummary(project)}
              className="px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={onNavigateToMessages}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>Message</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Gantt-Style Timeline Chart Section */}
        {showGanttTimeline && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <ProjectGanttChart
              project={project}
              milestones={milestones}
              isMobileDeviceView={isMobileDeviceView}
            />
          </div>
        )}
      </div>
    </div>
  );
};
