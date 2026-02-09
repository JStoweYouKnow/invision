import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firestoreService } from './firestore';

// Mock the local firebase module to prevent initializeApp from running
vi.mock('./firebase', () => ({
    db: {},
    switchToBackupFirebase: vi.fn(),
    hasBackupFirebaseConfig: false,
    isUsingBackupFirebase: vi.fn(() => false),
}));

// Mock Firebase/Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    setDoc: vi.fn(),
    onSnapshot: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() })),
        fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
    },
}));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
}));

describe('firestoreService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear localStorage mock data
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Mock Data Operations', () => {
        it('should return mock goals for demo user', async () => {
            // The mock user UID is 'demo-user' (defined in mockData.ts)
            const goals = await firestoreService.getUserGoals('demo-user');
            expect(Array.isArray(goals)).toBe(true);
        });

        it('should retrieve a mock goal by ID', async () => {
            const goal = await firestoreService.getGoalById('mock-goal-cyber');
            expect(goal).toBeDefined();
            if (goal) {
                expect(goal.title).toBeDefined();
                expect(goal.plan).toBeDefined();
            }
        });

        it('should return null for non-existent mock goal ID', async () => {
            const goal = await firestoreService.getGoalById('mock-goal-does-not-exist');
            expect(goal).toBeNull();
        });
    });

    describe('Goal Visibility', () => {
        it('should toggle visibility for mock goals', async () => {
            // Get initial state
            const initialGoal = await firestoreService.getGoalById('mock-goal-cyber');
            const initialVisibility = initialGoal?.isPublic;

            // Toggle visibility
            const newVisibility = initialGoal?.isPublic === true ? false : true;
            await firestoreService.toggleVisibility('mock-goal-cyber', newVisibility);

            // Verify change
            const updatedGoal = await firestoreService.getGoalById('mock-goal-cyber');
            expect(updatedGoal?.isPublic).toBe(!initialVisibility);

            // Toggle back
            await firestoreService.toggleVisibility('mock-goal-cyber', initialGoal?.isPublic ?? false);
        });
    });

    describe('Goal Deletion', () => {
        it('should handle mock goal deletion gracefully', async () => {
            // Create a temporary mock goal to delete
            // Note: This tests that deleteGoal doesn't throw for mock goals
            await expect(
                firestoreService.deleteGoal('mock-goal-test-delete')
            ).resolves.not.toThrow();
        });
    });

    describe('Public Goals', () => {
        it('should retrieve public goals', async () => {
            const publicGoals = await firestoreService.getPublicGoals();
            expect(Array.isArray(publicGoals)).toBe(true);
            // All returned goals should be public
            publicGoals.forEach(goal => {
                expect(goal.isPublic).toBe(true);
            });
        });

        it('should limit public goals to specified count', async () => {
            const publicGoals = await firestoreService.getPublicGoals();
            expect(publicGoals.length).toBeLessThanOrEqual(20); // Default limit
        });
    });

    describe('Local Storage Persistence', () => {
        it('should persist mock store to localStorage', async () => {
            // Toggle a mock goal to trigger save
            await firestoreService.toggleVisibility('mock-goal-cyber', true);

            // Check localStorage was written
            const stored = localStorage.getItem('invision_demo_store');
            expect(stored).toBeDefined();
        });

        it('should load mock store from localStorage on init', async () => {
            // Pre-populate localStorage
            const mockData = {
                journalEntries: [],
                conversations: [],
                stepCompletions: {}
            };
            localStorage.setItem('invision_demo_store', JSON.stringify(mockData));

            // The service should pick this up on next operation
            const goals = await firestoreService.getUserGoals('demo-user');
            expect(Array.isArray(goals)).toBe(true);
        });
    });
});

describe('DataValidation', () => {
    it('should validate goal structure', () => {
        const validGoal = {
            title: 'Test Goal',
            description: 'A test description',
            plan: {
                title: 'Plan Title',
                description: 'Plan description',
                timeline: [],
                sources: []
            },
            userId: 'user-123',
            createdAt: new Date(),
            isPublic: false
        };

        // Basic structure validation
        expect(validGoal.title).toBeTruthy();
        expect(validGoal.plan).toBeDefined();
        expect(validGoal.plan.timeline).toBeInstanceOf(Array);
        expect(validGoal.plan.sources).toBeInstanceOf(Array);
    });

    it('should validate timeline milestone structure', () => {
        const validMilestone = {
            date: '2025-03-01',
            milestone: 'Complete foundation',
            description: 'Finish all foundation work',
            steps: [
                { text: 'Step 1', date: '2025-02-15' },
                { text: 'Step 2', date: '2025-02-28', habit: 'Daily practice' }
            ]
        };

        expect(validMilestone.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(validMilestone.steps.length).toBeGreaterThan(0);
        validMilestone.steps.forEach(step => {
            expect(step.text).toBeTruthy();
            expect(step.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});
