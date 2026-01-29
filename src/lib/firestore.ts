import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc, deleteDoc, limit, orderBy, setDoc, onSnapshot } from 'firebase/firestore';
import type { GeneratedPlan } from './gemini';
import type { CelestialType } from '@/components/CelestialBody';
import { MOCK_USER, MOCK_ADDITIONAL_USERS, MOCK_GOALS, MOCK_ADDITIONAL_GOALS } from './mockData';



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
    category?: GoalCategory;
}

export type GoalCategory = 'Career' | 'Health' | 'Travel' | 'Creative' | 'Lifestyle' | 'Finance' | 'Education' | 'Other';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    bio: string;
    friends?: string[]; // List of user IDs
    preferences: {
        emailNotifications: boolean;
        publicProfile: boolean;
        soundEnabled?: boolean;
        analyticsEnabled?: boolean;
    };
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

// Helper to recursively sanitize data for Firestore (remove undefined)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeData(data: any): any {
    if (data === undefined) return null;
    if (data === null) return null;
    if (data instanceof Date) return data;
    if (data instanceof Timestamp) return data;

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeData(data[key]);
            }
        }
        return sanitized;
    }

    return data;
}

// --- In-Memory Mock Store for Demo Session ---
const mockStore = {
    messages: {} as Record<string, Message[]>,
    conversations: [] as Conversation[],
    listeners: {} as Record<string, Set<(data: any) => void>>,
    journalEntries: [] as JournalEntry[]
};

// Initialize mock conversations with Sarah and David if empty
if (mockStore.conversations.length === 0) {
    const user = MOCK_USER;
    MOCK_ADDITIONAL_USERS.forEach(u => {
        const conversationId = [user.uid, u.uid].sort().join('_');
        mockStore.conversations.push({
            id: conversationId,
            participantIds: [user.uid, u.uid],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMessageAt: new Date(),
            lastMessage: "Welcome to the community!",
            unreadCounts: { [user.uid]: 1 }
        });
        // Init messages
        mockStore.messages[conversationId] = [{
            id: 'welcome-msg-1',
            senderId: 'system',
            senderName: 'System',
            text: `This is a demo conversation with ${u.displayName}. Messaging is fully simulated in this session.`,
            createdAt: new Date()
        }];
    });
}

// Helper to notify listeners
const notifyListeners = (key: string, data: any) => {
    if (mockStore.listeners[key]) {
        mockStore.listeners[key].forEach(cb => cb(data));
    }
};

