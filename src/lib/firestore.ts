import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc, limit, orderBy, setDoc, onSnapshot, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import type { GeneratedPlan } from './gemini';
import type { CelestialType } from '@/components/CelestialBody';
import { MOCK_USER } from './mockData';

export interface SavedGoal {
    id?: string;
    userId: string;
    title: string;
    description: string;
    createdAt: Date;
    plan: GeneratedPlan;
    visionImage: string;
    isPublic?: boolean;
    authorName?: string;
    authorPhoto?: string;
    celestialType?: CelestialType;
}

// Helper to safely convert Firestore timestamp to Date
function toDate(timestamp: unknown): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
        return (timestamp as Timestamp).toDate();
    }
    return new Date();
}

export const firestoreService = {
    async saveGoal(userId: string, plan: GeneratedPlan, visionImage: string, authorName?: string, authorPhoto?: string, celestialType?: CelestialType): Promise<string> {
        try {
            const goalData = {
                userId,
                title: plan.title,
                description: plan.description,
                plan,
                visionImage,
                createdAt: Timestamp.now(),
                isPublic: false, // Default to private
                authorName,
                authorPhoto,
                celestialType
            };

            const docRef = await addDoc(collection(db, 'goals'), goalData);
            return docRef.id;
        } catch (error) {
            console.error("Error saving goal:", error);
            throw error;
        }
    },

    async updateGoal(goalId: string, data: Partial<SavedGoal>): Promise<void> {
        try {
            const docRef = doc(db, 'goals', goalId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating goal:", error);
            throw error;
        }
    },

    async getUserGoals(userId: string): Promise<SavedGoal[]> {
        try {
            const q = query(collection(db, 'goals'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: toDate(doc.data().createdAt),
            })) as SavedGoal[];
        } catch (error) {
            console.error("Error fetching user goals:", error);
            throw error;
        }
    },

    async getGoalById(goalId: string): Promise<SavedGoal | null> {
        try {
            const docRef = doc(db, 'goals', goalId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: toDate(data.createdAt),
                } as SavedGoal;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching goal:", error);
            throw error;
        }
    },

    async toggleVisibility(goalId: string, isPublic: boolean): Promise<void> {
        try {
            const docRef = doc(db, 'goals', goalId);
            await updateDoc(docRef, { isPublic });
        } catch (error) {
            console.error("Error toggling visibility:", error);
            throw error;
        }
    },

    async getPublicGoals(): Promise<SavedGoal[]> {
        try {
            const q = query(
                collection(db, 'goals'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: toDate(doc.data().createdAt),
            })) as SavedGoal[];
        } catch (error) {
            console.error("Error fetching public goals:", error);
            throw error;
        }
    },

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        // Intercept Mock User
        if (userId === MOCK_USER.uid) {
            return MOCK_USER;
        }
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
        // Intercept Mock User
        if (userId === MOCK_USER.uid) {
            console.log("Mock profile updated:", data);
            return;
        }
        try {
            const docRef = doc(db, 'users', userId);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // --- Messaging System ---

    // AI Chat Persistence
    async saveChatMessage(userId: string, planId: string, message: Message): Promise<void> {
        try {
            // Store AI chats in a subcollection of the plan or a top-level 'ai_chats' collection
            // Using top-level for easier querying/expansion
            const chatPath = `ai_chats/${userId}_${planId}/messages`;
            await addDoc(collection(db, chatPath), {
                ...message,
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error saving chat message:", error);
            throw error;
        }
    },

    async getChatHistory(userId: string, planId: string): Promise<Message[]> {
        try {
            const chatPath = `ai_chats/${userId}_${planId}/messages`;
            const q = query(collection(db, chatPath), orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: toDate(doc.data().createdAt)
            } as Message));
        } catch (error) {
            console.error("Error getting chat history:", error);
            return [];
        }
    },

    // User-to-User Messaging
    async createConversation(participantIds: string[]): Promise<string> {
        // Check if conversation already exists
        // (Simplified check: exact match would require more complex query or composite ID)
        // For now, we'll try to use a deterministic ID if possible "minId_maxId" for 1-on-1
        const sortedIds = [...participantIds].sort();
        const convId = sortedIds.join('_');

        const docRef = doc(db, 'conversations', convId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await setDoc(docRef, {
                participantIds,
                createdAt: Timestamp.now(),
                lastMessage: null,
                lastMessageAt: null,
                updatedAt: Timestamp.now()
            });
        }
        return convId;
    },

    async sendMessage(conversationId: string, message: Partial<Message>): Promise<void> {
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                ...message,
                createdAt: Timestamp.now()
            });

            // Update conversation "last message" for sorting list view
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: message.text,
                lastMessageAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    subscribeToConversations(userId: string, callback: (convs: Conversation[]) => void): () => void {
        const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );

        // Uses the onSnapshot function which must be imported from firebase/firestore
        // Note: For this to work in `firestore.ts`, we need to import `onSnapshot`
        // Since I cannot change imports easily in this single block if they aren't there, 
        // I will assume the user or the next step will fix imports if missing, 
        // OR I will use a clever partial replace to add it. 
        // LIMITATION: 'onSnapshot' is not in the imports list of the original file shown previously.
        // It needs to be added. I will add it in a preceding Tool Call in the real world, 
        // or just use `getDocs` if I can't sync. But for P2P chat, real-time is requested.
        // For now, I will return a promise-based getter if onSnapshot is unavailable,
        // BUT strict constraint: I should add onSnapshot to imports first.

        // Wait, I can't add imports in this specific block replace unless I touch the top.
        // I will add the function body assuming onSnapshot exists, and update imports in a separate call 
        // or effectively... actually, I'll switch strategies and do a bigger replacement or two replacements.
        return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const conversations = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: toDate(docSnap.data().createdAt),
                lastMessageAt: toDate(docSnap.data().lastMessageAt),
                updatedAt: toDate(docSnap.data().updatedAt)
            } as Conversation));
            callback(conversations);
        });
    },

    subscribeToMessages(conversationId: string, callback: (msgs: Message[]) => void): () => void {
        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const messages = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: toDate(docSnap.data().createdAt)
            } as Message));
            callback(messages);
        });
    }
};

export interface Message {
    id?: string;
    senderId: string; // 'ai' or userId
    senderName?: string;
    text: string;
    createdAt: Date;
    role?: 'user' | 'model' | 'guide'; // For AI context
}

export interface Conversation {
    id: string;
    participantIds: string[];
    createdAt: Date;
    lastMessage?: string;
    lastMessageAt?: Date;
    updatedAt: Date;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    bio: string;
    preferences: {
        emailNotifications: boolean;
        publicProfile: boolean;
        soundEnabled?: boolean;
        analyticsEnabled?: boolean;
    };
}
