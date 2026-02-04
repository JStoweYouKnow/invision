import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { MOCK_USER } from '@/lib/mockData';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    authError: string | null;
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to create a Firebase-like User object from our Mock User
const createMockUser = (): User => ({
    uid: MOCK_USER.uid,
    displayName: MOCK_USER.displayName,
    email: MOCK_USER.email,
    photoURL: MOCK_USER.photoURL,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => { },
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({}) as Awaited<ReturnType<User['getIdTokenResult']>>,
    reload: async () => { },
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'google.com'
} as unknown as User);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    const clearAuthError = () => setAuthError(null);

    useEffect(() => {
        // Use onIdTokenChanged instead of onAuthStateChanged to catch profile updates (name/photo changes)
        // because updateProfile triggers a token refresh
        const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setLoading(false);
            } else {
                // Check for persistent mock session
                const isMockAuth = localStorage.getItem('isMockAuth');
                if (isMockAuth === 'true') {
                    setUser(createMockUser());
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        setAuthError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Firebase Auth failed:", error);
            const firebaseError = error as { code?: string; message?: string };

            // Provide user-friendly error messages
            if (firebaseError.code === 'auth/popup-blocked') {
                setAuthError('Popup was blocked. Please allow popups or try Demo Mode.');
            } else if (firebaseError.code === 'auth/popup-closed-by-user') {
                // User closed popup, not really an error
                return;
            } else if (firebaseError.code === 'auth/cancelled-popup-request') {
                return;
            } else if (firebaseError.code === 'auth/network-request-failed') {
                setAuthError('Network error. Please check your connection or try Demo Mode.');
            } else if (firebaseError.code === 'auth/quota-exceeded' || firebaseError.code === 'resource-exhausted') {
                setAuthError('Service temporarily unavailable. Please try Demo Mode.');
            } else if (firebaseError.code === 'auth/unauthorized-domain') {
                setAuthError('This domain is not authorized. Please try Demo Mode.');
            } else {
                setAuthError('Sign-in failed. Please try Demo Mode instead.');
            }
            throw error;
        }
    };

    const signInAsGuest = async () => {
        setLoading(true);
        localStorage.setItem('isMockAuth', 'true');
        // Simulate a small network delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));
        setUser(createMockUser());
        setLoading(false);
    };

    const signOut = async () => {
        localStorage.removeItem('isMockAuth');
        try {
            await firebaseSignOut(auth);
        } catch {
            // Ignore signout errors if we were mock authenticated
            console.log("Signed out of demo session");
        }
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-brand-purple font-medium animate-pulse">Initializing Cosmic Link...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, signInAsGuest, signOut, clearAuthError }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
