import {
  CompanyInfo,
  StaffMember,
  Quotation,
  PaymentRecord,
  AppNotification,
  ClientProfile,
  ClientContactLog,
  ProjectFile
} from '../types';

export const COMPANY_INFO: CompanyInfo = {
  name: 'TechSoftware.digital',
  tagline: 'Your Idea. Our Technology.',
  email: 'techsoftware.digital@gmail.com',
  phone: '+91 8169401877',
  alternatePhone: '+91 8169401877',
  website: 'https://techsoftware.digital',
  location: 'Mumbai, Maharashtra, India',
  gstNumber: '27AABCT8941K1Z5',
  panNumber: 'AABCT8941K',
  bankDetails: {
    accountName: 'TECHSOFTWARE DIGITAL PRIVATE LIMITED',
    accountNumber: '50200084729103',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank Ltd.',
    branch: 'Mumbai Central Branch',
    upiId: '8169401877@upi'
  }
};

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Aman Sharma',
    role: 'Lead Full-Stack Architect',
    email: 'aman.techsoftware@gmail.com',
    phone: '+91 9820112233',
    specialty: ['React', 'Node.js', 'PostgreSQL', 'Cloud Infrastructure'],
    activeProjectsCount: 3,
    avatarColor: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'staff-2',
    name: 'Priya Mehta',
    role: 'Senior Mobile Engineer (Flutter & Native)',
    email: 'priya.techsoftware@gmail.com',
    phone: '+91 9820114455',
    specialty: ['Flutter', 'Android Native', 'iOS Swift', 'Play Store Publishing'],
    activeProjectsCount: 2,
    avatarColor: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'staff-3',
    name: 'Rahul Varma',
    role: 'UI/UX & Brand Designer',
    email: 'rahul.techsoftware@gmail.com',
    phone: '+91 9820116677',
    specialty: ['Figma', 'Design Systems', 'Micro-interactions', 'Brand Identity'],
    activeProjectsCount: 4,
    avatarColor: 'from-teal-400 to-cyan-600'
  },
  {
    id: 'staff-4',
    name: 'Neha Kapoor',
    role: 'DevOps & Security Specialist',
    email: 'neha.techsoftware@gmail.com',
    phone: '+91 9820118899',
    specialty: ['Docker', 'AWS/Cloud', 'SSL & WAF', 'CI/CD Pipelines'],
    activeProjectsCount: 2,
    avatarColor: 'from-sky-500 to-blue-700'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1001',
    quotationNumber: 'TSD-2026-1001',
    date: '2026-09-18',
    validUntil: '2026-10-02',
    customer: {
      name: 'Vikram Singhania',
      email: 'vikram.singhania@apexretail.in',
      phone: '+91 9819203948',
      companyName: 'Apex Retail Stores Pvt Ltd',
      projectTimeline: '4-6 Weeks',
      projectRequirements: 'Complete E-commerce Website with Billing POS and WhatsApp integration for order updates.',
      address: 'Bandra Kurla Complex, Mumbai, MH'
    },
    items: [
      {
        serviceId: 'web-ecommerce',
        category: 'Website',
        name: 'E-commerce Website',
        description: 'Online store with catalog, products, shopping cart, coupon codes and secure checkout',
        unitPrice: 99999,
        marketMin: 50000,
        marketMax: 150000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 99999,
        gstAmount: 17999.82,
        finalAmount: 117998.82
      },
      {
        serviceId: 'biz-billing-pos',
        category: 'Business Software',
        name: 'Billing / POS',
        description: 'Point of sale, barcode scanning, fast invoice generation, receipts and GST tax summary',
        unitPrice: 99999,
        marketMin: 50000,
        marketMax: 200000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 99999,
        gstAmount: 17999.82,
        finalAmount: 117998.82
      },
      {
        serviceId: 'addon-whatsapp',
        category: 'Add-on',
        name: 'WhatsApp Integration',
        description: 'Instant WhatsApp direct-chat click buttons and lead notification triggers',
        unitPrice: 9999,
        marketMin: 3000,
        marketMax: 25000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 9999,
        gstAmount: 1799.82,
        finalAmount: 11798.82
      }
    ],
    subtotalTaxable: 209997,
    totalGst: 37799.46,
    grandTotal: 247796.46,
    advancePayable50: 123898.23,
    balancePayable: 123898.23,
    amcOption: 'standard',
    amcAmount: 35000,
    status: 'Advance Received',
    paymentStatus: 'Partial',
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Aman Sharma',
    notes: '50% advance confirmed via NEFT. Sprint 1 underway.',
    createdAt: '2026-09-18T10:30:00Z',
    updatedAt: '2026-09-18T14:45:00Z',
    emailSent: true,
    whatsappSent: true
  },
  {
    id: 'quote-1002',
    quotationNumber: 'TSD-2026-1002',
    date: '2026-09-19',
    validUntil: '2026-10-03',
    customer: {
      name: 'Dr. Sameer Deshmukh',
      email: 'dr.deshmukh@lifelineclinic.com',
      phone: '+91 9820556677',
      companyName: 'LifeLine Diagnostics & Clinic',
      projectTimeline: '6-8 Weeks',
      projectRequirements: 'Hospital Management software with doctor scheduling, patient WhatsApp alerts and payment gateway.',
      address: 'Andheri West, Mumbai'
    },
    items: [
      {
        serviceId: 'biz-hospital',
        category: 'Business Software',
        name: 'Hospital Management',
        description: 'OPD/IPD patients, doctor scheduling, prescription records, lab reports and automated billing',
        unitPrice: 349999,
        marketMin: 200000,
        marketMax: 600000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 349999,
        gstAmount: 62999.82,
        finalAmount: 412998.82
      },
      {
        serviceId: 'dev-whatsapp-api',
        category: 'Development Add-on',
        name: 'WhatsApp API',
        description: 'Automated transactional WhatsApp Business Cloud API for booking confirmation and PDF alerts',
        unitPrice: 14999,
        marketMin: 10000,
        marketMax: 25000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 14999,
        gstAmount: 2699.82,
        finalAmount: 17698.82
      },
      {
        serviceId: 'dev-payment-gw',
        category: 'Development Add-on',
        name: 'Payment Gateway',
        description: 'Secure payment gateway integration supporting UPI, NetBanking, Credit/Debit cards',
        unitPrice: 14999,
        marketMin: 10000,
        marketMax: 30000,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount: 14999,
        gstAmount: 2699.82,
        finalAmount: 17698.82
      }
    ],
    subtotalTaxable: 379997,
    totalGst: 68399.46,
    grandTotal: 448396.46,
    advancePayable50: 224198.23,
    balancePayable: 224198.23,
    amcOption: 'standard',
    amcAmount: 45000,
    status: 'Sent',
    paymentStatus: 'Pending',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'Priya Mehta',
    notes: 'Quotation shared with Dr. Deshmukh. Follow-up meeting scheduled.',
    createdAt: '2026-09-19T09:15:00Z',
    updatedAt: '2026-09-19T09:15:00Z',
    emailSent: true,
    whatsappSent: true
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-501',
    quotationId: 'quote-1001',
    quotationNumber: 'TSD-2026-1001',
    customerName: 'Vikram Singhania (Apex Retail)',
    amount: 123898.23,
    type: 'Advance (50%)',
    paymentMode: 'NEFT / RTGS',
    transactionReference: 'HDFC9842104921',
    date: '2026-09-18',
    status: 'Completed',
    notes: '50% non-refundable advance received in HDFC corporate account'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Booking & Advance Received',
    message: 'Apex Retail Stores confirmed quotation TSD-2026-1001. 50% Advance ₹1,23,898.23 verified.',
    timestamp: '2 hours ago',
    type: 'payment',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Quotation Generated',
    message: 'Dr. Sameer Deshmukh generated quotation TSD-2026-1002 for Hospital Management suite.',
    timestamp: '3 hours ago',
    type: 'quote',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Rate Card Updated',
    message: 'AI Chatbot and Cloud Setup services updated with current market benchmarks.',
    timestamp: '1 day ago',
    type: 'service',
    read: true
  }
];

