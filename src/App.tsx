import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileCheck,
  ShieldAlert,
  Phone,
  Mail,
  ArrowRight,
  Layers,
  MessageCircle,
  User,
  FolderArchive
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { ServiceSelector } from './components/customer/ServiceSelector';
import { QuotationBuilder } from './components/customer/QuotationBuilder';
import { QuotationViewModal } from './components/customer/QuotationViewModal';
import { BookingSuccessModal } from './components/customer/BookingSuccessModal';
import { FaqAndTerms } from './components/customer/FaqAndTerms';
import { ClientProfileSection } from './components/customer/ClientProfileSection';
import { DeveloperPortal } from './components/admin/DeveloperPortal';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerRequestQuotationView } from './components/customer/CustomerRequestQuotationView';
import { MyQuotationsView } from './components/customer/MyQuotationsView';
import { CustomerProjectsView } from './components/customer/CustomerProjectsView';
import { CustomerMessagesView } from './components/customer/CustomerMessagesView';
import { CustomerDashboardView } from './components/customer/CustomerDashboardView';

import { INITIAL_SERVICES } from './data/initialServices';
import {
  COMPANY_INFO,
  INITIAL_STAFF,
  INITIAL_QUOTATIONS,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLIENT_PROFILE,
  INITIAL_CONTACT_LOGS,
  INITIAL_PROJECT_FILES,
  INITIAL_QUOTATION_REQUESTS,
  INITIAL_PROJECTS,
  INITIAL_MESSAGES
} from './data/initialData';

import {
  ServiceItem,
  QuotationSelectedService,
  Quotation,
  CustomerDetails,
  StaffMember,
  PaymentRecord,
  AppNotification,
  AmcTier,
  AmcPlanDetails,
  ClientProfile,
  ClientContactLog,
  ProjectFile,
  ProjectMilestone,
  MilestoneStatus,
  PaymentStatus,
  UserAccount,
  QuotationRequest,
  Project,
  ChatMessage,
  CompanyInfo
} from './types';

import { showBrowserNotification, requestPushPermission } from './utils/notifications';
import { deriveMilestonesFromQuotations } from './utils/milestoneGenerator';
import {
  subscribeToQuotations,
  saveQuotationToFirestore,
  subscribeToPayments,
  savePaymentToFirestore,
  subscribeToClientProfile,
  saveClientProfileToFirestore,
  subscribeToMilestones,
  saveMilestoneToFirestore,
  testFirestoreConnection,
  subscribeToQuotationRequests,
  saveQuotationRequestToFirestore,
  subscribeToProjects,
  saveProjectToFirestore,
  subscribeToMessages,
  saveMessageToFirestore,
  subscribeToCompanySettings,
  saveCompanySettingsToFirestore,
  subscribeToServices,
  saveServiceToFirestore,
  subscribeToClientProfiles,
  saveUserToFirestore
} from './services/firestoreSync';

