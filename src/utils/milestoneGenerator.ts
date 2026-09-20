import { Quotation, ProjectMilestone, MilestonePhase, MilestoneStatus } from '../types';

/**
 * Calculates milestone target dates based on quotation start date and project timeline duration
 */
function parseTimelineToDays(timelineString?: string): number {
  if (!timelineString) return 28; // default 4 weeks
  const lower = timelineString.toLowerCase();
  if (lower.includes('1-2')) return 14;
  if (lower.includes('2-3')) return 21;
  if (lower.includes('3-4')) return 28;
  if (lower.includes('4-6')) return 38;
  if (lower.includes('6-8')) return 50;
  if (lower.includes('8-12')) return 70;
  if (lower.includes('12+')) return 90;

  // Fallback regex for "X weeks"
  const match = lower.match(/(\d+)\s*(week|wk)/);
  if (match && match[1]) {
    return parseInt(match[1], 10) * 7;
  }
  return 28;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToDate(baseDate: Date, days: number): Date {
  const res = new Date(baseDate);
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Derives comprehensive project milestones from booked quotations
 */
export function deriveMilestonesFromQuotations(
  quotations: Quotation[],
  customMilestones: ProjectMilestone[] = []
): ProjectMilestone[] {
  const activeQuotes = quotations.filter(
    (q) => q.status === 'Booked' || q.status === 'In Progress' || q.status === 'Completed' || q.status === 'Sent'
  );

  const derivedMilestones: ProjectMilestone[] = [];
  const currentDateStr = new Date().toISOString().split('T')[0];
  const currentDate = new Date(currentDateStr);

  activeQuotes.forEach((quote) => {
    const rawStartDate = quote.createdAt || quote.date || new Date().toISOString();
    const startDate = new Date(rawStartDate.split('T')[0]);
    const totalDays = parseTimelineToDays(quote.customer.projectTimeline);

    // Project Name summary
    const primaryServiceNames = quote.items.slice(0, 2).map((i) => i.name).join(' + ');
    const projectName = quote.customer.companyName
      ? `${quote.customer.companyName} (${primaryServiceNames || 'Digital Project'})`
      : primaryServiceNames || 'Software Project';

    const techLead = quote.assignedStaffName || 'Aman Sharma (Lead Architect)';

    interface PhaseConfig {
      phase: MilestonePhase;
      title: string;
      description: string;
      dayOffsetPercent: number;
      deliverables: string[];
      paymentMilestone?: string;
    }

    const phases: PhaseConfig[] = [
      {
        phase: 'Kickoff & Advance',
        title: 'Project Kickoff & 50% Advance Verification',
        description: 'Verification of 50% advance payment, initial requirements lock, Git repository setup, and project kickoff call.',
        dayOffsetPercent: 0,
        deliverables: [
          '50% Advance Payment Verified & Bank Receipt Issued',
          'Client Project Channel Created (WhatsApp / Slack)',
          'Git Source Repository & Cloud Environment Initialized',
          'Kickoff Architecture Sync Completed'
        ],
        paymentMilestone: '50% Advance (Non-refundable) Kickoff Trigger'
      },
      {
        phase: 'Wireframe & Architecture',
        title: 'UX/UI Wireframe Sign-off & Database Schema',
        description: 'Interactive wireframes in Figma, database schema modeling, and API endpoints blueprint finalized with client sign-off.',
        dayOffsetPercent: 0.18,
        deliverables: [
          'Figma Interactive UI Prototype & Wireframes',
          'Database Architecture & Relational ERD Finalized',
          'API Contract & Third-party Integrations Blueprint'
        ]
      },
      {
        phase: 'Sprint 1 Development',
        title: 'Sprint 1 Review & Alpha Staging Demo',
        description: 'Core application layout, authentication, responsive interface, and initial backend business logic ready for client walkthrough.',
        dayOffsetPercent: 0.42,
        deliverables: [
          'Frontend Design System & Navigation Implementation',
          'User Authentication & Role-Based Access Control',
          'Alpha Staging Preview Link Dispatched'
        ]
      },
      {
        phase: 'Sprint 2 Core Features',
        title: 'Sprint 2 Feature Complete & Integration',
        description: 'Full scoped functional modules completed including payment gateways, dynamic workflows, and external API connectors.',
        dayOffsetPercent: 0.70,
        deliverables: [
          `${quote.items.length} Scoped Service Modules Developed`,
          'Payment Gateway & Notification Webhooks Active',
          'Mobile & Tablet Responsive Fine-tuning'
        ]
      },
      {
        phase: 'QA Testing & Security',
        title: 'Comprehensive QA, Security & Speed Audit',
        description: 'Rigorous cross-device testing, automated unit tests, OWASP security audit, SSL installation, and performance optimization.',
        dayOffsetPercent: 0.82,
        deliverables: [
          'Cross-Browser & Android/iOS Compatibility Test',
          'OWASP Vulnerability & API Security Audit Passed',
          'PageSpeed / Lighthouse 90+ Score Benchmark'
        ]
      },
      {
        phase: 'UAT & Client Demo',
        title: 'User Acceptance Testing (UAT) & Balance Payment',
        description: 'Formal client acceptance demo on staging environment, review feedback adjustments, and settlement of final 50% balance.',
        dayOffsetPercent: 0.92,
        deliverables: [
          'Client Walkthrough & Feedback Resolution',
          'Formal UAT Acceptance Sign-off',
          'Final 50% Balance Payment Invoice Issued'
        ],
        paymentMilestone: 'Final 50% Balance Payable on Handover'
      },
      {
        phase: 'Production Launch',
        title: 'Production Deployment & Live Domain Handover',
        description: 'Final production build deployed to cloud server, live custom domain SSL pointed, source code repository and admin credentials delivered.',
        dayOffsetPercent: 1.0,
        deliverables: [
          'Production Cloud Deployment Live & Healthy',
          'Custom Domain DNS & SSL Certificate Secured',
          'Complete Source Code & Admin Credentials Handover'
        ]
      },
      {
        phase: 'Warranty & AMC',
        title: '30-Day Warranty & Annual Maintenance (AMC)',
        description: '30-day post-launch bug warranty support wrap-up, followed by optional Annual Maintenance Contract (AMC) support commencement.',
        dayOffsetPercent: 1.0 + 30 / totalDays, // 30 days after launch
        deliverables: [
          '30-Day Post-Launch Free Bug-fix Warranty Completed',
          'Annual AMC SLA Support Active (If chosen)',
          'Automated Daily Database Backups Active'
        ]
      }
    ];

    phases.forEach((p, idx) => {
      const offsetDays = Math.round(totalDays * p.dayOffsetPercent);
      const targetDateObj = addDaysToDate(startDate, offsetDays);
      const targetDateStr = formatDateISO(targetDateObj);

      // Determine milestone status
      let status: MilestoneStatus = 'upcoming';

      if (quote.status === 'Completed') {
        status = 'completed';
      } else if (targetDateObj < currentDate) {
        // In past
        if (quote.status === 'In Progress' && idx <= 3) {
          status = 'completed';
        } else if (quote.status === 'Booked' && idx === 0) {
          status = 'completed';
        } else {
          status = 'completed';
        }
      } else {
        // In future or today
        const diffDays = Math.round((targetDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 4 && diffDays >= 0) {
          status = 'in_progress';
        } else {
          status = 'upcoming';
        }
      }

      // Calculate approximate progress
      let progressPercent = 0;
      if (status === 'completed') progressPercent = 100;
      else if (status === 'in_progress') progressPercent = 50;
      else progressPercent = 0;

      derivedMilestones.push({
        id: `ms-${quote.id}-${idx}`,
        quotationId: quote.id,
        quotationNumber: quote.quotationNumber,
        projectName,
        phase: p.phase,
        title: p.title,
        description: p.description,
        targetDate: targetDateStr,
        status,
        deliverables: p.deliverables,
        assignedLead: techLead,
        paymentMilestone: p.paymentMilestone,
        progressPercent,
        isCustom: false
      });
    });
  });

  // Combine with any user-added custom milestones
  const allMilestones = [...derivedMilestones, ...customMilestones];

  // Sort by target date ascending
  allMilestones.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  return allMilestones;
}

/**
 * Generates an "Add to Google Calendar" web URL
 */
export function generateGoogleCalendarUrl(milestone: ProjectMilestone): string {
  const startDateStr = milestone.targetDate.replace(/-/g, '');
  // Default all-day event
  const dates = `${startDateStr}/${startDateStr}`;
  const title = encodeURIComponent(`[TechSoftware.digital] ${milestone.title} (${milestone.quotationNumber})`);
  const details = encodeURIComponent(
    `${milestone.description}\n\nProject: ${milestone.projectName}\nPhase: ${milestone.phase}\nLead: ${milestone.assignedLead || 'TechSoftware.digital Team'}\nDeliverables:\n${milestone.deliverables.map(d => `• ${d}`).join('\n')}\n${milestone.paymentMilestone ? `Payment Trigger: ${milestone.paymentMilestone}` : ''}`
  );
  const location = encodeURIComponent('TechSoftware.digital Client Portal / Virtual Meeting');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generates a downloadable iCalendar (.ics) file string for Apple Calendar, Outlook, and others
 */
export function exportMilestonesToICS(milestones: ProjectMilestone[], fileName = 'TechSoftware_Project_Milestones.ics'): void {
  const eventsString = milestones
    .map((m) => {
      const dateClean = m.targetDate.replace(/-/g, '');
      const summary = `[TechSoftware.digital] ${m.title}`;
      const desc = `${m.description} | Quote: ${m.quotationNumber} | Lead: ${m.assignedLead || 'TechSoftware.digital'}`.replace(/,/g, '\\,');

      return [
        'BEGIN:VEVENT',
        `UID:${m.id}@techsoftware.digital`,
        `DTSTAMP:${dateClean}T090000Z`,
        `DTSTART;VALUE=DATE:${dateClean}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n');
    })
    .join('\r\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TechSoftware.digital//Project Milestones Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    eventsString,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
