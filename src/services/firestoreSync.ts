import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { Quotation, PaymentRecord, ClientProfile, ProjectMilestone } from '../types';

export { testFirestoreConnection };

// Real-time listener for Quotations
export function subscribeToQuotations(
  onUpdate: (quotations: Quotation[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = 'quotations';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: Quotation[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Quotation);
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

// Save or update a Quotation in Firestore
export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  const path = `quotations/${quotation.id}`;
  try {
    await setDoc(doc(db, 'quotations', quotation.id), quotation, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-time listener for Payments
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

// Save or update a Payment in Firestore
export async function savePaymentToFirestore(payment: PaymentRecord): Promise<void> {
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-time listener for Client Profile
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

// Save or update Client Profile in Firestore
export async function saveClientProfileToFirestore(profile: ClientProfile): Promise<void> {
  const path = `clientProfiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'clientProfiles', profile.id), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Milestone to Firestore
export async function saveMilestoneToFirestore(milestone: ProjectMilestone): Promise<void> {
  const path = `milestones/${milestone.id}`;
  try {
    await setDoc(doc(db, 'milestones', milestone.id), milestone, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-time listener for Milestones
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