export default function App() {
  // Portal mode and customer tab navigation
  const [currentPortal, setCurrentPortal] = useState<'customer' | 'admin'>('customer');
  const [customerTab, setCustomerTab] = useState<
    'dashboard' | 'services' | 'rateCard' | 'requestQuote' | 'myQuotes' | 'projects' | 'messages' | 'profile' | 'builder'
  >('dashboard');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('tsd_current_user');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'user-demo-client',
          email: 'vikram.singhania@apexretail.in',
          displayName: 'Vikram Singhania',
          companyName: 'Apex Retail Stores Pvt Ltd',
          phone: '+91 9819203948',
          role: 'customer' as const,
          createdAt: new Date().toISOString()
        };
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Core Data States with localStorage persistence
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('tsd_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('tsd_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('tsd_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('tsd_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('tsd_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Client Profile, Contact History & Project Files
  const [clientProfile, setClientProfile] = useState<ClientProfile>(() => {
    const saved = localStorage.getItem('tsd_client_profile');
    return saved ? JSON.parse(saved) : INITIAL_CLIENT_PROFILE;
  });

  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([INITIAL_CLIENT_PROFILE]);

  const [contactLogs, setContactLogs] = useState<ClientContactLog[]>(() => {
    const saved = localStorage.getItem('tsd_contact_logs');
    return saved ? JSON.parse(saved) : INITIAL_CONTACT_LOGS;
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    const saved = localStorage.getItem('tsd_project_files');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_FILES;
  });

  const [customMilestones, setCustomMilestones] = useState<ProjectMilestone[]>(() => {
    const saved = localStorage.getItem('tsd_custom_milestones');
    return saved ? JSON.parse(saved) : [];
  });

  // Quotation Requests State (Customer submitted -> Admin receives)
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>(() => {
    const saved = localStorage.getItem('tsd_quotation_requests');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATION_REQUESTS;
  });

  // Projects State (Active delivery)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('tsd_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  // Chat Messages State (Live customer - developer communication)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('tsd_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  // Company Information & Settings
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('tsd_company_info');
    return saved ? JSON.parse(saved) : COMPANY_INFO;
  });

  // Current Quotation basket
  const [selectedServices, setSelectedServices] = useState<QuotationSelectedService[]>([]);

  // Modals state
  const [activeQuotationForModal, setActiveQuotationForModal] = useState<Quotation | null>(null);
  const [recentlyBookedQuotation, setRecentlyBookedQuotation] = useState<Quotation | null>(null);

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tsd_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tsd_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('tsd_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('tsd_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('tsd_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('tsd_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('tsd_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tsd_client_profile', JSON.stringify(clientProfile));
  }, [clientProfile]);

  useEffect(() => {
    localStorage.setItem('tsd_contact_logs', JSON.stringify(contactLogs));
  }, [contactLogs]);

  useEffect(() => {
    localStorage.setItem('tsd_project_files', JSON.stringify(projectFiles));
  }, [projectFiles]);

  useEffect(() => {
    localStorage.setItem('tsd_custom_milestones', JSON.stringify(customMilestones));
  }, [customMilestones]);

  useEffect(() => {
    localStorage.setItem('tsd_quotation_requests', JSON.stringify(quotationRequests));
  }, [quotationRequests]);

  useEffect(() => {
    localStorage.setItem('tsd_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('tsd_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('tsd_company_info', JSON.stringify(companyInfo));
  }, [companyInfo]);

  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  // Firestore initialization & real-time bidirectional synchronization
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setFirebaseConnected(connected);
    });

    const unsubQuotations = subscribeToQuotations((cloudQuotes) => {
      if (cloudQuotes && cloudQuotes.length > 0) {
        setQuotations((prev) => {
          const merged = [...prev];
          for (const cq of cloudQuotes) {
            const idx = merged.findIndex((q) => q.id === cq.id);
            if (idx >= 0) {
              merged[idx] = cq;
            } else {
              merged.unshift(cq);
            }
          }
          return merged;
        });
      }
    });

    const unsubPayments = subscribeToPayments((cloudPayments) => {
      if (cloudPayments && cloudPayments.length > 0) {
        setPayments((prev) => {
          const merged = [...prev];
          for (const cp of cloudPayments) {
            const idx = merged.findIndex((p) => p.id === cp.id);
            if (idx >= 0) {
              merged[idx] = cp;
            } else {
              merged.unshift(cp);
            }
          }
          return merged;
        });
      }
    });

    const unsubProfile = subscribeToClientProfile(clientProfile.id, (cloudProfile) => {
      if (cloudProfile) {
        setClientProfile((prev) => ({ ...prev, ...cloudProfile }));
      }
    });

    const unsubMilestones = subscribeToMilestones((cloudMilestones) => {
      if (cloudMilestones && cloudMilestones.length > 0) {
        setCustomMilestones((prev) => {
          const merged = [...prev];
          for (const cm of cloudMilestones) {
            const idx = merged.findIndex((m) => m.id === cm.id);
            if (idx >= 0) {
              merged[idx] = cm;
            } else {
              merged.unshift(cm);
            }
          }
          return merged;
        });
      }
    });

    const unsubRequests = subscribeToQuotationRequests((cloudRequests) => {
      if (cloudRequests && cloudRequests.length > 0) {
        setQuotationRequests(cloudRequests);
      }
    });

    const unsubProjects = subscribeToProjects((cloudProjects) => {
      if (cloudProjects && cloudProjects.length > 0) {
        setProjects(cloudProjects);
      }
    });

    const unsubMessages = subscribeToMessages((cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        setMessages(cloudMsgs);
      }
    });

    const unsubSettings = subscribeToCompanySettings((cloudSettings) => {
      if (cloudSettings) {
        setCompanyInfo((prev: CompanyInfo) => ({ ...prev, ...cloudSettings }));
      }
    });

    const unsubServices = subscribeToServices((cloudServices) => {
      if (cloudServices && cloudServices.length > 0) {
        setServices(cloudServices);
      }
    });

    const unsubProfiles = subscribeToClientProfiles((cloudProfiles) => {
      if (cloudProfiles && cloudProfiles.length > 0) {
        setClientProfiles(cloudProfiles);
      }
    });

    return () => {
      unsubQuotations();
      unsubPayments();
      unsubProfile();
      unsubMilestones();
      unsubRequests();
      unsubProjects();
      unsubMessages();
      unsubSettings();
      unsubServices();
      unsubProfiles();
    };
  }, [clientProfile.id]);

  // Request browser push permission
  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    setPushEnabled(granted);
    if (granted) {
      handlePushNotification(
        'Push Notifications Active',
        'You will receive instant alerts for quotes, bookings, and rate updates.',
        'system'
      );
    }
  };

  // Push Notification Dispatcher
  const handlePushNotification = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'system'
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showBrowserNotification(title, message);
  };

  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Quotation Request Submission from Customer
  const handleSubmitQuotationRequest = async (
    requestData: Omit<QuotationRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    const newReq: QuotationRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setQuotationRequests((prev) => [newReq, ...prev]);
    try {
      await saveQuotationRequestToFirestore(newReq);
    } catch (err) {
      console.error('Failed to save quotation request to Firestore:', err);
    }
    handlePushNotification(
      'Quotation Request Submitted',
      `Your request for "${newReq.service}" was sent to our developers. We will prepare your official quote shortly.`,
      'quote'
    );
    setCustomerTab('dashboard');
  };

  // Customer Accepts Quotation
  const handleAcceptQuotation = async (quotationId: string) => {
    const target = quotations.find((q) => q.id === quotationId);
    if (!target) return;

    const updated: Quotation = {
      ...target,
      status: 'Customer Accepted',
      updatedAt: new Date().toISOString()
    };

    setQuotations((prev) => prev.map((q) => (q.id === quotationId ? updated : q)));
    try {
      await saveQuotationToFirestore(updated);
    } catch (err) {
      console.error('Failed to sync accepted quote to Firestore:', err);
    }

    // Auto-create / link project in Firestore
    const existingProject = projects.find((p) => p.quotationId === quotationId);
    if (!existingProject) {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        quotationId: target.id,
        customerId: target.customer.email,
        customerName: target.customer.name,
        customerEmail: target.customer.email,
        title: target.customer.companyName
          ? `${target.customer.companyName} System Build`
          : `${target.customer.name} Software Project`,
        description: target.items.map((i) => i.name).join(', '),
        status: 'Planning',
        startDate: new Date().toISOString().split('T')[0],
        expectedCompletionDate: target.validUntil,
        amount: target.grandTotal,
        progressPercent: 10,
        notes: 'Quotation accepted by client. Awaiting 50% advance to initiate Sprint 1.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProjects((prev) => [newProj, ...prev]);
      try {
        await saveProjectToFirestore(newProj);
      } catch (err) {
        console.error('Failed to save auto-project to Firestore:', err);
      }
    }

    handlePushNotification(
      'Quotation Accepted! 🎉',
      `Quotation ${target.quotationNumber} accepted. 50% Advance (₹${target.advancePayable50.toLocaleString('en-IN')}) is now due to kickoff development.`,
      'payment'
    );
  };

  // Customer Rejects Quotation
  const handleRejectQuotation = async (quotationId: string, reason?: string) => {
    const target = quotations.find((q) => q.id === quotationId);
    if (!target) return;

    const updated: Quotation = {
      ...target,
      status: 'Customer Rejected',
      notes: reason ? `${target.notes || ''} | Rejection feedback: ${reason}` : target.notes,
      updatedAt: new Date().toISOString()
    };

    setQuotations((prev) => prev.map((q) => (q.id === quotationId ? updated : q)));
    try {
      await saveQuotationToFirestore(updated);
    } catch (err) {
      console.error('Failed to sync rejected quotation to Firestore:', err);
    }

    handlePushNotification(
      'Quotation Response Recorded',
      `Feedback saved for quote ${target.quotationNumber}. Our team will contact you to revise the scope.`,
      'quote'
    );
  };

  // Chat message send (Customer or Admin)
  const handleSendChatMessage = async (
    senderRole: 'customer' | 'admin',
    text: string,
    recipientEmail?: string
  ) => {
    const customerEmail = recipientEmail || currentUser?.email || clientProfile.email;
    const customerName = currentUser?.displayName || clientProfile.name;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      customerId: customerEmail,
      customerName,
      customerEmail,
      senderId: senderRole === 'admin' ? 'admin' : (currentUser?.uid || 'customer'),
      senderName: senderRole === 'admin' ? 'TechSoftware Architect' : customerName,
      senderRole,
      text,
      read: false,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    try {
      await saveMessageToFirestore(newMsg);
    } catch (err) {
      console.error('Failed to save chat message to Firestore:', err);
    }
  };

  // Create Project (from Admin)
  const handleCreateProject = async (newProjData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProj: Project = {
      ...newProjData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects((prev) => [newProj, ...prev]);
    try {
      await saveProjectToFirestore(newProj);
    } catch (err) {
      console.error('Failed to save project to Firestore:', err);
    }
  };

  // Update Project (from Admin)
  const handleUpdateProject = async (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    try {
      await saveProjectToFirestore(updatedProject);
    } catch (err) {
      console.error('Failed to update project in Firestore:', err);
    }
  };

  // Convert Quotation Request to Quotation (from Admin)
  const handleConvertRequestToQuotation = (request: QuotationRequest) => {
    setClientProfile((prev) => ({
      ...prev,
      name: request.customerName,
      email: request.customerEmail,
      phone: request.customerPhone,
      companyName: request.companyName || prev.companyName
    }));

    // Auto-select matching service if exists
    const matching = services.find(
      (s) =>
        s.name.toLowerCase().includes(request.service.toLowerCase()) ||
        request.service.toLowerCase().includes(s.name.toLowerCase())
    );
    if (matching) {
      handleToggleService(matching);
    }

    setCustomerTab('builder');
    setCurrentPortal('customer');
  };

  // Save Company Settings from Admin
  const handleSaveCompanySettings = async (updatedSettings: CompanyInfo) => {
    setCompanyInfo(updatedSettings);
    try {
      await saveCompanySettingsToFirestore(updatedSettings);
    } catch (err) {
      console.error('Failed to save company settings to Firestore:', err);
    }
    handlePushNotification('Company Profile Updated', 'Invoice letterhead & bank details updated in Firestore.', 'system');
  };

  // User Authentication Handlers
  const handleLogin = (account: UserAccount) => {
    setCurrentUser(account);
    if (account.role === 'admin') {
      setCurrentPortal('admin');
    } else {
      setCurrentPortal('customer');
    }
    handlePushNotification('Welcome Back!', `Signed in as ${account.displayName || account.email}`, 'system');
  };

  const handleRegister = async (account: UserAccount) => {
    setCurrentUser(account);
    try {
      await saveUserToFirestore(account);
    } catch (err) {
      console.error('Failed to register user in Firestore:', err);
    }
    handlePushNotification('Registration Complete', `Welcome to TechSoftware.digital, ${account.displayName}!`, 'system');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPortal('customer');
    setCustomerTab('dashboard');
    handlePushNotification('Signed Out', 'You have been safely signed out.', 'system');
  };

  // Service Basket Handlers
  const handleToggleService = (service: ServiceItem) => {
    const existing = selectedServices.find((i) => i.serviceId === service.id);
    if (existing) {
      setSelectedServices((prev) => prev.filter((i) => i.serviceId !== service.id));
      return;
    }

    const qty = 1;
    const discount = service.discountPercent || 0;
    const taxableAmount = service.suggestedQuote * qty * (1 - discount / 100);
    const gstAmount = taxableAmount * ((service.gstPercent || 18) / 100);
    const finalAmount = taxableAmount + gstAmount;

    const newItem: QuotationSelectedService = {
      serviceId: service.id,
      category: service.category,
      name: service.name,
      description: service.description,
      unitPrice: service.suggestedQuote,
      marketMin: service.marketMin,
      marketMax: service.marketMax,
      qty,
      discountPercent: discount,
      gstPercent: service.gstPercent || 18,
      taxableAmount,
      gstAmount,
      finalAmount
    };

    setSelectedServices((prev) => [...prev, newItem]);
  };

  const handleQuickBook = (service: ServiceItem) => {
    const exists = selectedServices.some((s) => s.serviceId === service.id);
    if (!exists) {
      const qty = 1;
      const discount = service.discountPercent || 0;
      const taxableAmount = service.suggestedQuote * qty * (1 - discount / 100);
      const gstAmount = taxableAmount * ((service.gstPercent || 18) / 100);
      const finalAmount = taxableAmount + gstAmount;

      const newItem: QuotationSelectedService = {
        serviceId: service.id,
        category: service.category,
        name: service.name,
        description: service.description,
        unitPrice: service.suggestedQuote,
        marketMin: service.marketMin,
        marketMax: service.marketMax,
        qty,
        discountPercent: discount,
        gstPercent: service.gstPercent || 18,
        taxableAmount,
        gstAmount,
        finalAmount
      };

      setSelectedServices((prev) => [...prev, newItem]);
    }

    // Immediately switch view to Quotation Builder
    setCustomerTab('builder');

    // Scroll to the top of the builder view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((i) => i.serviceId !== serviceId));
  };

  const handleUpdateQty = (serviceId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveService(serviceId);
      return;
    }
    setSelectedServices((prev) =>
      prev.map((item) => {
        if (item.serviceId !== serviceId) return item;
        const taxableAmount = item.unitPrice * qty * (1 - item.discountPercent / 100);
        const gstAmount = taxableAmount * (item.gstPercent / 100);
        const finalAmount = taxableAmount + gstAmount;
        return {
          ...item,
          qty,
          taxableAmount,
          gstAmount,
          finalAmount
        };
      })
    );
  };

  const handleUpdateQuantityDelta = (serviceId: string, delta: number) => {
    const item = selectedServices.find((i) => i.serviceId === serviceId);
    if (!item) return;
    handleUpdateQty(serviceId, item.qty + delta);
  };

  const handleUpdateDiscount = (serviceId: string, discount: number) => {
    setSelectedServices((prev) =>
      prev.map((item) => {
        if (item.serviceId !== serviceId) return item;
        const validDiscount = Math.max(0, Math.min(100, discount));
        const taxableAmount = item.unitPrice * item.qty * (1 - validDiscount / 100);
        const gstAmount = taxableAmount * (item.gstPercent / 100);
        const finalAmount = taxableAmount + gstAmount;
        return {
          ...item,
          discountPercent: validDiscount,
          taxableAmount,
          gstAmount,
          finalAmount
        };
      })
    );
  };

  const handleApplyPackagePreset = (serviceIds: string[]) => {
    const presetItems = services.filter((s) => serviceIds.includes(s.id));
    const formatted: QuotationSelectedService[] = presetItems.map((service) => {
      const taxableAmount = service.suggestedQuote;
      const gstAmount = taxableAmount * 0.18;
      const finalAmount = taxableAmount + gstAmount;
      return {
        serviceId: service.id,
        category: service.category,
        name: service.name,
        description: service.description,
        unitPrice: service.suggestedQuote,
        marketMin: service.marketMin,
        marketMax: service.marketMax,
        qty: 1,
        discountPercent: 0,
        gstPercent: 18,
        taxableAmount,
        gstAmount,
        finalAmount
      };
    });
    setSelectedServices(formatted);
    setCustomerTab('builder');
  };

  // Generate Formal Quotation and Trigger Automated Invoicing
  const handleGenerateQuotation = (
    customer: CustomerDetails,
    amcOption: AmcTier,
    amcAmount: number,
    amcDetails?: AmcPlanDetails,
    calculatedGrandTotal?: number,
    calculatedAdvance50?: number
  ) => {
    const devSubtotalTaxable = selectedServices.reduce((sum, i) => sum + i.taxableAmount, 0);
    const devTotalGst = selectedServices.reduce((sum, i) => sum + i.gstAmount, 0);
    const devGrandTotal = devSubtotalTaxable + devTotalGst;

    const isAmcAppended = Boolean(amcDetails && amcDetails.isAppendedToTotal && amcDetails.totalAmount > 0);
    const amcTaxable = isAmcAppended ? (amcDetails?.annualFee || 0) : 0;
    const amcGst = isAmcAppended ? (amcDetails?.gstAmount || 0) : 0;
    const amcTotal = isAmcAppended ? (amcDetails?.totalAmount || 0) : 0;

    const subtotalTaxable = devSubtotalTaxable + amcTaxable;
    const totalGst = devTotalGst + amcGst;
    const grandTotal = calculatedGrandTotal ?? (devGrandTotal + amcTotal);
    const advancePayable50 = calculatedAdvance50 ?? (grandTotal / 2);
    const balancePayable = grandTotal - advancePayable50;

    const today = new Date();
    const validDate = new Date();
    validDate.setDate(today.getDate() + 14);

    const quoteNum = `TSD-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newQuotation: Quotation = {
      id: `quote-${Date.now()}`,
      quotationNumber: quoteNum,
      date: today.toISOString().split('T')[0],
      validUntil: validDate.toISOString().split('T')[0],
      customer,
      items: [...selectedServices],
      devSubtotalTaxable,
      devTotalGst,
      devGrandTotal,
      subtotalTaxable,
      totalGst,
      grandTotal,
      advancePayable50,
      balancePayable,
      amcOption,
      amcAmount: amcDetails?.annualFee ?? amcAmount,
      amcDetails,
      status: 'Booked',
      paymentStatus: 'Pending',
      notes: `50% Advance ₹${advancePayable50.toLocaleString('en-IN')} due to kickoff. Strictly non-refundable. AMC Plan: ${amcDetails?.tierName || amcOption}.`,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
      emailSent: true,
      whatsappSent: true
    };

    setQuotations((prev) => [newQuotation, ...prev]);
    setRecentlyBookedQuotation(newQuotation);
    saveQuotationToFirestore(newQuotation).catch((err) => {
      console.error('Failed to sync quotation to Firestore:', err);
    });

    // Auto-record interaction in Client Profile Contact History
    const quoteContactLog: ClientContactLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      channel: 'Quotation',
      summary: `Formal Quotation ${quoteNum} Generated`,
      details: `Generated quote for ${customer.name} (${customer.companyName || 'Personal Project'}). Modules: ${selectedServices.length}. Total: ₹${grandTotal.toLocaleString('en-IN')}, 50% Advance: ₹${advancePayable50.toLocaleString('en-IN')}. Timeline: ${customer.projectTimeline}.`,
      initiatedBy: 'Client',
      status: 'Completed',
      relatedQuoteNumber: quoteNum
    };
    setContactLogs((prev) => [quoteContactLog, ...prev]);

    // Auto-archive digital quotation in Client Profile Project Files Vault
    const quoteProjectFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: `${quoteNum}_Formal_Digital_Quotation.pdf`,
      category: 'Contract & SOW',
      size: '1.4 MB',
      uploadDate: today.toISOString().split('T')[0],
      fileType: 'pdf',
      quotationNumber: quoteNum,
      description: `Formal digital quotation with 50% non-refundable advance and ${amcDetails?.tierName || amcOption} AMC plan.`
    };
    setProjectFiles((prev) => [quoteProjectFile, ...prev]);

    // Push Notification trigger
    handlePushNotification(
      'New Project Quotation Generated',
      `Quote #${quoteNum} for ${customer.name} generated. Total: ₹${grandTotal.toLocaleString('en-IN')} (50% Advance: ₹${advancePayable50.toLocaleString('en-IN')}).`,
      'quote'
    );
  };

  // Quick WhatsApp Trigger from Builder
  const handleQuickWhatsApp = (
    customer: CustomerDetails,
    amcDetails?: AmcPlanDetails,
    calculatedGrandTotal?: number,
    calculatedAdvance50?: number
  ) => {
    const devSubtotalTaxable = selectedServices.reduce((sum, i) => sum + i.taxableAmount, 0);
    const devTotalGst = selectedServices.reduce((sum, i) => sum + i.gstAmount, 0);
    const devGrandTotal = devSubtotalTaxable + devTotalGst;

    const isAmcAppended = Boolean(amcDetails && amcDetails.isAppendedToTotal && amcDetails.totalAmount > 0);
    const grandTotal = calculatedGrandTotal ?? (devGrandTotal + (isAmcAppended ? (amcDetails?.totalAmount || 0) : 0));
    const advance50 = calculatedAdvance50 ?? (grandTotal / 2);

    const summaryItems = selectedServices
      .map((i) => `• ${i.name} (x${i.qty}) = ₹${i.finalAmount.toLocaleString('en-IN')}`)
      .join('%0A');

    const amcSummary = amcDetails && amcDetails.tier !== 'none'
      ? `%0A*AMC Plan:* ${amcDetails.tierName} (₹${amcDetails.totalAmount.toLocaleString('en-IN')}/yr inc. GST - ${amcDetails.isAppendedToTotal ? 'Appended to total' : 'Billed separately'})`
      : '%0A*AMC:* Self-Managed (Standard 30-day warranty)';

    const msg = `*TECHSOFTWARE DIGITAL - INSTANT ESTIMATE*%0A%0A*Client:* ${customer.name}%0A*Phone:* ${customer.phone}%0A*Email:* ${customer.email}%0A%0A*Selected Services:*%0A${summaryItems}${amcSummary}%0A%0A*Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}%0A*50% Advance Payable:* ₹${advance50.toLocaleString('en-IN')}%0A%0A*Terms:* 50% Advance Non-refundable.%0A%0APlease connect with developer team.`;

    window.open(`https://wa.me/918169401877?text=${msg}`, '_blank');
  };

  // Total summary in basket
  const totalBasketAmount = selectedServices.reduce((sum, i) => sum + i.finalAmount, 0);
  const totalBasketAdvance = totalBasketAmount / 2;
  const totalTaxable = selectedServices.reduce((sum, i) => sum + i.taxableAmount, 0);

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all duration-300 ${
        isMobileDeviceView ? 'py-4 sm:py-8 bg-slate-900/90' : ''
      }`}
    >
      {/* Optional Android Phone Frame Container when isMobileDeviceView is true */}
      <div
        className={
          isMobileDeviceView
            ? 'w-full max-w-[420px] mx-auto min-h-[840px] bg-slate-950 rounded-[44px] border-[8px] border-slate-800 shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col relative ring-1 ring-cyan-500/30'
            : 'w-full flex-1 flex flex-col'
        }
      >
        {/* Android top speaker & camera punch hole if in mobile simulator mode */}
        {isMobileDeviceView && (
          <div className="no-print w-full bg-slate-950 pt-2 pb-1 flex justify-center items-center gap-2 select-none shrink-0 border-b border-slate-900">
            <div className="w-12 h-1 bg-slate-800 rounded-full" />
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
            <span className="text-[10px] text-cyan-400 font-mono tracking-tighter">
              Android Preview (360x800)
            </span>
          </div>
        )}

        {/* Global Navigation Bar */}
        <Navbar
          currentPortal={currentPortal}
          onPortalChange={(portal) => {
            if (portal === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
              setAuthModalMode('login');
              setShowAuthModal(true);
            } else {
              setCurrentPortal(portal);
            }
          }}
          selectedItemsCount={selectedServices.length}
          totalTaxable={totalTaxable}
          notifications={notifications}
          onClearNotification={handleClearNotification}
          onRequestPush={handleRequestPush}
          pushEnabled={pushEnabled}
          companyInfo={companyInfo}
          isMobileDeviceView={isMobileDeviceView}
          onToggleMobileDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
          onOpenQuotationDrawer={() => setCustomerTab('builder')}
          onNavigateToProfile={() => {
            setCurrentPortal('customer');
            setCustomerTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          clientName={currentUser?.displayName || clientProfile.name}
          firebaseConnected={firebaseConnected}
          currentUser={currentUser}
          onOpenAuthModal={() => {
            setAuthModalMode('login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
          {/* CUSTOMER PORTAL */}
          {currentPortal === 'customer' && (
            <div className="space-y-6">
              {/* Promotional & Commercial Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 p-5 sm:p-7 shadow-2xl">
                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/40 text-cyan-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Official Development Rate Card & Instant Estimator</span>
                    </div>

                    <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                      Transform Your Vision Into High-Impact Software
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Select tailored websites, mobile apps, ERPs, SaaS suites or AI modules. Get transparent market ranges, instant 18% GST calculation, and an automated formal quotation.
                    </p>

                    {/* Crucial Commercial Terms Pill */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-600/40 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>50% Advance Required to Kickoff</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                        ⚡ Non-Refundable Policy
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                        🛠️ AMC Billed Separately
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        ✉️ Automated Email & WhatsApp Invoices
                      </span>
                    </div>
                  </div>

                  {/* Right Contact Quick-Card */}
                  <div className="shrink-0 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Technical Sales Desk
                    </p>
                    <a
                      href="tel:8169401877"
                      className="text-base font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      <span>+91 8169401877</span>
                    </a>
                    <a
                      href={`https://wa.me/918169401877?text=${encodeURIComponent(
                        'Hi TechSoftware.digital team, I want to discuss a new software project.'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Customer Portal Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  <button
                    id="tab-dashboard-btn"
                    onClick={() => setCustomerTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerTab === 'dashboard'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    id="tab-services-btn"
                    onClick={() => setCustomerTab('services')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerTab === 'services'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>💼 Services</span>
                  </button>

                  <button
                    id="tab-rate-card-btn"
                    onClick={() => setCustomerTab('rateCard')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerTab === 'rateCard'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>📊 Rate Card</span>
                  </button>

                  <button
                    id="tab-request-quote-btn"
                    onClick={() => setCustomerTab('requestQuote')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerTab === 'requestQuote'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>📝 Request Quote</span>
                  </button>

                  <button
                    id="tab-my-quotes-btn"
                    onClick={() => setCustomerTab('myQuotes')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerTab === 'myQuotes'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>📑 My Quotes</span>
                    {quotations.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-cyan-900 text-cyan-300 text-[10px] font-black flex items-center justify-center border border-cyan-700">
                        {quotations.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="tab-projects-btn"
                    onClick={() => setCustomerTab('projects')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerTab === 'projects'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🚀 Live Projects</span>
                    {projects.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-black flex items-center justify-center border border-emerald-700">
                        {projects.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="tab-messages-btn"
                    onClick={() => setCustomerTab('messages')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerTab === 'messages'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>💬 Support Chat</span>
                    {messages.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-900 text-indigo-300 text-[10px] font-black flex items-center justify-center border border-indigo-700">
                        {messages.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="tab-profile-btn"
                    onClick={() => setCustomerTab('profile')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerTab === 'profile'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile & Docs</span>
                  </button>

                  <button
                    id="tab-builder-btn"
                    onClick={() => setCustomerTab('builder')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerTab === 'builder'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Quotation Builder</span>
                    {selectedServices.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {selectedServices.length}
                      </span>
                    )}
                  </button>
                </div>

                {selectedServices.length > 0 && customerTab !== 'builder' && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Basket:</span>
                    <span className="font-extrabold text-cyan-400">
                      ₹{totalBasketAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    <button
                      onClick={() => setCustomerTab('builder')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: Customer Executive Dashboard */}
              {customerTab === 'dashboard' && (
                <CustomerDashboardView
                  currentUser={currentUser}
                  quotations={quotations}
                  quotationRequests={quotationRequests}
                  projects={projects}
                  messages={messages}
                  companyInfo={companyInfo}
                  onNavigateTab={(tab) => setCustomerTab(tab)}
                  onViewQuotationModal={(q: Quotation) => setActiveQuotationForModal(q)}
                />
              )}

              {/* TAB 2: Services Catalog */}
              {customerTab === 'services' && (
                <ServiceSelector
                  services={services}
                  selectedServices={selectedServices}
                  onToggleService={handleToggleService}
                  onUpdateQuantity={handleUpdateQuantityDelta}
                  onApplyPackagePreset={handleApplyPackagePreset}
                  onQuickBook={handleQuickBook}
                />
              )}

              {/* TAB 3: Transparent Rate Card Table */}
              {customerTab === 'rateCard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Transparent Standard Development Rate Card</h2>
                      <p className="text-xs text-slate-400">
                        Compare standard Mumbai tech developer rates vs market averages with full 18% GST breakdown.
                      </p>
                    </div>
                    <button
                      onClick={() => setCustomerTab('requestQuote')}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl hover:brightness-110 shadow"
                    >
                      Request Custom Quote
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Service Module</th>
                          <th className="p-3.5">Market Range</th>
                          <th className="p-3.5">TSD Rate (Base)</th>
                          <th className="p-3.5">GST (18%)</th>
                          <th className="p-3.5">Total (Inc. GST)</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {services.map((s) => {
                          const isSelected = selectedServices.some((i) => i.serviceId === s.id);
                          const gst = s.suggestedQuote * 0.18;
                          const total = s.suggestedQuote + gst;
                          return (
                            <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-cyan-400 font-bold uppercase">
                                  {s.category}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <p className="font-bold text-white">{s.name}</p>
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">{s.description}</p>
                              </td>
                              <td className="p-3.5 font-mono text-slate-400">
                                ₹{s.marketMin.toLocaleString('en-IN')} – ₹{s.marketMax.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 font-bold font-mono text-white">
                                ₹{s.suggestedQuote.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 font-mono text-slate-400">
                                ₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="p-3.5 font-extrabold font-mono text-cyan-400">
                                ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleToggleService(s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm'
                                  }`}
                                >
                                  {isSelected ? 'Remove' : '+ Add to Quote'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Request Quotation View */}
              {customerTab === 'requestQuote' && (
                <CustomerRequestQuotationView
                  currentUser={currentUser}
                  services={services}
                  onSubmitRequest={handleSubmitQuotationRequest}
                  onNavigateToMyQuotations={() => setCustomerTab('myQuotes')}
                />
              )}

              {/* TAB 5: My Quotations View */}
              {customerTab === 'myQuotes' && (
                <MyQuotationsView
                  currentUser={currentUser}
                  quotations={quotations}
                  quotationRequests={quotationRequests}
                  onAcceptQuotation={handleAcceptQuotation}
                  onRejectQuotation={handleRejectQuotation}
                  onViewQuotationModal={(q: Quotation) => setActiveQuotationForModal(q)}
                  onNavigateToRequest={() => setCustomerTab('requestQuote')}
                />
              )}

              {/* TAB 6: Active Customer Projects */}
              {customerTab === 'projects' && (
                <CustomerProjectsView
                  currentUser={currentUser}
                  projects={projects}
                  milestones={deriveMilestonesFromQuotations(quotations, customMilestones)}
                  onNavigateToMessages={() => setCustomerTab('messages')}
                />
              )}

              {/* TAB 7: Live Helpdesk & Messages */}
              {customerTab === 'messages' && (
                <CustomerMessagesView
                  messages={messages}
                  currentUser={currentUser}
                  onSendMessage={(text) => handleSendChatMessage('customer', text)}
                />
              )}

              {/* TAB 8: Client Profile, Contact History & Project Files */}
              {customerTab === 'profile' && (
                <ClientProfileSection
                  clientProfile={clientProfile}
                  onUpdateProfile={(updated) => {
                    setClientProfile(updated);
                    saveClientProfileToFirestore(updated).catch((err) =>
                      console.error('Failed to sync profile to Firestore:', err)
                    );
                  }}
                  quotations={quotations}
                  contactLogs={contactLogs}
                  onAddContactLog={(newLog) => {
                    const created: ClientContactLog = {
                      ...newLog,
                      id: `log-${Date.now()}`
                    };
                    setContactLogs((prev) => [created, ...prev]);
                  }}
                  projectFiles={projectFiles}
                  onAddProjectFile={(newFile) => {
                    const created: ProjectFile = {
                      ...newFile,
                      id: `file-${Date.now()}`
                    };
                    setProjectFiles((prev) => [created, ...prev]);
                  }}
                  onDeleteProjectFile={(fileId) => {
                    setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
                  }}
                  onViewQuotation={(quotation) => setActiveQuotationForModal(quotation)}
                  onReorderQuotation={(quotation) => {
                    setSelectedServices(quotation.items);
                    setCustomerTab('builder');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToBuilder={() => {
                    setCustomerTab('builder');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  customMilestones={customMilestones}
                  onAddCustomMilestone={(newMilestone) => {
                    setCustomMilestones((prev) => [newMilestone, ...prev]);
                    saveMilestoneToFirestore(newMilestone).catch((err) =>
                      console.error('Failed to save milestone to Firestore:', err)
                    );
                    handlePushNotification(
                      'Milestone Checkpoint Added',
                      `New checkpoint "${newMilestone.title}" set for ${newMilestone.targetDate}`,
                      'booking'
                    );
                  }}
                  onUpdateMilestone={(updatedMilestone) => {
                    setCustomMilestones((prev) => {
                      const idx = prev.findIndex((m) => m.id === updatedMilestone.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = updatedMilestone;
                        return copy;
                      }
                      return [updatedMilestone, ...prev];
                    });
                    saveMilestoneToFirestore(updatedMilestone).catch((err) =>
                      console.error('Failed to update milestone in Firestore:', err)
                    );
                    handlePushNotification(
                      'Milestone Updated',
                      `"${updatedMilestone.title}" updated (Est: ${updatedMilestone.estimatedCompletionDate || updatedMilestone.targetDate})`,
                      'booking'
                    );
                  }}
                  onUpdateMilestoneStatus={(milestoneId, status) => {
                    setCustomMilestones((prev) => {
                      const idx = prev.findIndex((m) => m.id === milestoneId);
                      if (idx >= 0) {
                        const copy = [...prev];
                        const updated = { ...copy[idx], status };
                        copy[idx] = updated;
                        saveMilestoneToFirestore(updated).catch((err) =>
                          console.error('Failed to update milestone in Firestore:', err)
                        );
                        return copy;
                      } else {
                        const allMs = deriveMilestonesFromQuotations(quotations, prev);
                        const match = allMs.find((m) => m.id === milestoneId);
                        if (match) {
                          const updated = { ...match, status };
                          saveMilestoneToFirestore(updated).catch((err) =>
                            console.error('Failed to save milestone status override to Firestore:', err)
                          );
                          return [updated, ...prev];
                        }
                        return prev;
                      }
                    });
                    handlePushNotification(
                      'Milestone Updated',
                      `Milestone status changed to ${status.toUpperCase()}`,
                      'booking'
                    );
                  }}
                />
              )}

              {/* TAB 9: Quotation Builder & Customer Form */}
              {customerTab === 'builder' && (
                <QuotationBuilder
                  selectedServices={selectedServices}
                  defaultCustomer={{
                    name: currentUser?.displayName || clientProfile.name,
                    email: currentUser?.email || clientProfile.email,
                    phone: currentUser?.phone || clientProfile.phone,
                    companyName: currentUser?.companyName || clientProfile.companyName,
                    address: clientProfile.address,
                    projectTimeline: '3-4 Weeks'
                  }}
                  onRemoveService={handleRemoveService}
                  onUpdateQty={handleUpdateQty}
                  onUpdateDiscount={handleUpdateDiscount}
                  onClearAll={() => setSelectedServices([])}
                  onGenerateQuotation={handleGenerateQuotation}
                  onQuickWhatsApp={handleQuickWhatsApp}
                />
              )}

              {/* Expandable FAQ & Terms Section */}
              <FaqAndTerms />
            </div>
          )}

          {/* DEVELOPER / ADMIN PORTAL */}
          {currentPortal === 'admin' && (
            <DeveloperPortal
              services={services}
              onUpdateService={(updated) => {
                setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                saveServiceToFirestore(updated).catch((err) =>
                  console.error('Failed to update service in Firestore:', err)
                );
              }}
              onAddService={(created) => {
                setServices((prev) => [created, ...prev]);
                saveServiceToFirestore(created).catch((err) =>
                  console.error('Failed to save service to Firestore:', err)
                );
              }}
              onDeleteService={(id) => {
                setServices((prev) => prev.filter((s) => s.id !== id));
              }}
              quotations={quotations}
              onUpdateQuotationStatus={(id, status, staffId) => {
                const assigned = staff.find((s) => s.id === staffId);
                setQuotations((prev) =>
                  prev.map((q) => {
                    if (q.id === id) {
                      const updated: Quotation = {
                        ...q,
                        status,
                        paymentStatus:
                          status === 'Advance Received' && (!q.paymentStatus || q.paymentStatus === 'Pending')
                            ? 'Partial'
                            : q.paymentStatus,
                        assignedStaffId: staffId || q.assignedStaffId,
                        assignedStaffName: assigned ? assigned.name : q.assignedStaffName,
                        updatedAt: new Date().toISOString()
                      };
                      saveQuotationToFirestore(updated).catch((err) =>
                        console.error('Failed to sync updated quotation to Firestore:', err)
                      );
                      return updated;
                    }
                    return q;
                  })
                );
              }}
              onUpdateQuotationPaymentStatus={(id, paymentStatus) => {
                setQuotations((prev) =>
                  prev.map((q) => {
                    if (q.id === id) {
                      const updated: Quotation = {
                        ...q,
                        paymentStatus,
                        updatedAt: new Date().toISOString()
                      };
                      saveQuotationToFirestore(updated).catch((err) =>
                        console.error('Failed to sync updated quotation payment status to Firestore:', err)
                      );
                      return updated;
                    }
                    return q;
                  })
                );
                handlePushNotification(
                  'Payment Status Updated',
                  `Quotation payment status updated to ${paymentStatus.toUpperCase()}`,
                  'payment'
                );
              }}
              onViewQuotation={(q) => setActiveQuotationForModal(q)}
              staff={staff}
              onAddStaff={(newStaff) => setStaff((prev) => [...prev, newStaff])}
              payments={payments}
              onAddPayment={(newPayment) => {
                setPayments((prev) => [newPayment, ...prev]);
                savePaymentToFirestore(newPayment).catch((err) =>
                  console.error('Failed to sync payment to Firestore:', err)
                );
              }}
              onBroadcastPush={(title, message, type) => handlePushNotification(title, message, type)}
              companyInfo={companyInfo}
              onSaveCompanySettings={handleSaveCompanySettings}
              quotationRequests={quotationRequests}
              onUpdateQuotationRequestStatus={async (id, status) => {
                setQuotationRequests((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
                );
                const found = quotationRequests.find((r) => r.id === id);
                if (found) {
                  await saveQuotationRequestToFirestore({
                    ...found,
                    status,
                    updatedAt: new Date().toISOString()
                  });
                }
              }}
              onConvertRequestToQuotation={handleConvertRequestToQuotation}
              projects={projects}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              messages={messages}
              onSendMessage={async (text, recipient) => handleSendChatMessage('admin', text, recipient)}
              clientProfiles={clientProfiles}
              onAdminLogout={() => {
                setCurrentPortal('customer');
              }}
              onNavigateToBuilder={() => {
                setCurrentPortal('customer');
                setCustomerTab('builder');
              }}
            />
          )}
        </main>

        {/* Floating Quotation Bar when in Catalog/Rate Card mode and items selected */}
        {currentPortal === 'customer' &&
          (customerTab === 'services' || customerTab === 'rateCard') &&
          selectedServices.length > 0 && (
            <div className="no-print sticky bottom-3 z-40 max-w-4xl mx-auto px-4 w-full animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm shrink-0 border border-cyan-500/30">
                    {selectedServices.length}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400">Total All-Inclusive:</span>
                      <span className="text-base font-black text-white">
                        ₹{totalBasketAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 font-bold block">
                      50% Advance: ₹{totalBasketAdvance.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Non-refundable)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCustomerTab('builder')}
                    className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Proceed to Official Quotation & Invoice</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Footer */}
        <footer className="no-print border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              © {new Date().getFullYear()} <strong>TechSoftware.digital</strong>. All rights reserved.
              Mumbai, India.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="mailto:techsoftware.digital@gmail.com" className="hover:text-cyan-400">
                techsoftware.digital@gmail.com
              </a>
              <span>•</span>
              <a href="tel:8169401877" className="hover:text-cyan-400">
                +91 8169401877
              </a>
            </div>
          </div>
        </footer>

        {/* MODAL 1: Formal Quotation & Invoice (Print / PDF / Email simulation) */}
        {activeQuotationForModal && (
          <QuotationViewModal
            quotation={activeQuotationForModal}
            companyInfo={companyInfo}
            onClose={() => setActiveQuotationForModal(null)}
            onSendEmailSimulation={() => {
              handlePushNotification(
                'Automated Email Invoice Dispatched',
                `Official tax invoice for quote ${activeQuotationForModal.quotationNumber} sent to ${activeQuotationForModal.customer.email}.`,
                'quote'
              );
            }}
          />
        )}

        {/* MODAL 2: Booking Success & Automated Dispatch Celebration */}
        {recentlyBookedQuotation && (
          <BookingSuccessModal
            quotation={recentlyBookedQuotation}
            companyInfo={companyInfo}
            onClose={() => setRecentlyBookedQuotation(null)}
            onViewQuotation={() => {
              const q = recentlyBookedQuotation;
              setRecentlyBookedQuotation(null);
              setActiveQuotationForModal(q);
            }}
            onViewClientProfile={() => {
              setRecentlyBookedQuotation(null);
              setCustomerTab('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* MODAL 3: Authentication Modal (Login / Register / Portal Switch) */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            initialMode={authModalMode}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={(user) => {
              handleLogin(user);
              setShowAuthModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
