import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import type { JournalEntry, JournalMood } from '@/lib/firestore';

interface JournalTimelineProps {
    entries: JournalEntry[];
    onEntryClick?: (entry: JournalEntry) => void;
    compact?: boolean;
}

const moodConfig: Record<JournalMood, { emoji: string; bg: string; border: string }> = {
    great: { emoji: '🌟', bg: 'bg-amber-50', border: 'border-amber-200' },
    good: { emoji: '😊', bg: 'bg-green-50', border: 'border-green-200' },
    neutral: { emoji: '😐', bg: 'bg-slate-50', border: 'border-slate-200' },
    struggling: { emoji: '😔', bg: 'bg-blue-50', border: 'border-blue-200' },
    frustrated: { emoji: '😤', bg: 'bg-red-50', border: 'border-red-200' }
};

export const JournalTimeline: React.FC<JournalTimelineProps> = ({
    entries,
    onEntryClick,
    compact = false
}) => {
    if (entries.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No journal entries yet</p>
                <p className="text-sm text-slate-400 mt-1">Start reflecting on your journey</p>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="space-y-2">
                {entries.slice(0, 3).map((entry, index) => {
                    const mood = moodConfig[entry.mood || 'neutral'];
                    return (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onEntryClick?.(entry)}
                            className={`flex items-center gap-3 p-3 rounded-xl ${mood.bg} border ${mood.border} cursor-pointer hover:shadow-sm transition-all group`}
                        >
                            <span className="text-lg shrink-0">{mood.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 line-clamp-1">{entry.content}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {entry.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </motion.div>
                    );
                })}
                {entries.length > 3 && (
                    <p className="text-xs text-slate-400 text-center pt-1">
                        +{entries.length - 3} more entries
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry, index) => {
                const mood = moodConfig[entry.mood || 'neutral'];
                return (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onEntryClick?.(entry)}
                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-purple/30 hover:shadow-lg transition-all cursor-pointer group"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${mood.bg} border ${mood.border} flex items-center justify-center`}>
                                    <span className="text-xl">{mood.emoji}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        {entry.createdAt.toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                                        Feeling {entry.mood || 'neutral'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-purple group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Content Preview */}
                        <p className="text-slate-700 text-sm leading-relaxed line-clamp-3 mb-3">
                            {entry.content}
                        </p>

                        {/* AI Reflection */}
                        {entry.aiReflection && (
                            <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                                <Sparkles className="w-4 h-4 text-brand-purple mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                    {entry.aiReflection}
                                </p>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

// Mini badge to show journal count on milestones
export const JournalBadge: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null;

    return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-brand-purple rounded-full text-xs font-medium">
            <BookOpen className="w-3 h-3" />
            {count}
        </div>
    );
};