export const firestoreService = {

    saveGoal: async (userId: string, plan: GeneratedPlan, visionImage: string, authorName?: string, authorPhoto?: string, celestialType?: CelestialType): Promise<string> => {
        if (userId === MOCK_USER.uid) {
            console.log("Mock User: 'Saving' goal locally (skipped Firestore write).");
            return `mock-goal-${Date.now()}`;
        }
        try {
            const goalData = {
                userId,
                title: plan.title,
                description: plan.description,
                plan,
                visionImage,
                createdAt: Timestamp.now(),
                isPublic: false, // Default to private
                authorName: authorName || 'Anonymous',
                authorPhoto: authorPhoto || null,
                celestialType: celestialType || null
            };

            const sanitizedData = sanitizeData(goalData);
            const docRef = await addDoc(collection(db, 'goals'), sanitizedData);
            return docRef.id;
        } catch (error) {
            console.error("Error saving goal:", error);
            throw error;
        }
    },

    updateGoal: async (goalId: string, data: Partial<SavedGoal>): Promise<void> => {
        if (goalId.startsWith('mock-goal-')) {
            console.log("Mock User: 'Updating' goal locally.");
            return;
        }
        try {
            const docRef = doc(db, 'goals', goalId);
            const sanitizedData = sanitizeData(data);
            await updateDoc(docRef, sanitizedData);
        } catch (error) {
            console.error("Error updating goal:", error);
            throw error;
        }
    },

    deleteGoal: async (goalId: string): Promise<void> => {
        if (goalId.startsWith('mock-goal-')) {
            console.log("Mock User: 'Deleting' goal locally.");
            return;
        }
        try {
            const docRef = doc(db, 'goals', goalId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting goal:", error);
            throw error;
        }
    },

    getUserGoals: async (userId: string): Promise<SavedGoal[]> => {
        if (userId === MOCK_USER.uid) {
            console.log("Mock User: Returning empty goals list or should we return mock goals? Returning empty for now to start fresh or MOCK_GOALS.");
            // Optional: Return MOCK_GOALS for the mock user to populate the dashboard?
            // Let's return MOCK_GOALS if the user is the mock user, so the dashboard isn't empty.
            return MOCK_GOALS;
        }
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

    getGoalById: async (goalId: string): Promise<SavedGoal | null> => {
        // Mock check
        if (goalId.startsWith('mock-goal-') || goalId.startsWith('goal_sarah') || goalId.startsWith('goal_david')) {
            const allMockGoals = [...MOCK_GOALS, ...MOCK_ADDITIONAL_GOALS];
            return allMockGoals.find(g => g.id === goalId) || null;
        }

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

    toggleVisibility: async (goalId: string, isPublic: boolean): Promise<void> => {
        if (goalId.startsWith('mock-goal-') || goalId.startsWith('goal_sarah') || goalId.startsWith('goal_david')) {
            const goal = [...MOCK_GOALS, ...MOCK_ADDITIONAL_GOALS].find(g => g.id === goalId);
            if (goal) goal.isPublic = isPublic;
            return;
        }
        try {
            const docRef = doc(db, 'goals', goalId);
            await updateDoc(docRef, { isPublic });
        } catch (error) {
            console.error("Error toggling visibility:", error);
            throw error;
        }
    },

    getPublicGoals: async (): Promise<SavedGoal[]> => {
        try {
            // Include mock public goals for demo
            const mockPublicCalls = [...MOCK_GOALS, ...MOCK_ADDITIONAL_GOALS].filter(g => g.isPublic);

            const q = query(
                collection(db, 'goals'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const querySnapshot = await getDocs(q);

            const realGoals = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: toDate(doc.data().createdAt),
            })) as SavedGoal[];

            return [...mockPublicCalls, ...realGoals].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            console.warn("Error fetching public goals (likely permission), falling back to mocks:", error);
            return [...MOCK_GOALS, ...MOCK_ADDITIONAL_GOALS].filter(g => g.isPublic);
        }
    },

    getUserProfile: async (userId: string): Promise<UserProfile | null> => {
        if (userId === MOCK_USER.uid) return MOCK_USER;
        const mockUser = MOCK_ADDITIONAL_USERS.find(u => u.uid === userId);
        if (mockUser) return mockUser;

        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return docSnap.data() as UserProfile;
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Don't throw, just return null so UI handles it gracefully
            return null;
        }
    },

    updateUserProfile: async (userId: string, data: Partial<UserProfile>): Promise<void> => {
        if (userId === MOCK_USER.uid) return;
        try {
            const docRef = doc(db, 'users', userId);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    searchUsers: async (searchTerm: string, currentUserId: string): Promise<UserProfile[]> => {
        try {
            if (!searchTerm.trim()) return [];

            let allUsers: UserProfile[] = [];

            try {
                const q = query(
                    collection(db, 'users'),
                    where('preferences.publicProfile', '==', true),
                    limit(20)
                );

                const snapshot = await getDocs(q);
                allUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
            } catch (firestoreError) {
                // Silently fail on firestore errors
            }

            const searchLower = searchTerm.toLowerCase();
            const firestoreMatches = allUsers.filter(user =>
                user.uid !== currentUserId &&
                (user.displayName?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower))
            );

            const mockMatches = MOCK_ADDITIONAL_USERS.filter(user =>
                user.uid !== currentUserId &&
                (user.displayName?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower))
            );

            // Deduplicate
            const combined = [...firestoreMatches];
            for (const mockUser of mockMatches) {
                if (!combined.some(u => u.uid === mockUser.uid)) {
                    combined.push(mockUser);
                }
            }
            return combined;
        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    },

    getUserProfiles: async (userIds: string[]): Promise<Map<string, UserProfile>> => {
        const profiles = new Map<string, UserProfile>();

        if (userIds.includes(MOCK_USER.uid)) profiles.set(MOCK_USER.uid, MOCK_USER);

        MOCK_ADDITIONAL_USERS.forEach(user => {
            if (userIds.includes(user.uid)) profiles.set(user.uid, user);
        });

        const realUserIds = userIds.filter(id => id !== MOCK_USER.uid && !MOCK_ADDITIONAL_USERS.some(u => u.uid === id));
        if (realUserIds.length === 0) return profiles;

        try {
            // Batch this? For now parallel is fine for small N
            const promises = realUserIds.map(async (userId) => {
                try {
                    const docRef = doc(db, 'users', userId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { userId, profile: docSnap.data() as UserProfile };
                    }
                } catch (error) {
                    // ignore individual failures
                }
                return null;
            });

            const results = await Promise.all(promises);
            results.forEach(result => {
                if (result) profiles.set(result.userId, result.profile);
            });
        } catch (error) {
            console.warn("Error fetching profiles:", error);
        }

        return profiles;
    },

    saveChatMessage: async (userId: string, planId: string, message: Message): Promise<void> => {
        if (userId === MOCK_USER.uid) return;
        try {
            const chatPath = `ai_chats/${userId}_${planId}/messages`;
            await addDoc(collection(db, chatPath), { ...message, createdAt: Timestamp.now() });
        } catch (error) {
            console.error("Error saving AI chat:", error);
        }
    },

    getChatHistory: async (userId: string, planId: string): Promise<Message[]> => {
        if (userId === MOCK_USER.uid) return [];
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
            return [];
        }
    },

    // --- MESSAGING SYSTEM (Updated for Statefulness) ---

    createConversation: async (participantIds: string[]): Promise<string> => {
        const sortedIds = [...participantIds].sort();
        const convId = sortedIds.join('_');

        // Check if this involves mock users -> Use In-Memory Store
        const isMockReference = participantIds.some(id =>
            id === MOCK_USER.uid ||
            id.startsWith('dummy_') ||
            MOCK_ADDITIONAL_USERS.some(u => u.uid === id)
        );

        if (isMockReference) {
            // Ensure conversation exists in mock store
            const existing = mockStore.conversations.find(c => c.id === convId);
            if (!existing) {
                const newConv: Conversation = {
                    id: convId,
                    participantIds,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastMessageAt: new Date(),
                    lastMessage: undefined,
                    unreadCounts: {}
                };
                mockStore.conversations.push(newConv);
                // Initialize message store
                if (!mockStore.messages[convId]) mockStore.messages[convId] = [];

                // Notify conversation listeners
                participantIds.forEach(uid => {
                    notifyListeners(`conv_${uid}`, mockStore.conversations.filter(c => c.participantIds.includes(uid)));
                });
            }
            return convId;
        }

        // Real Firestore logic
        try {
            const docRef = doc(db, 'conversations', convId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                const unreadCounts: { [key: string]: number } = {};
                participantIds.forEach(id => { unreadCounts[id] = 0; });

                await setDoc(docRef, {
                    participantIds,
                    createdAt: Timestamp.now(),
                    lastMessage: null,
                    lastMessageAt: null,
                    updatedAt: Timestamp.now(),
                    unreadCounts
                });
            }
            return convId;
        } catch (error) {
            console.error("Error creating conversation:", error);
            // Verify if we can fallback to mock if firestore fails
            // For now, throw so UI knows
            throw error;
        }
    },

    sendMessage: async (conversationId: string, message: Partial<Message>): Promise<void> => {
        // Mock / In-Memory Handler
        if (conversationId.includes('dummy_') || conversationId.includes(MOCK_USER.uid) || mockStore.conversations.find(c => c.id === conversationId)) {

            const newMessage = { ...message, id: `msg-${Date.now()}`, createdAt: new Date() } as Message;

            // 1. Add to message store
            if (!mockStore.messages[conversationId]) mockStore.messages[conversationId] = [];
            mockStore.messages[conversationId].push(newMessage);

            // 2. Update conversation metadata
            const convIndex = mockStore.conversations.findIndex(c => c.id === conversationId);
            if (convIndex >= 0) {
                const conv = mockStore.conversations[convIndex];
                conv.lastMessage = message.text;
                conv.lastMessageAt = new Date();
                conv.updatedAt = new Date();

                // Update unread counts
                conv.participantIds.forEach(pid => {
                    if (pid !== message.senderId) {
                        conv.unreadCounts = conv.unreadCounts || {};
                        conv.unreadCounts[pid] = (conv.unreadCounts[pid] || 0) + 1;
                    }
                });

                // Notify listeners
                notifyListeners(`msg_${conversationId}`, mockStore.messages[conversationId]);
                // Notify conversation list listeners for all participants involved
                conv.participantIds.forEach(uid => {
                    notifyListeners(`conv_${uid}`, mockStore.conversations.filter(c => c.participantIds.includes(uid)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
                });
            }

            return;
        }

        // Real Firestore
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, { ...message, createdAt: Timestamp.now() });

            const convRef = doc(db, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);

            if (convSnap.exists()) {
                const convData = convSnap.data();
                const participantIds = convData.participantIds || [];
                const unreadCounts = convData.unreadCounts || {};
                participantIds.forEach((participantId: string) => {
                    if (participantId !== message.senderId) {
                        unreadCounts[participantId] = (unreadCounts[participantId] || 0) + 1;
                    }
                });

                await updateDoc(convRef, {
                    lastMessage: message.text,
                    lastMessageAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    unreadCounts
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    markConversationAsRead: async (conversationId: string, userId: string): Promise<void> => {
        // Mock Handler
        const mockConv = mockStore.conversations.find(c => c.id === conversationId);
        if (mockConv) {
            if (mockConv.unreadCounts) {
                mockConv.unreadCounts[userId] = 0;
            }
            // Notify conversation list listeners to update badges
            mockConv.participantIds.forEach(uid => {
                notifyListeners(`conv_${uid}`, mockStore.conversations.filter(c => c.participantIds.includes(uid)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
            });
            return;
        }

        try {
            const convRef = doc(db, 'conversations', conversationId);
            // Just update, assume it exists
            const convSnap = await getDoc(convRef);
            if (convSnap.exists()) {
                const convData = convSnap.data();
                const unreadCounts = convData.unreadCounts || {};
                unreadCounts[userId] = 0;
                await updateDoc(convRef, { unreadCounts });
            }
        } catch (error) {
            // ignore
        }
    },

    subscribeToConversations: (userId: string, callback: (convs: Conversation[]) => void): () => void => {
        // Listen to Mock Store changes
        const listenerKey = `conv_${userId}`;
        if (!mockStore.listeners[listenerKey]) mockStore.listeners[listenerKey] = new Set();
        mockStore.listeners[listenerKey].add(callback);

        // Initial callback with current mock state or fallback state
        // Try to verify if we should use Real Firestore or just Mock
        // For this demo environment, try Firestore first, if it fails, fallback to Mock

        let unsubFirestore: (() => void) | null = null;

        try {
            const q = query(
                collection(db, 'conversations'),
                where('participantIds', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );
            unsubFirestore = onSnapshot(q, (snapshot) => {
                const realConvs = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: toDate(docSnap.data().createdAt),
                    lastMessageAt: toDate(docSnap.data().lastMessageAt),
                    updatedAt: toDate(docSnap.data().updatedAt)
                } as Conversation));

                // Merge with mock conversations (if any local ones exist)
                // Filter mocks for this user
                const mocks = mockStore.conversations.filter(c => c.participantIds.includes(userId));
                // Dedupe: favors real over mock if conflict (unlikely given ID generation)
                const combined = [...realConvs];
                mocks.forEach(m => {
                    if (!combined.some(r => r.id === m.id)) combined.push(m);
                });

                callback(combined.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));

            }, (error) => {
                console.warn("Firestore sub failed (using mock store):", error);
                // Fallback to purely mock store
                const mocks = mockStore.conversations.filter(c => c.participantIds.includes(userId));
                callback(mocks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
            });
        } catch (e) {
            console.warn("Firestore setup failed:", e);
            const mocks = mockStore.conversations.filter(c => c.participantIds.includes(userId));
            callback(mocks);
        }

        return () => {
            if (unsubFirestore) unsubFirestore();
            if (mockStore.listeners[listenerKey]) {
                mockStore.listeners[listenerKey].delete(callback);
            }
        };
    },

    subscribeToMessages: (conversationId: string, callback: (msgs: Message[]) => void): () => void => {
        // Mock Listener
        const listenerKey = `msg_${conversationId}`;
        if (!mockStore.listeners[listenerKey]) mockStore.listeners[listenerKey] = new Set();
        mockStore.listeners[listenerKey].add(callback);

        // Initial Callback
        if (mockStore.messages[conversationId]) {
            callback(mockStore.messages[conversationId]);
        }

        let unsubFirestore: (() => void) | null = null;

        // Only try Firestore if it's NOT a mock conversation
        const isMockConv = mockStore.conversations.some(c => c.id === conversationId);

        if (!isMockConv) {
            try {
                const q = query(
                    collection(db, 'conversations', conversationId, 'messages'),
                    orderBy('createdAt', 'asc')
                );
                unsubFirestore = onSnapshot(q, (snapshot) => {
                    const messages = snapshot.docs.map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                        createdAt: toDate(docSnap.data().createdAt)
                    } as Message));
                    callback(messages);
                }, (_error) => {
                    // Fallback to mock message store if exists
                    if (mockStore.messages[conversationId]) {
                        callback(mockStore.messages[conversationId]);
                    } else {
                        // Return empty or error message
                        callback([]);
                    }
                });
            } catch (e) {
                if (mockStore.messages[conversationId]) {
                    callback(mockStore.messages[conversationId]);
                }
            }
        }

        return () => {
            if (unsubFirestore) unsubFirestore();
            if (mockStore.listeners[listenerKey]) {
                mockStore.listeners[listenerKey].delete(callback);
            }
        };
    },

    // --- Journal Entries ---

    async saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        // Mock / In-Memory Handler
        if (entry.goalId.startsWith('mock-') || entry.goalId.startsWith('goal_sarah') || entry.goalId.startsWith('goal_david')) {
            const newId = `mock-entry-${Date.now()}`;
            const newEntry: JournalEntry = {
                ...entry,
                id: newId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Initialize store if needed (though we init above)
            if (!mockStore.journalEntries) mockStore.journalEntries = [];
            mockStore.journalEntries.push(newEntry);

            return newId;
        }

        try {
            const docRef = await addDoc(collection(db, 'journal_entries'), {
                ...entry,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error saving journal entry:", error);
            throw error;
        }
    },

    async getJournalEntries(goalId: string): Promise<JournalEntry[]> {
        // Mock Handler
        if (goalId.startsWith('mock-') || goalId.startsWith('goal_sarah') || goalId.startsWith('goal_david')) {
            return (mockStore.journalEntries || [])
                .filter(e => e.goalId === goalId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        try {
            const q = query(
                collection(db, 'journal_entries'),
                where('goalId', '==', goalId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: toDate(docSnap.data().createdAt),
                updatedAt: toDate(docSnap.data().updatedAt)
            })) as JournalEntry[];
        } catch (error) {
            console.error("Error fetching journal entries:", error);
            return [];
        }
    },

    async getJournalEntriesForMilestone(goalId: string, milestoneIndex: number): Promise<JournalEntry[]> {
        // Mock Handler
        if (goalId.startsWith('mock-') || goalId.startsWith('goal_sarah') || goalId.startsWith('goal_david')) {
            return (mockStore.journalEntries || [])
                .filter(e => e.goalId === goalId && e.milestoneIndex === milestoneIndex)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        try {
            const q = query(
                collection(db, 'journal_entries'),
                where('goalId', '==', goalId),
                where('milestoneIndex', '==', milestoneIndex),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: toDate(docSnap.data().createdAt),
                updatedAt: toDate(docSnap.data().updatedAt)
            })) as JournalEntry[];
        } catch (error) {
            console.error("Error fetching milestone journal entries:", error);
            return [];
        }
    },

    async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
        // Mock Handler
        if (entryId.startsWith('mock-entry-') || entryId.startsWith('journal-')) {
            const index = mockStore.journalEntries?.findIndex(e => e.id === entryId);
            if (index !== undefined && index !== -1 && mockStore.journalEntries) {
                mockStore.journalEntries[index] = {
                    ...mockStore.journalEntries[index],
                    ...updates,
                    updatedAt: new Date()
                };
            }
            return;
        }

        try {
            const docRef = doc(db, 'journal_entries', entryId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating journal entry:", error);
            throw error;
        }
    },

    async deleteJournalEntry(entryId: string): Promise<void> {
        // Mock Handler
        if (entryId.startsWith('mock-entry-') || entryId.startsWith('journal-')) {
            if (mockStore.journalEntries) {
                mockStore.journalEntries = mockStore.journalEntries.filter(e => e.id !== entryId);
            }
            return;
        }

        try {
            await deleteDoc(doc(db, 'journal_entries', entryId));
        } catch (error) {
            console.error("Error deleting journal entry:", error);
            throw error;
        }
    },

    async toggleFriend(userId: string, targetUserId: string): Promise<boolean> {
        // Mock Implementation
        if (userId === MOCK_USER.uid) {
            const user = MOCK_USER;
            if (!user.friends) user.friends = [];

            const index = user.friends.indexOf(targetUserId);
            if (index > -1) {
                user.friends.splice(index, 1);
                return false; // Removed
            } else {
                user.friends.push(targetUserId);
                return true; // Added
            }
        }

        // Real Firestore Implementation
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) return false;

            const userData = userSnap.data() as UserProfile;
            const friends = userData.friends || [];
            const isFriend = friends.includes(targetUserId);

            let newFriends;
            if (isFriend) {
                newFriends = friends.filter(id => id !== targetUserId);
            } else {
                newFriends = [...friends, targetUserId];
            }

            await updateDoc(userRef, { friends: newFriends });
            return !isFriend;
        } catch (error) {
            console.error("Error toggling friend:", error);
            throw error;
        }
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
    unreadCounts?: { [userId: string]: number };
}

export type JournalMood = 'great' | 'good' | 'neutral' | 'struggling' | 'frustrated';

export interface JournalEntry {
    id?: string;
    goalId: string;
    milestoneIndex: number; // -1 for general entries
    stepIndex?: number;     // Optional: specific step
    userId: string;
    content: string;
    mood?: JournalMood;
    aiReflection?: string;
    aiPrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}