export const INITIAL_CLIENT_PROFILE: ClientProfile = {
  id: 'client-apex-101',
  name: 'Vikram Singhania',
  companyName: 'Apex Retail Solutions Pvt Ltd',
  email: 'vikram.singhania@apexretail.in',
  phone: '+91 9819203948',
  address: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra',
  gstin: '27AAACA9812M1ZG',
  avatarColor: 'from-cyan-500 to-blue-600',
  joinedDate: '2026-08-15',
  clientTier: 'Active Client',
  preferredContactMethod: 'WhatsApp',
  notes: 'Primary contact for Apex omni-channel retail POS and mobile application project.'
};

export const INITIAL_CONTACT_LOGS: ClientContactLog[] = [
  {
    id: 'log-1',
    date: '2026-09-18 16:45',
    channel: 'WhatsApp',
    summary: 'Payment Confirmation & Sprint Kickoff Notice',
    details: 'Client forwarded NEFT transaction reference HDFC9842104921 for 50% non-refundable advance. Lead Architect Aman Sharma initiated sprint setup.',
    initiatedBy: 'TechSoftware.digital',
    status: 'Completed',
    relatedQuoteNumber: 'TSD-2026-1001'
  },
  {
    id: 'log-2',
    date: '2026-09-18 11:30',
    channel: 'Quotation',
    summary: 'Formal Quotation TSD-2026-1001 Generated',
    details: 'Quotation created for E-commerce Website, Business Software POS, Mobile App, and Silver AMC tier with 50% advance terms.',
    initiatedBy: 'Client',
    status: 'Completed',
    relatedQuoteNumber: 'TSD-2026-1001'
  },
  {
    id: 'log-3',
    date: '2026-09-17 14:15',
    channel: 'Meeting / Demo',
    summary: 'Discovery & Architectural Scope Walkthrough',
    details: 'Discussed cloud database architecture, POS offline synchronization, and 6-8 weeks estimated delivery roadmap with client team.',
    initiatedBy: 'TechSoftware.digital',
    status: 'Completed'
  },
  {
    id: 'log-4',
    date: '2026-09-16 10:00',
    channel: 'WhatsApp',
    summary: 'Initial Service & Rate Card Inquiry',
    details: 'Client inquired on WhatsApp about multi-vendor retail mobile app and GST-compliant billing software quotation.',
    initiatedBy: 'Client',
    status: 'Completed'
  }
];

