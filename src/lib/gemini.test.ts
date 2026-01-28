
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from './gemini';

// Mock the Google Generative AI SDK using vi.hoisted to prevent ReferenceError
const { mockGenerateContent, mockStartChat } = vi.hoisted(() => {
    return {
        mockGenerateContent: vi.fn(),
        mockStartChat: vi.fn(),
    };
});

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel = vi.fn().mockReturnValue({
                generateContent: mockGenerateContent,
                startChat: mockStartChat,
            });
        },
    };
});

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate a plan successfully', async () => {
        // Mock response
        const mockPlan = {
            title: 'Test Plan',
            description: 'A test plan description',
            timeline: []
        };

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockPlan)
            }
        });

        const result = await geminiService.generatePlan('Learn to code');

        expect(result).toEqual(mockPlan);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid JSON response gracefully', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => "I am not a JSON object"
            }
        });

        await expect(geminiService.generatePlan('Fail please')).rejects.toThrow("AI response was not valid JSON");
    });
});
