export type ServiceCategory =
  | 'Website'
  | 'Web Application'
  | 'Business Software'
  | 'SaaS'
  | 'Mobile App'
  | 'Web Invitation'
  | 'Add-on'
  | 'Development Add-on'
  | 'AI'
  | 'Hosting'
  | 'Play Store / App Store'
  | 'UI/UX'
  | 'Security'
  | 'Maintenance';

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  marketMin: number;
  marketMax: number;
  suggestedQuote: number;
  defaultQty: number;
  discountPercent: number;
  gstPercent: number;
  isActive: boolean;
  featured?: boolean;
}

export interface QuotationSelectedService {
  serviceId: string;
  category: ServiceCategory;
  name: string;
  description: string;
  unitPrice: number;
  marketMin: number;
  marketMax: number;
  qty: number;
  discountPercent: number;
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  finalAmount: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  projectTimeline: string;
  projectRequirements: string;
  address?: string;
  gstin?: string;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Booked'
  | 'Advance Received'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type AmcTier = 'none' | 'bronze' | 'silver' | 'gold' | 'standard' | 'premium' | 'custom';

export interface AmcPlanDetails {
  tier: AmcTier;
  tierName: string;
  annualFee: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  billingCycle: 'annual' | 'quarterly';
  slaResponseHours: number;
  monthlyDevHours: number;
  features: string[];
  isAppendedToTotal: boolean;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  customer: CustomerDetails;
  items: QuotationSelectedService[];
  devSubtotalTaxable?: number;
  devTotalGst?: number;
  devGrandTotal?: number;
  subtotalTaxable: number;
  totalGst: number;
  grandTotal: number;
  advancePayable50: number;
  balancePayable: number;
  amcOption: AmcTier;
  amcAmount: number;
  amcDetails?: AmcPlanDetails;
  status: QuotationStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  emailSent: boolean;
  whatsappSent: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  specialty: string[];
  activeProjectsCount: number;
  avatarColor: string;
}

export interface PaymentRecord {
  id: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  amount: number;
  type: 'Advance (50%)' | 'Milestone 2' | 'Final Balance' | 'AMC Annual';
  paymentMode: 'UPI' | 'NEFT / RTGS' | 'Razorpay' | 'Bank Transfer' | 'Cash';
  transactionReference: string;
  date: string;
  status: 'Completed' | 'Pending Verification' | 'Failed';
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'booking' | 'payment' | 'system' | 'quote' | 'service';
  read: boolean;
  link?: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website: string;
  location: string;
  gstNumber: string;
  panNumber: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    upiId: string;
  };
}

export interface ClientProfile {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  avatarColor?: string;
  joinedDate: string;
  clientTier: 'Prospect' | 'Active Client' | 'Enterprise Partner';
  preferredContactMethod: 'WhatsApp' | 'Email' | 'Phone';
  notes?: string;
}

export interface ClientContactLog {
  id: string;
  date: string;
  channel: 'WhatsApp' | 'Email' | 'Phone Call' | 'Quotation' | 'Meeting / Demo' | 'Portal Note';
  summary: string;
  details?: string;
  initiatedBy: 'Client' | 'TechSoftware.digital';
  status: 'Completed' | 'Pending Response' | 'Follow-up Scheduled';
  relatedQuoteNumber?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  category: 'Contract & SOW' | 'Design & Wireframe' | 'Technical Specs' | 'Invoice & Receipt' | 'Brand Asset';
  size: string;
  uploadDate: string;
  fileUrl?: string;
  externalLink?: string;
  fileType: 'pdf' | 'doc' | 'image' | 'link' | 'zip' | 'other';
  quotationNumber?: string;
  description?: string;
}

export type MilestonePhase =
  | 'Kickoff & Advance'
  | 'Wireframe & Architecture'
  | 'Sprint 1 Development'
  | 'Sprint 2 Core Features'
  | 'QA Testing & Security'
  | 'UAT & Client Demo'
  | 'Production Launch'
  | 'Warranty & AMC';

export type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming' | 'delayed';

export interface ProjectMilestone {
  id: string;
  quotationId: string;
  quotationNumber: string;
  projectName: string;
  phase: MilestonePhase;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  status: MilestoneStatus;
  deliverables: string[];
  assignedLead?: string;
  paymentMilestone?: string;
  progressPercent?: number;
  isCustom?: boolean;
}

