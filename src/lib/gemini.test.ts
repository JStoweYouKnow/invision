
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from './gemini';
import type { GeneratedPlan, JourneySynthesis } from './gemini';

// Mock the Google Generative AI SDK using vi.hoisted to prevent ReferenceError
const { mockGenerateContent, mockStartChat, mockSendMessage } = vi.hoisted(() => {
    return {
        mockGenerateContent: vi.fn(),
        mockStartChat: vi.fn(),
        mockSendMessage: vi.fn(),
    };
});

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel = vi.fn().mockReturnValue({
                generateContent: mockGenerateContent,
                startChat: mockStartChat.mockReturnValue({
                    sendMessage: mockSendMessage,
                }),
            });
        },
        SchemaType: {
            STRING: 'STRING',
            NUMBER: 'NUMBER',
            INTEGER: 'INTEGER',
            BOOLEAN: 'BOOLEAN',
            ARRAY: 'ARRAY',
            OBJECT: 'OBJECT',
        },
        FunctionCallingMode: {
            AUTO: 'AUTO',
        },
    };
});

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models = {
                generateContent: vi.fn().mockResolvedValue({
                    text: '{"result": "test"}',
                }),
            };
        },
    };
});

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generatePlan', () => {
        it('should generate a plan successfully', async () => {
            const mockPlan: GeneratedPlan = {
                title: 'Test Plan',
                description: 'A test plan description',
                timeline: [
                    {
                        date: '2025-06-01',
                        milestone: 'Start',
                        description: 'Begin the journey',
                        steps: [{ text: 'Step 1', date: '2025-06-01' }],
                    },
                ],
                sources: [],
            };

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify(mockPlan),
                },
            });

            const result = await geminiService.generatePlan('Learn to code');

            expect(result).toEqual(mockPlan);
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid JSON response gracefully', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'I am not a JSON object',
                },
            });

            await expect(geminiService.generatePlan('Fail please')).rejects.toThrow();
        });

        it('should accept optional timeline and wormhole parameters', async () => {
            const mockPlan: GeneratedPlan = {
                title: 'Wormhole Goal',
                description: 'An AI-generated goal',
                visionaryDescription: 'You are standing on Mars...',
                timeline: [],
                sources: [],
            };

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify(mockPlan),
                },
            });

            const result = await geminiService.generatePlan('surprise me', '5 years', undefined, true);
            expect(result.title).toBe('Wormhole Goal');
            expect(result.visionaryDescription).toBeDefined();
        });
    });

    describe('generateJournalPrompt', () => {
        it('should generate a journal prompt from goal context', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'What specific challenge did you overcome today?',
                },
            });

            const result = await geminiService.generateJournalPrompt(
                'Learn piano',
                'Complete beginner course',
                ['I practiced scales today']
            );

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should work without previous entries', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'What inspired you to start this journey?',
                },
            });

            const result = await geminiService.generateJournalPrompt(
                'Run a marathon',
                'First 5K'
            );

            expect(typeof result).toBe('string');
        });
    });

    describe('generateJournalReflection', () => {
        it('should generate a supportive reflection', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'That sounds like real progress! Keep it up.',
                },
            });

            const result = await geminiService.generateJournalReflection(
                'Run a marathon',
                'First 5K',
                'I ran 3 miles without stopping!',
                'excited'
            );

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('interface types', () => {
        it('GeneratedPlan should support all required fields', () => {
            const plan: GeneratedPlan = {
                title: 'Test',
                description: 'Test desc',
                timeline: [],
                sources: [],
            };
            expect(plan.title).toBeDefined();
            expect(plan.timeline).toBeInstanceOf(Array);
        });

        it('GeneratedPlan should support optional fields', () => {
            const plan: GeneratedPlan = {
                title: 'Test',
                description: 'Test desc',
                visionaryDescription: 'You feel the warmth...',
                timeline: [
                    {
                        date: '2025-06-01',
                        milestone: 'Start',
                        description: 'Begin',
                        whyItMatters: 'Foundation of everything',
                        steps: [
                            { text: 'Step 1', date: '2025-06-01', habit: '15 min daily' },
                        ],
                        isCompleted: false,
                        resources: [
                            { title: 'Guide', url: 'https://example.com', type: 'article' },
                        ],
                    },
                ],
                sources: [{ title: 'Source', url: 'https://example.com' }],
            };
            expect(plan.visionaryDescription).toBeDefined();
            expect(plan.timeline[0].whyItMatters).toBeDefined();
            expect(plan.timeline[0].steps[0].habit).toBeDefined();
            expect(plan.timeline[0].resources).toHaveLength(1);
        });

        it('JourneySynthesis should support all required fields', () => {
            const synthesis: JourneySynthesis = {
                overallNarrative: 'Your journey shows...',
                patterns: [
                    { title: 'Consistency', description: 'You show up daily', type: 'strength' },
                ],
                crossGoalConnections: [
                    { goals: ['Fitness', 'Mental Health'], insight: 'Exercise boosts mood' },
                ],
                nextBestAction: 'Focus on your nutrition milestone',
                motivationalReframe: 'You are building compound interest in yourself',
            };
            expect(synthesis.patterns).toHaveLength(1);
            expect(synthesis.crossGoalConnections[0].goals).toHaveLength(2);
            expect(synthesis.nextBestAction).toBeTruthy();
        });
    });
});
