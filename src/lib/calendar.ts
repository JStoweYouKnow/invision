import type { GeneratedPlan } from "./gemini";

/**
 * Generates a unique identifier for iCal events
 */
function generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@invision.app`;
}

/**
 * Escapes special characters in iCal text fields
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Formats a date string (YYYY-MM-DD) to iCal all-day format (YYYYMMDD)
 */
function formatICalDate(dateString: string): string {
    return dateString.replace(/-/g, '');
}

/**
 * Gets the next day for iCal DTEND (required for all-day events)
 */
function getNextDay(dateString: string): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Generates iCal/ICS file content from a plan
 */
function generateICalContent(plan: GeneratedPlan): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//InVision//Vision Board App//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:InVision - ${escapeICalText(plan.title)}`,
    ].join('\r\n');

    for (const item of plan.timeline) {
        const event = [
            '',
            'BEGIN:VEVENT',
            `UID:${generateUID()}`,
            `DTSTAMP:${now}`,
            `DTSTART;VALUE=DATE:${formatICalDate(item.date)}`,
            `DTEND;VALUE=DATE:${getNextDay(item.date)}`,
            `SUMMARY:InVision: ${escapeICalText(item.milestone)}`,
            `DESCRIPTION:${escapeICalText(item.description)}\\n\\nPart of goal: ${escapeICalText(plan.title)}`,
            'STATUS:CONFIRMED',
            'TRANSP:TRANSPARENT',
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:Reminder: ${escapeICalText(item.milestone)}`,
            'TRIGGER:-P1D',
            'END:VALARM',
            'END:VEVENT',
        ].join('\r\n');

        icsContent += event;
    }

    icsContent += '\r\nEND:VCALENDAR';

    return icsContent;
}

export const calendarService = {
    /**
     * Exports the plan as an iCal (.ics) file for download.
     * Works with Apple Calendar, Outlook, Google Calendar, and any iCal-compatible app.
     */
    exportToICS(plan: GeneratedPlan, goalTitle?: string): void {
        const icsContent = generateICalContent(plan);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Create a sanitized filename from the goal title
        const filename = goalTitle
            ? `invision-${goalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.ics`
            : 'invision-milestones.ics';

        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(url);
    }
};
