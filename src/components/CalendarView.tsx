import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, type View, type ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { GeneratedPlan } from '@/lib/gemini';

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
                    <button onClick={goToBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-[220px] text-center">{label()}</div>
                    <button onClick={goToNext} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={goToCurrent} className="text-sm font-medium text-brand-indigo hover:text-brand-purple transition-colors ml-2">
                        Today
                    </button>
                </div>

                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                    {(['month', 'week', 'day'] as View[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => toolbar.onView(v)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${toolbar.view === v
                                ? 'bg-brand-indigo text-white shadow-lg'
                                : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[600px] glass-card rounded-[2rem] p-6 text-white"
        >
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
                    className: `glass-event border border-white/20 !rounded-lg text-xs font-medium !p-1.5 hover:!bg-brand-indigo/80 transition-colors cursor-pointer ${event.type === 'milestone'
                        ? '!bg-brand-indigo/80 !border-brand-purple/50 font-bold'
                        : '!bg-slate-500/50 !border-white/10'
                        }`
                })}
            />
        </motion.div>
    );
};
