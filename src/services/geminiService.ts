import { Project, ProjectMilestone } from '../types';

export interface WeeklySummaryResult {
  summary: string;
  generatedAt: string;
}

/**
 * Calls server-side Gemini 3.8 Flash proxy to generate an executive
 * weekly natural language summary of project status, upcoming milestones, and potential blockers.
 */
export async function generateWeeklyProjectSummary(
  project: Project,
  milestones: ProjectMilestone[] = []
): Promise<string> {
  const response = await fetch('/api/gemini/project-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project,
      milestones,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Server responded with ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  if (!data.summary) {
    throw new Error('No summary was returned by the AI service.');
  }

  return data.summary;
}