export const INITIAL_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    name: 'TSD-2026-1001_Formal_Quotation_Signed.pdf',
    category: 'Contract & SOW',
    size: '1.4 MB',
    uploadDate: '2026-09-18',
    fileType: 'pdf',
    quotationNumber: 'TSD-2026-1001',
    description: 'Formal digital quotation & commercial estimate with 50% advance agreement and AMC terms.'
  },
  {
    id: 'file-2',
    name: 'Apex_Retail_POS_and_Mobile_App_Architecture_v1.0.pdf',
    category: 'Technical Specs',
    size: '3.8 MB',
    uploadDate: '2026-09-18',
    fileType: 'pdf',
    quotationNumber: 'TSD-2026-1001',
    description: 'System architectural blueprint covering database ERD, API endpoints, and payment gateway flow.'
  },
  {
    id: 'file-3',
    name: 'Figma_UIUX_Design_System_and_Wireframes',
    category: 'Design & Wireframe',
    size: 'External Link',
    uploadDate: '2026-09-17',
    externalLink: 'https://figma.com/@techsoftware/apex-retail-design',
    fileType: 'link',
    description: 'Interactive high-fidelity Figma prototypes for mobile and desktop screens.'
  },
  {
    id: 'file-4',
    name: 'Client_Brand_Assets_Logos_and_Typography.zip',
    category: 'Brand Asset',
    size: '12.6 MB',
    uploadDate: '2026-09-16',
    fileType: 'zip',
    description: 'Vector SVG logos, color palette codes, and brand imagery provided by client.'
  },
  {
    id: 'file-5',
    name: 'Advance_Payment_Receipt_HDFC_NEFT.pdf',
    category: 'Invoice & Receipt',
    size: '420 KB',
    uploadDate: '2026-09-18',
    fileType: 'pdf',
    quotationNumber: 'TSD-2026-1001',
    description: 'Official verified receipt for 50% non-refundable advance payment (₹1,23,898.23).'
  }
];

