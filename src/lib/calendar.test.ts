import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calendarService } from './calendar';
import type { GeneratedPlan } from './gemini';

describe('calendarService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('exportToICS', () => {
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

        // Mock DOM methods for download
        let createdLink: HTMLAnchorElement;
        let clickSpy: ReturnType<typeof vi.fn>;
        let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
        let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            clickSpy = vi.fn();
            createdLink = {
                href: '',
                download: '',
                click: clickSpy,
            } as unknown as HTMLAnchorElement;

            vi.spyOn(document, 'createElement').mockReturnValue(createdLink);
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => createdLink);
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => createdLink);

            createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
            revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        });

        it('should trigger a file download', () => {
            calendarService.exportToICS(mockPlan, 'Learn Piano');

            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(clickSpy).toHaveBeenCalled();
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
        });

        it('should create a sanitized filename from goal title', () => {
            calendarService.exportToICS(mockPlan, 'Learn Piano & Guitar!');

            expect(createdLink.download).toBe('invision-learn-piano-guitar-.ics');
        });

        it('should use default filename when no title provided', () => {
            calendarService.exportToICS(mockPlan);

            expect(createdLink.download).toBe('invision-milestones.ics');
        });

        it('should create a Blob with correct MIME type', () => {
            calendarService.exportToICS(mockPlan, 'Test');

            const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blobArg.type).toBe('text/calendar;charset=utf-8');
        });
    });
});
