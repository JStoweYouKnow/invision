import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc, deleteDoc, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { MOCK_USER } from './mockData';

// Notification Types
export type NotificationType =
    | 'milestone_reminder'      // Upcoming milestone deadline
    | 'step_reminder'           // Daily step reminder
    | 'streak_alert'            // Streak at risk
    | 'achievement'             // New achievement unlocked
    | 'social'                  // Friend activity, messages
    | 'system';                 // System announcements

export interface Notification {
    id?: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;              // Emoji or icon name
    actionUrl?: string;         // Deep link to relevant page
    goalId?: string;            // Related goal if applicable
    isRead: boolean;
    createdAt: Date;
    scheduledFor?: Date;        // For scheduled notifications
    expiresAt?: Date;           // Auto-delete after this time
}

export interface NotificationPreferences {
    enabled: boolean;
    milestoneReminders: boolean;    // Remind before milestone deadlines
    dailyStepReminders: boolean;    // Daily motivation reminders
    streakAlerts: boolean;          // Alert when streak is at risk
    socialNotifications: boolean;   // Friend activity
    emailDigest: 'none' | 'daily' | 'weekly';
    quietHoursStart?: string;       // e.g., "22:00"
    quietHoursEnd?: string;         // e.g., "08:00"
    reminderDaysBefore: number;     // Days before milestone to remind (default: 3)
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    enabled: true,
    milestoneReminders: true,
    dailyStepReminders: true,
    streakAlerts: true,
    socialNotifications: true,
    emailDigest: 'weekly',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    reminderDaysBefore: 3
};

// In-memory store for demo mode
const STORAGE_KEY = 'invision_notifications_v1';

const loadMockNotifications = (): Notification[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            return data.map((n: Notification) => ({
                ...n,
                createdAt: new Date(n.createdAt),
                scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
                expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
            }));
        }
    } catch (e) {
        console.warn('Failed to load notifications from storage', e);
    }
    return [];
};

const saveMockNotifications = (notifications: Notification[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
        console.warn('Failed to save notifications to storage', e);
    }
};

let mockNotifications: Notification[] = loadMockNotifications();
const mockListeners: Set<(notifications: Notification[]) => void> = new Set();

// Initialize with some demo notifications if empty
if (mockNotifications.length === 0) {
    const now = new Date();
    mockNotifications = [
        {
            id: 'notif_1',
            userId: MOCK_USER.uid,
            type: 'milestone_reminder',
            title: 'Milestone Coming Up!',
            message: 'Your "Foundation Building" milestone is due in 3 days. You\'re 60% complete!',
            icon: '🎯',
            actionUrl: '/plan/goal_sarah_1',
            goalId: 'goal_sarah_1',
            isRead: false,
            createdAt: new Date(now.getTime() - 1000 * 60 * 30) // 30 min ago
        },
        {
            id: 'notif_2',
            userId: MOCK_USER.uid,
            type: 'streak_alert',
            title: 'Keep Your Streak Alive!',
            message: 'You haven\'t logged progress in 2 days. Complete a step to maintain your 7-day streak!',
            icon: '🔥',
            isRead: false,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
            id: 'notif_3',
            userId: MOCK_USER.uid,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: 'You earned "First Steps" - Complete your first milestone step.',
            icon: '🏆',
            isRead: true,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) // 1 day ago
        },
        {
            id: 'notif_4',
            userId: MOCK_USER.uid,
            type: 'social',
            title: 'New Community Activity',
            message: 'Sarah Chen shared a new vision: "Master Data Science"',
            icon: '👋',
            actionUrl: '/community',
            isRead: true,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48) // 2 days ago
        }
    ];
    saveMockNotifications(mockNotifications);
}

