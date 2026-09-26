import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import {
  Quotation,
  PaymentRecord,
  ClientProfile,
  ProjectMilestone,
  QuotationRequest,
  Project,
  ChatMessage,
  AppNotification,
  ServiceItem,
  CompanyInfo,
  UserAccount
} from '../types';

export { testFirestoreConnection };

// ============================================================================
// 1. QUOTATION REQUESTS (Submitted by Customer -> Handled by Admin)
// ============================================================================

export function subscribeToQuotationRequests(
  onUpdate: (requests: QuotationRequest[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'quotationRequests';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: QuotationRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as QuotationRequest);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveQuotationRequestToFirestore(request: QuotationRequest): Promise<void> {
  const path = `quotationRequests/${request.id}`;
  try {
    await setDoc(doc(db, 'quotationRequests', request.id), request, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 2. FORMAL QUOTATIONS (Created by Admin -> Accepted/Rejected by Customer)
// ============================================================================

export function subscribeToQuotations(
  onUpdate: (quotations: Quotation[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'quotations';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: Quotation[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Quotation);
      });
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  const path = `quotations/${quotation.id}`;
  try {
    await setDoc(doc(db, 'quotations', quotation.id), quotation, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 3. PROJECTS (Created by Admin -> Tracked by Customer)
// ============================================================================

export function subscribeToProjects(
  onUpdate: (projects: Project[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'projects';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Project);
      });
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveProjectToFirestore(project: Project): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    await setDoc(doc(db, 'projects', project.id), project, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 4. REAL-TIME MESSAGES (Customer ↔ Admin Chat)
// ============================================================================

export function subscribeToMessages(
  onUpdate: (messages: ChatMessage[]) => void,
  customerId?: string,
  onError?: (error: Error) => void
) {
  const collectionPath = 'messages';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const msg = docSnap.data() as ChatMessage;
        if (!customerId || msg.customerId === customerId) {
          items.push(msg);
        }
      });
      // Sort chronologically
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function sendMessageToFirestore(message: ChatMessage): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    await setDoc(doc(db, 'messages', message.id), message, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
export const saveMessageToFirestore = sendMessageToFirestore;

// ============================================================================
// 5. NOTIFICATIONS (System & Activity Alerts)
// ============================================================================

export function subscribeToNotifications(
  onUpdate: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'notifications';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AppNotification);
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveNotificationToFirestore(notification: AppNotification): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 6. SERVICES / RATE CARD
// ============================================================================

export function subscribeToServices(
  onUpdate: (services: ServiceItem[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'services';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: ServiceItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ServiceItem);
        });
        onUpdate(items);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveServiceToFirestore(service: ServiceItem): Promise<void> {
  const path = `services/${service.id}`;
  try {
    await setDoc(doc(db, 'services', service.id), service, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteServiceFromFirestore(serviceId: string): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 7. USER ACCOUNTS & CLIENT PROFILES
// ============================================================================

export async function saveUserAccountToFirestore(user: UserAccount): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserAccountFromFirestore(uid: string): Promise<UserAccount | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToClientProfile(
  profileId: string,
  onUpdate: (profile: ClientProfile) => void,
  onError?: (error: Error) => void
) {
  const docPath = `clientProfiles/${profileId}`;
  return onSnapshot(
    doc(db, 'clientProfiles', profileId),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as ClientProfile);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveClientProfileToFirestore(profile: ClientProfile): Promise<void> {
  const path = `clientProfiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'clientProfiles', profile.id), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 8. PAYMENTS & MILESTONES
// ============================================================================

export function subscribeToPayments(
  onUpdate: (payments: PaymentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'payments';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: PaymentRecord[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PaymentRecord);
        });
        onUpdate(items);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function savePaymentToFirestore(payment: PaymentRecord): Promise<void> {
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToMilestones(
  onUpdate: (milestones: ProjectMilestone[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'milestones';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: ProjectMilestone[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ProjectMilestone);
        });
        onUpdate(items);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveMilestoneToFirestore(milestone: ProjectMilestone): Promise<void> {
  const path = `milestones/${milestone.id}`;
  try {
    await setDoc(doc(db, 'milestones', milestone.id), milestone, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 9. COMPANY SETTINGS
// ============================================================================

export function subscribeToCompanySettings(
  onUpdate: (settings: CompanyInfo) => void,
  onError?: (error: Error) => void
) {
  const docPath = 'settings/company';
  return onSnapshot(
    doc(db, 'settings', 'company'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CompanyInfo);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveCompanySettingsToFirestore(settings: CompanyInfo): Promise<void> {
  const path = 'settings/company';
  try {
    await setDoc(doc(db, 'settings', 'company'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 10. CLIENT PROFILES & USER ACCOUNTS
// ============================================================================

export function subscribeToClientProfiles(
  onUpdate: (profiles: ClientProfile[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'clients';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: ClientProfile[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ClientProfile);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  const userId = user.uid || user.id || `user-${Date.now()}`;
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


