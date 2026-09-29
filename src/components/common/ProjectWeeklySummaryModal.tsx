import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Calendar,
  Share2,
  Save,
  CheckCircle2,
  Download
} from 'lucide-react';
import { Project, ProjectMilestone } from '../../types';
import { generateWeeklyProjectSummary } from '../../services/geminiService';

interface ProjectWeeklySummaryModalProps {
  isOpen: boolean;
  project: Project | null;
  milestones: ProjectMilestone[];
  onClose: () => void;
  onSaveToProjectNotes?: (project: Project, newNotes: string) => Promise<void> | void;
}

export const ProjectWeeklySummaryModal: React.FC<ProjectWeeklySummaryModalProps> = ({
  isOpen,
  project,
  milestones,
  onClose,
  onSaveToProjectNotes
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      // If we don't have a summary yet for this project, generate automatically
      handleGenerate();
    } else {
      setSummary('');
      setError(null);
      setCopied(false);
      setSavedToNotes(false);
      setGeneratedAt(null);
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  const relevantMilestones = milestones.filter(
    (m) => m.quotationId === project.quotationId || m.projectName === project.title
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setSavedToNotes(false);

    try {
      const result = await generateWeeklyProjectSummary(project, relevantMilestones);
      setSummary(result);
      setGeneratedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setError(err?.message || 'Unable to generate summary. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-weekly-status.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveNotes = async () => {
    if (!summary || !onSaveToProjectNotes) return;
    const timestamp = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const updatedNotes = project.notes
      ? `${project.notes}\n\n[Weekly AI Digest - ${timestamp}]:\n${summary.slice(0, 500)}...`
      : `[Weekly AI Digest - ${timestamp}]:\n${summary.slice(0, 500)}...`;

    try {
      await onSaveToProjectNotes(project, updatedNotes);
      setSavedToNotes(true);
      setTimeout(() => setSavedToNotes(false), 3000);
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  };

  const renderFormattedSummary = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            const title = trimmed.replace(/^###?\s+/, '');
            return (
              <div
                key={idx}
                className="pt-2 pb-1 border-b border-slate-200 font-bold text-cyan-800 text-sm sm:text-base flex items-center gap-2"
              >
                <span>{title}</span>
              </div>
            );
          }

          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-black text-slate-900 pt-1">
                {trimmed.replace(/^#\s+/, '')}
              </h3>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 mt-2 shrink-0" />
                <div className="flex-1">{formatInlineEmphasis(content)}</div>
              </div>
            );
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            const numberMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
            if (numberMatch) {
              return (
                <div key={idx} className="flex items-start gap-2 pl-2">
                  <span className="font-bold text-cyan-700 shrink-0">{numberMatch[1]}</span>
                  <div className="flex-1">{formatInlineEmphasis(numberMatch[2])}</div>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="text-slate-700">
              {formatInlineEmphasis(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const formatInlineEmphasis = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-slate-900 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700">
                <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                Gemini 3.8 Flash • Weekly Executive Brief
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {project.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                Client: {project.customerName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                Status: {project.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
                {project.progressPercent}% Completed
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {relevantMilestones.length} Milestones Tracked
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-14 h-14 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-cyan-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Synthesizing Weekly Status Report...
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gemini 3.8 Flash is analyzing current project velocity, evaluating upcoming milestone delivery dates, and assessing potential technical blockers.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold text-rose-800">Generation Error</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Generation</span>
              </button>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Timestamp & Model Badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Generated {generatedAt ? `today at ${generatedAt}` : 'just now'} based on active project state
                </span>
                <span className="text-cyan-700 font-medium">Model: gemini-3.8-flash</span>
              </div>

              {/* Rendered Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                {renderFormattedSummary(summary)}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Ready to Generate</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click below to create an AI-powered natural language summary of current progress, upcoming milestones, and risk factors.
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Summary</span>
          </button>

          <div className="flex items-center gap-2">
            {summary && !loading && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download Markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download .md</span>
                </button>

                {onSaveToProjectNotes && (
                  <button
                    onClick={handleSaveNotes}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Append summary snippet to project notes"
                  >
                    {savedToNotes ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Notes Updated</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Append to Notes</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Digest</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
