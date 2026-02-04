import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, disableNetwork, enableNetwork, type Firestore } from "firebase/firestore";

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

// Check if backup config is available
const hasBackupConfig = Boolean(backupConfig.apiKey && backupConfig.projectId);

// Storage keys
const QUOTA_EXCEEDED_KEY = 'invision_quota_exceeded';
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

// Check if quota was recently exceeded
const isQuotaExceeded = (): boolean => {
    const timestamp = localStorage.getItem(QUOTA_EXCEEDED_KEY);
    if (!timestamp) return false;
    const hourAgo = Date.now() - (60 * 60 * 1000);
    return parseInt(timestamp) > hourAgo;
};

// Initialize with backup if previously set
initializeFirebase(shouldUseBackup());

// Disable Firestore network if quota was recently exceeded (after initialization)
if (isQuotaExceeded()) {
    disableNetwork(db).catch(() => {});
    console.log('Firestore network disabled due to quota exceeded');
}

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
