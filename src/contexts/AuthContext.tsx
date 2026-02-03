import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { MOCK_USER } from '@/lib/mockData';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
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
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Firebase Auth failed, falling back to Demo Mode", error);
            // Fallback to Mock Auth if configuration is missing or invalid
            // We check for specific Firebase error codes or just generic failure in this demo context
            // if (error.code === 'auth/configuration-not-found' || error.code === 'auth/internal-error' || error.message.includes('CONFIGURATION_NOT_FOUND')) {
            // Activate Mock Mode -> DISABLED for production verification
            // localStorage.setItem('isMockAuth', 'true');
            // setUser(createMockUser());
            // return;
            // }
            throw error; // Re-throw other errors
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
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsGuest, signOut }}>
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
