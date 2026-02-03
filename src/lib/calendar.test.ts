import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calendarService } from './calendar';
import type { GeneratedPlan } from './gemini';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
    GoogleAuthProvider: {
        credentialFromResult: vi.fn(() => ({ accessToken: 'mock-access-token' })),
    },
    signInWithPopup: vi.fn(),
}));

vi.mock('./firebase', () => ({
    auth: {},
    googleProvider: {
        setCustomParameters: vi.fn(),
    },
}));

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('calendarService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('syncToCalendar', () => {
        const mockPlan: GeneratedPlan = {
            title: 'Learn Piano',
            description: 'A journey to become a pianist',
            timeline: [
                {
                    date: '2025-03-01',
                    milestone: 'Start Basic Lessons',
                    description: 'Begin learning fundamentals',
                    steps: [
                        { text: 'Buy a keyboard', date: '2025-02-25' },
                        { text: 'Find a teacher', date: '2025-02-28' },
                    ],
                },
                {
                    date: '2025-06-01',
                    milestone: 'Complete Beginner Course',
                    description: 'Finish beginner curriculum',
                    steps: [
                        { text: 'Practice scales daily', date: '2025-04-15', habit: '30 min/day' },
                    ],
                },
            ],
            sources: [],
        };

        it('should create calendar events for each milestone', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ id: 'event-123' }),
            });

            const count = await calendarService.syncToCalendar(mockPlan, 'mock-token');

            expect(count).toBe(2);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should format events correctly', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ id: 'event-123' }),
            });

            await calendarService.syncToCalendar(mockPlan, 'mock-token');

            // Check first call
            const firstCall = mockFetch.mock.calls[0];
            const body = JSON.parse(firstCall[1].body);

            expect(body.summary).toBe('InVision: Start Basic Lessons');
            expect(body.description).toContain('Learn Piano');
            expect(body.start.date).toBe('2025-03-01');
            expect(body.reminders.overrides).toHaveLength(2);
        });

        it('should handle API failures gracefully', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    text: () => Promise.resolve('API Error'),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'event-456' }),
                });

            const count = await calendarService.syncToCalendar(mockPlan, 'mock-token');

            // Only second event should succeed
            expect(count).toBe(1);
        });

        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const count = await calendarService.syncToCalendar(mockPlan, 'mock-token');

            expect(count).toBe(0);
        });

        it('should use correct authorization header', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await calendarService.syncToCalendar(mockPlan, 'my-access-token');

            const headers = mockFetch.mock.calls[0][1].headers;
            expect(headers.Authorization).toBe('Bearer my-access-token');
        });
    });

    describe('Event Structure', () => {
        it('should create all-day events', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            const plan: GeneratedPlan = {
                title: 'Test',
                description: 'Test plan',
                timeline: [
                    {
                        date: '2025-05-15',
                        milestone: 'Test Milestone',
                        description: 'Test description',
                        steps: [],
                    },
                ],
                sources: [],
            };

            await calendarService.syncToCalendar(plan, 'token');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);

            // All-day events use 'date' not 'dateTime'
            expect(body.start.date).toBeDefined();
            expect(body.start.dateTime).toBeUndefined();
            expect(body.end.date).toBeDefined();
        });
    });
});