const notifyMockListeners = () => {
    const sorted = [...mockNotifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    mockListeners.forEach(cb => cb(sorted));
};

export const notificationService = {
    // Request browser notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    },

    // Show a browser notification
    async showBrowserNotification(title: string, options?: NotificationOptions): Promise<void> {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/images/galaxy-bubble-v2.png',
                badge: '/images/galaxy-bubble-v2.png',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    },

    // Create a new notification
    async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<string> {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}`,
            isRead: false,
            createdAt: new Date()
        };

        // Check if mock user
        if (notification.userId === MOCK_USER.uid) {
            mockNotifications.unshift(newNotification);
            saveMockNotifications(mockNotifications);
            notifyMockListeners();

            // Also show browser notification if enabled
            await this.showBrowserNotification(notification.title, {
                body: notification.message,
                tag: newNotification.id
            });

            return newNotification.id!;
        }

        // Real Firestore
        try {
            const docRef = await addDoc(collection(db, 'notifications'), {
                ...notification,
                isRead: false,
                createdAt: Timestamp.now()
            });

            // Show browser notification
            await this.showBrowserNotification(notification.title, {
                body: notification.message,
                tag: docRef.id
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    // Schedule a future notification (for milestone reminders)
    async scheduleNotification(
        notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>,
        scheduledFor: Date
    ): Promise<string> {
        const now = new Date();
        if (scheduledFor <= now) {
            // If scheduled time has passed, create immediately
            return this.createNotification(notification);
        }

        // For demo, we'll just store it and check on app load
        const scheduledNotification: Notification = {
            ...notification,
            id: `scheduled_${Date.now()}`,
            isRead: false,
            createdAt: new Date(),
            scheduledFor
        };

        if (notification.userId === MOCK_USER.uid) {
            mockNotifications.push(scheduledNotification);
            saveMockNotifications(mockNotifications);
            return scheduledNotification.id!;
        }

        // Real Firestore
        try {
            const docRef = await addDoc(collection(db, 'scheduled_notifications'), {
                ...notification,
                isRead: false,
                createdAt: Timestamp.now(),
                scheduledFor: Timestamp.fromDate(scheduledFor)
            });
            return docRef.id;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            throw error;
        }
    },

    // Get all notifications for a user
    async getNotifications(userId: string): Promise<Notification[]> {
        if (userId === MOCK_USER.uid) {
            return [...mockNotifications]
                .filter(n => !n.scheduledFor || n.scheduledFor <= new Date())
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                scheduledFor: doc.data().scheduledFor?.toDate(),
                expiresAt: doc.data().expiresAt?.toDate()
            })) as Notification[];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    // Subscribe to real-time notification updates
    subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
        // Mock listener
        if (userId === MOCK_USER.uid) {
            mockListeners.add(callback);
            // Initial callback
            const visible = mockNotifications
                .filter(n => !n.scheduledFor || n.scheduledFor <= new Date())
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            callback(visible);

            return () => {
                mockListeners.delete(callback);
            };
        }

        // Real Firestore subscription
        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    scheduledFor: doc.data().scheduledFor?.toDate(),
                    expiresAt: doc.data().expiresAt?.toDate()
                })) as Notification[];
                callback(notifications);
            }, (error) => {
                console.warn('Notification subscription error:', error);
                callback([]);
            });

            return unsubscribe;
        } catch (e) {
            console.warn('Failed to setup notification subscription:', e);
            callback([]);
            return () => {};
        }
    },

    // Mark notification as read
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        if (userId === MOCK_USER.uid) {
            const index = mockNotifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                mockNotifications[index].isRead = true;
                saveMockNotifications(mockNotifications);
                notifyMockListeners();
            }
            return;
        }

        try {
            const docRef = doc(db, 'notifications', notificationId);
            await updateDoc(docRef, { isRead: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // Mark all notifications as read
    async markAllAsRead(userId: string): Promise<void> {
        if (userId === MOCK_USER.uid) {
            mockNotifications.forEach(n => { n.isRead = true; });
            saveMockNotifications(mockNotifications);
            notifyMockListeners();
            return;
        }

        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('isRead', '==', false)
            );
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, { isRead: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    },

    // Delete a notification
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        if (userId === MOCK_USER.uid) {
            mockNotifications = mockNotifications.filter(n => n.id !== notificationId);
            saveMockNotifications(mockNotifications);
            notifyMockListeners();
            return;
        }

        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    },

    // Clear all notifications
    async clearAll(userId: string): Promise<void> {
        if (userId === MOCK_USER.uid) {
            mockNotifications = [];
            saveMockNotifications(mockNotifications);
            notifyMockListeners();
            return;
        }

        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    },

    // Get unread count
    getUnreadCount(notifications: Notification[]): number {
        return notifications.filter(n => !n.isRead).length;
    },

    // Schedule milestone reminders for a goal
    async scheduleMilestoneReminders(
        userId: string,
        goalId: string,
        goalTitle: string,
        milestones: Array<{ date: string; milestone: string }>,
        daysBefore: number = 3
    ): Promise<void> {
        const now = new Date();

        for (const milestone of milestones) {
            const milestoneDate = new Date(milestone.date);
            const reminderDate = new Date(milestoneDate);
            reminderDate.setDate(reminderDate.getDate() - daysBefore);

            // Only schedule if reminder date is in the future
            if (reminderDate > now) {
                await this.scheduleNotification({
                    userId,
                    type: 'milestone_reminder',
                    title: 'Milestone Coming Up!',
                    message: `"${milestone.milestone}" for "${goalTitle}" is due in ${daysBefore} days.`,
                    icon: '🎯',
                    actionUrl: `/plan/${goalId}`,
                    goalId
                }, reminderDate);
            }
        }
    },

    // Create a step completion reminder (daily motivation)
    async createDailyReminder(userId: string, goalTitle: string, goalId: string): Promise<void> {
        await this.createNotification({
            userId,
            type: 'step_reminder',
            title: 'Daily Progress Check',
            message: `Ready to make progress on "${goalTitle}"? Small steps lead to big changes!`,
            icon: '✨',
            actionUrl: `/plan/${goalId}`,
            goalId
        });
    },

    // Create streak alert
    async createStreakAlert(userId: string, streakDays: number): Promise<void> {
        await this.createNotification({
            userId,
            type: 'streak_alert',
            title: 'Streak at Risk!',
            message: `Your ${streakDays}-day streak is at risk! Complete a step today to keep it going.`,
            icon: '🔥'
        });
    },

    // Create achievement notification
    async createAchievementNotification(
        userId: string,
        achievementTitle: string,
        achievementDescription: string
    ): Promise<void> {
        await this.createNotification({
            userId,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `${achievementTitle} - ${achievementDescription}`,
            icon: '🏆'
        });
    }
};
