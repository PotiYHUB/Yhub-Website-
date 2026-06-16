/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the core Firebase App
const firebaseAppConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(firebaseAppConfig);

// Calculate the correct Firestore database ID
// If the user has configured their own Firebase project, use the standard "(default)" database
// Otherwise, use the custom AI Studio developer sandbox database
const targetDatabaseId = (import.meta as any).env.VITE_FIRESTORE_DATABASE_ID !== undefined
  ? ((import.meta as any).env.VITE_FIRESTORE_DATABASE_ID || undefined)
  : (firebaseAppConfig.projectId === 'gen-lang-client-0921844488'
      ? (firebaseConfig.firestoreDatabaseId || undefined)
      : undefined);

// Initialize Firestore and Auth Services
export const db = getFirestore(app, targetDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Standard login popup method
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Core Sign-in Error:', error);
    throw error;
  }
}

// Global Exception definitions matching the strict Firebase skill requirements
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error Raised:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Deep serialization helper to strip out fields that are 'undefined'
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null) {
    return null as any;
  }
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof val === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(val)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return val;
}

// Connection check verification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client appears offline.");
    }
  }
}

testConnection();
