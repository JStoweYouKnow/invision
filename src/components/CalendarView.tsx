import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, type View, type ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { GeneratedPlan } from '@/lib/gemini';
import { useTheme } from '@/contexts/ThemeContext';

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: GeneratedPlan['timeline'][0] & { stepIndex?: number };
    index: number;
    type: 'milestone' | 'step';
}

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    plan: GeneratedPlan;
    onSelectEvent?: (event: GeneratedPlan['timeline'][0], index: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ plan, onSelectEvent }) => {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const { currentTheme } = useTheme();

    // Transform timeline into calendar events
    const events = plan.timeline.flatMap((item, index) => {
        // Validate milestone date
        const milestoneDate = new Date(item.date + 'T00:00:00');
        if (isNaN(milestoneDate.getTime())) return [];

        const milestoneEvent: CalendarEvent = {
            title: `🏆 ${item.milestone}`,
            start: milestoneDate,
            end: milestoneDate,
            allDay: true,
            resource: item,
            index: index,
            type: 'milestone' as const
        };

        const stepEvents = (item.steps || []).map((step, stepIndex) => {
            if (typeof step === 'object' && step.date) {
                const stepDate = new Date(step.date + 'T00:00:00');
                if (isNaN(stepDate.getTime())) return null;

                return {
                    title: `• ${step.text}`,
                    start: stepDate,
                    end: stepDate,
                    allDay: true,
                    resource: { ...item, stepIndex }, // Link back to milestone
                    index: index,
                    type: 'step'
                };
            }
            return null;
        }).filter(Boolean) as CalendarEvent[];

        return [milestoneEvent, ...stepEvents];
    });

    const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent>) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToCurrent = () => {
            toolbar.onNavigate('TODAY');
        };

        const label = () => {
            const { date, view } = toolbar;
            let labelText = '';
            if (view === 'month') {
                labelText = format(date, 'MMMM yyyy');
            } else if (view === 'week') {
                labelText = `Week of ${format(date, 'MMMM do')}`;
            } else if (view === 'day') {
                labelText = format(date, 'MMMM do, yyyy');
            }
            return (
                <span className="capitalize text-xl font-display font-medium">
                    {labelText}
                </span>
            );
        };

        return (
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goToBack}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        style={{ color: currentTheme.colors.accent }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-[220px] text-center">{label()}</div>
                    <button
                        onClick={goToNext}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        style={{ color: currentTheme.colors.accent }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToCurrent}
                        className="text-sm font-medium transition-colors ml-2 hover:opacity-80"
                        style={{ color: currentTheme.colors.primary }}
                    >
                        Today
                    </button>
                </div>

                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                    {(['month', 'week', 'day'] as View[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => toolbar.onView(v)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${toolbar.view === v
                                ? 'text-white shadow-lg'
                                : 'text-muted-foreground hover:text-white'
                                }`}
                            style={toolbar.view === v ? { backgroundColor: currentTheme.colors.primary } : undefined}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Generate dynamic CSS for the calendar based on theme
    const calendarStyles = `
        .rbc-calendar {
            color: white;
        }
        .rbc-header {
            color: ${currentTheme.colors.accent};
            font-weight: 600;
            padding: 12px 8px;
            border-bottom: 1px solid ${currentTheme.colors.accent}30 !important;
        }
        .rbc-month-view, .rbc-time-view {
            border: 1px solid ${currentTheme.colors.accent}20 !important;
            border-radius: 1rem;
            overflow: hidden;
        }
        .rbc-month-row {
            border-top: 1px solid ${currentTheme.colors.accent}15 !important;
        }
        .rbc-day-bg {
            border-left: 1px solid ${currentTheme.colors.accent}15 !important;
        }
        .rbc-day-bg + .rbc-day-bg {
            border-left: 1px solid ${currentTheme.colors.accent}15 !important;
        }
        .rbc-off-range-bg {
            background-color: ${currentTheme.colors.primary}08 !important;
        }
        .rbc-today {
            background-color: ${currentTheme.colors.primary}20 !important;
        }
        .rbc-date-cell {
            color: white;
            padding: 4px 8px;
        }
        .rbc-date-cell.rbc-off-range {
            color: rgba(255, 255, 255, 0.3);
        }
        .rbc-date-cell.rbc-now {
            color: ${currentTheme.colors.primary};
            font-weight: bold;
        }
        .rbc-event {
            background-color: ${currentTheme.colors.primary}cc !important;
        }
        .rbc-event:hover {
            background-color: ${currentTheme.colors.primary} !important;
        }
        .rbc-event-content {
            color: white;
        }
        .rbc-show-more {
            color: ${currentTheme.colors.accent};
            font-weight: 500;
        }
        .rbc-time-header-cell {
            color: ${currentTheme.colors.accent};
        }
        .rbc-time-slot {
            border-top: 1px solid ${currentTheme.colors.accent}10 !important;
        }
        .rbc-timeslot-group {
            border-bottom: 1px solid ${currentTheme.colors.accent}15 !important;
        }
        .rbc-time-content {
            border-top: 1px solid ${currentTheme.colors.accent}20 !important;
        }
        .rbc-time-gutter {
            color: ${currentTheme.colors.accent}80;
        }
        .rbc-current-time-indicator {
            background-color: ${currentTheme.colors.primary} !important;
        }
        .rbc-label {
            color: ${currentTheme.colors.accent}80;
        }
    `;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] glass-card rounded-[2rem] p-6 text-white"
        >
            <style>{calendarStyles}</style>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                date={date}
                view={view}
                onNavigate={(newDate) => setDate(newDate)}
                onView={(newView: View) => setView(newView as 'month' | 'week' | 'day')}
                views={['month', 'week', 'day']}
                components={{
                    toolbar: CustomToolbar
                }}
                onSelectEvent={(event: CalendarEvent) => {
                    if (onSelectEvent && event.resource) {
                        onSelectEvent(event.resource, event.index);
                    }
                }}
                eventPropGetter={(event: CalendarEvent) => ({
                    className: `glass-event !rounded-lg text-xs font-medium !p-1.5 transition-colors cursor-pointer ${event.type === 'milestone'
                        ? 'font-bold'
                        : ''
                        }`,
                    style: event.type === 'milestone'
                        ? {
                            backgroundColor: `${currentTheme.colors.primary}cc`,
                            borderColor: `${currentTheme.colors.accent}80`,
                            borderWidth: '1px'
                        }
                        : {
                            backgroundColor: `${currentTheme.colors.accent}40`,
                            borderColor: `${currentTheme.colors.accent}30`,
                            borderWidth: '1px'
                        }
                })}
            />
        </motion.div>
    );
};
