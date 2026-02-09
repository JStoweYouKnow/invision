import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, disableNetwork, enableNetwork, enableMultiTabIndexedDbPersistence, type Firestore } from "firebase/firestore";

// Primary Firebase Configuration
const primaryConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Backup Firebase Configuration (optional)
const backupConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_BACKUP_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_BACKUP_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_BACKUP_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_BACKUP_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_BACKUP_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_BACKUP_APP_ID,
};

const hasBackupConfig = !!backupConfig.apiKey;
const USE_BACKUP_KEY = 'invision_use_backup';

// Check if we should use backup
const shouldUseBackup = (): boolean => {
    if (!hasBackupConfig) return false;
    return localStorage.getItem(USE_BACKUP_KEY) === 'true';
};

// Initialize the appropriate Firebase app
let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;
let usingBackup = false;

const initializeFirebase = (useBackup: boolean) => {
    const config = useBackup && hasBackupConfig ? backupConfig : primaryConfig;
    const appName = useBackup ? 'backup' : undefined;

    try {
        app = initializeApp(config, appName);
        auth = getAuth(app);
        db = getFirestore(app);
        usingBackup = useBackup && hasBackupConfig;

        // Enable multi-tab persistence for robustness and better offline handling
        enableMultiTabIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time.
                console.warn('Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // The current browser does not support all of the features required to enable persistence
                console.warn('Firestore persistence failed: Browser not supported');
            } else {
                console.warn('Firestore persistence failed:', err);
            }
        });

        if (usingBackup) {
            console.log('Using backup Firebase project');
        }
    } catch (error) {
        // If backup fails, fall back to primary
        if (useBackup) {
            console.warn('Backup Firebase init failed, using primary');
            app = initializeApp(primaryConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            usingBackup = false;
        } else {
            throw error;
        }
    }
};

// Initialize with backup if previously set
initializeFirebase(shouldUseBackup());

// REMOVED: Top-level disableNetwork call to avoid race conditions with listeners.
// We now rely on isQuotaExceeded() guards in the firestore service.

// Export instances
export { app, auth, db };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export functions for dynamic network control
export const disableFirestoreNetwork = () => disableNetwork(db);
export const enableFirestoreNetwork = () => enableNetwork(db);

// Export function to switch to backup project
export const switchToBackupFirebase = (): boolean => {
    if (!hasBackupConfig) {
        console.warn('No backup Firebase config available');
        return false;
    }

    if (usingBackup) {
        console.log('Already using backup Firebase');
        return true;
    }

    localStorage.setItem(USE_BACKUP_KEY, 'true');
    console.log('Switched to backup Firebase - reload required');

    // Reload the page to reinitialize with backup config
    window.location.reload();
    return true;
};

// Export function to switch back to primary
export const switchToPrimaryFirebase = (): void => {
    localStorage.removeItem(USE_BACKUP_KEY);
    if (usingBackup) {
        console.log('Switched to primary Firebase - reload required');
        window.location.reload();
    }
};

// Export status
export const isUsingBackupFirebase = () => usingBackup;
export const hasBackupFirebaseConfig = () => hasBackupConfig;
