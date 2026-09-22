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

import { INITIAL_SERVICES } from './data/initialServices';
import {
  COMPANY_INFO,
  INITIAL_STAFF,
  INITIAL_QUOTATIONS,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLIENT_PROFILE,
  INITIAL_CONTACT_LOGS,
  INITIAL_PROJECT_FILES
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
  PaymentStatus
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
  testFirestoreConnection
} from './services/firestoreSync';

export default function App() {
  // Portal mode
  const [currentPortal, setCurrentPortal] = useState<'customer' | 'admin'>('customer');
  const [customerViewMode, setCustomerViewMode] = useState<'catalog' | 'builder' | 'profile'>('catalog');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Data states with localStorage persistence
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

  // Current Quotation basket
  const [selectedServices, setSelectedServices] = useState<QuotationSelectedService[]>([]);

  // Modals state
  const [activeQuotationForModal, setActiveQuotationForModal] = useState<Quotation | null>(null);
  const [recentlyBookedQuotation, setRecentlyBookedQuotation] = useState<Quotation | null>(null);

  // Sync to local storage
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

  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  // Firestore initialization & real-time synchronization
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

    return () => {
      unsubQuotations();
      unsubPayments();
      unsubProfile();
      unsubMilestones();
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
    setCustomerViewMode('builder');

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
    setCustomerViewMode('builder');
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
          onPortalChange={setCurrentPortal}
          selectedItemsCount={selectedServices.length}
          totalTaxable={totalTaxable}
          notifications={notifications}
          onClearNotification={handleClearNotification}
          onRequestPush={handleRequestPush}
          pushEnabled={pushEnabled}
          companyInfo={COMPANY_INFO}
          isMobileDeviceView={isMobileDeviceView}
          onToggleMobileDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
          onOpenQuotationDrawer={() => setCustomerViewMode('builder')}
          onNavigateToProfile={() => {
            setCurrentPortal('customer');
            setCustomerViewMode('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          clientName={clientProfile.name}
          firebaseConnected={firebaseConnected}
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

              {/* Customer Portal Stage Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    id="stage-catalog-btn"
                    onClick={() => setCustomerViewMode('catalog')}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerViewMode === 'catalog'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>1. Browse Services</span>
                  </button>

                  <button
                    id="stage-builder-btn"
                    onClick={() => setCustomerViewMode('builder')}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerViewMode === 'builder'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>2. Review Scope & Quote</span>
                    {selectedServices.length > 0 && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {selectedServices.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="stage-profile-btn"
                    onClick={() => setCustomerViewMode('profile')}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      customerViewMode === 'profile'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>3. Client Profile & Track Engagement</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                      {quotations.length} quotes • {projectFiles.length} files
                    </span>
                  </button>
                </div>

                {selectedServices.length > 0 && customerViewMode !== 'profile' && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Estimated Total:</span>
                    <span className="font-extrabold text-cyan-400">
                      ₹{totalBasketAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>

              {/* STAGE 1: Service Catalog */}
              {customerViewMode === 'catalog' && (
                <ServiceSelector
                  services={services}
                  selectedServices={selectedServices}
                  onToggleService={handleToggleService}
                  onUpdateQuantity={handleUpdateQuantityDelta}
                  onApplyPackagePreset={handleApplyPackagePreset}
                  onQuickBook={handleQuickBook}
                />
              )}

              {/* STAGE 2: Quotation Builder & Customer Form */}
              {customerViewMode === 'builder' && (
                <QuotationBuilder
                  selectedServices={selectedServices}
                  defaultCustomer={{
                    name: clientProfile.name,
                    email: clientProfile.email,
                    phone: clientProfile.phone,
                    companyName: clientProfile.companyName,
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

              {/* STAGE 3: Client Profile, Contact History & Project Files */}
              {customerViewMode === 'profile' && (
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
                    setCustomerViewMode('builder');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToBuilder={() => {
                    setCustomerViewMode('builder');
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
                        // If it was a derived milestone not yet in customMilestones, find it and record override
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
              }}
              onAddService={(created) => {
                setServices((prev) => [created, ...prev]);
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
                        paymentStatus: status === 'Advance Received' && (!q.paymentStatus || q.paymentStatus === 'Pending')
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
              companyInfo={COMPANY_INFO}
            />
          )}
        </main>

        {/* Floating Quotation Bar when in Catalog mode and items selected */}
        {currentPortal === 'customer' &&
          customerViewMode === 'catalog' &&
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
                    onClick={() => setCustomerViewMode('builder')}
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
            companyInfo={COMPANY_INFO}
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
            companyInfo={COMPANY_INFO}
            onClose={() => setRecentlyBookedQuotation(null)}
            onViewQuotation={() => {
              const q = recentlyBookedQuotation;
              setRecentlyBookedQuotation(null);
              setActiveQuotationForModal(q);
            }}
            onViewClientProfile={() => {
              setRecentlyBookedQuotation(null);
              setCustomerViewMode('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </div>
  );
}
