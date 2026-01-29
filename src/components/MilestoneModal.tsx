import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen, Video, Wrench, CheckCircle2, Check, Trophy, Sparkles, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedPlan } from '@/lib/gemini';
import { JournalEditor } from './JournalEditor';
import { JournalTimeline, JournalBadge } from './JournalTimeline';
import { firestoreService, type JournalEntry } from '@/lib/firestore';

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    milestone: GeneratedPlan['timeline'][0] | null;
    milestoneIndex?: number;
    completedSteps?: Set<string>;
    onStepComplete?: (milestoneIndex: number, stepIndex: number) => void;
    goalId?: string;
    goalTitle?: string;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
    isOpen,
    onClose,
    milestone,
    milestoneIndex = 0,
    completedSteps = new Set(),
    onStepComplete,
    goalId,
    goalTitle
}) => {
    const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set());
    const [showJournalEditor, setShowJournalEditor] = useState(false);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | undefined>();

    // Fetch journal entries when modal opens
    useEffect(() => {
        if (isOpen && goalId) {
            firestoreService.getJournalEntriesForMilestone(goalId, milestoneIndex)
                .then(entries => setJournalEntries(entries))
                .catch(console.error);
        }
    }, [isOpen, goalId, milestoneIndex]);

    if (!milestone) return null;

    const isStepCompleted = (stepIndex: number) => {
        if (onStepComplete) {
            return completedSteps.has(`${milestoneIndex}-${stepIndex}`);
        }
        return localCompleted.has(stepIndex);
    };

    const handleStepClick = (stepIndex: number) => {
        if (onStepComplete) {
            onStepComplete(milestoneIndex, stepIndex);
        } else {
            const newLocal = new Set(localCompleted);
            if (newLocal.has(stepIndex)) {
                newLocal.delete(stepIndex);
            } else {
                newLocal.add(stepIndex);
            }
            setLocalCompleted(newLocal);
        }
    };

    const completedCount = milestone.steps?.filter((_, idx) => isStepCompleted(idx)).length || 0;
    const totalSteps = milestone.steps?.length || 0;
    const allComplete = totalSteps > 0 && completedCount === totalSteps;

    const getIconForType = (type?: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'tool': return <Wrench className="w-4 h-4" />;
            default: return <BookOpen className="w-4 h-4" />;
        }
    };

    return typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[700px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full pointer-events-auto"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                        >
                            {showJournalEditor && goalId && goalTitle ? (
                                <JournalEditor
                                    isOpen={showJournalEditor}
                                    onClose={() => {
                                        setShowJournalEditor(false);
                                        setSelectedJournalEntry(undefined);
                                    }}
                                    goalId={goalId}
                                    goalTitle={goalTitle}
                                    milestoneName={milestone.milestone}
                                    milestoneIndex={milestoneIndex}
                                    existingEntry={selectedJournalEntry}
                                    onSave={(entry) => {
                                        if (selectedJournalEntry) {
                                            // Update existing entry
                                            setJournalEntries(prev =>
                                                prev.map(e => e.id === entry.id ? entry : e)
                                            );
                                        } else {
                                            // Add new entry
                                            setJournalEntries(prev => [entry, ...prev]);
                                        }
                                    }}
                                    isEmbedded={true}
                                />
                            ) : (
                                <>
                                    {/* Header with Close Button */}
                                    <div className="flex items-center justify-between p-8 pb-4 flex-shrink-0">
                                        <div className="flex-1" />
                                        <h3 className="font-display font-bold text-lg text-slate-900 opacity-0">Details</h3>
                                        <div className="flex-1 flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClose();
                                                }}
                                                className="p-2 rounded-full bg-slate-100 hover:bg-red-100 border border-slate-200 hover:border-red-300 transition-colors text-slate-700 hover:text-red-600"
                                                aria-label="Close modal"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8">
                                        <div className="space-y-6">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <h2 className="text-2xl font-display font-bold leading-tight text-slate-900">
                                                    {milestone.milestone}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo bg-indigo-50 px-3 py-1 rounded-full">
                                                        {format(new Date(milestone.date), 'MMMM do, yyyy')}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-lg leading-relaxed font-medium text-slate-600 text-center max-w-xl mx-auto">
                                                {milestone.description}
                                            </p>

                                            {milestone.whyItMatters && (
                                                <div className="flex gap-4 p-5 bg-purple-50 rounded-2xl border border-purple-100">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm h-fit">
                                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-purple-900 text-sm mb-1 uppercase tracking-wide">Why This Matters</h4>
                                                        <p className="text-purple-800 text-base italic leading-relaxed">"{milestone.whyItMatters}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actionable Steps */}
                                        {milestone.steps && milestone.steps.length > 0 && (
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between px-1">
                                                    <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                                        <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                        Action Plan
                                                    </h4>
                                                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                        {completedCount}/{totalSteps} complete
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }}
                                                        className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full shadow-[0_2px_10px_rgba(168,85,247,0.3)]"
                                                        transition={{ type: "spring", stiffness: 100 }}
                                                    />
                                                </div>

                                                {allComplete && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm"
                                                    >
                                                        <div className="p-3 bg-white rounded-full shadow-sm text-green-600">
                                                            <Trophy className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-green-800 text-lg">Milestone Complete!</p>
                                                            <p className="text-sm text-green-700 font-medium">Amazing work crushing this goal!</p>
                                                        </div>
                                                        <Sparkles className="w-6 h-6 text-green-500 ml-auto animate-pulse" />
                                                    </motion.div>
                                                )}

                                                <div className="space-y-3">
                                                    {milestone.steps.map((step, idx) => {
                                                        const completed = isStepCompleted(idx);
                                                        const hasResource = milestone.resources && milestone.resources[idx];
                                                        const stepText = typeof step === 'string' ? step : step.text;
                                                        const stepDate = typeof step !== 'string' ? step.date : undefined;
                                                        const stepHabit = typeof step !== 'string' ? step.habit : undefined;

                                                        return (
                                                            <motion.div
                                                                key={idx}
                                                                whileHover={{ scale: 1.01 }}
                                                                whileTap={{ scale: 0.99 }}
                                                                className={`flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all shadow-sm group ${completed
                                                                    ? 'bg-green-50/50 border-green-200'
                                                                    : 'bg-white border-slate-200 hover:border-brand-purple/40 hover:shadow-md hover:shadow-brand-purple/5'
                                                                    }`}
                                                                onClick={() => handleStepClick(idx)}
                                                            >
                                                                <div
                                                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${completed
                                                                        ? 'bg-green-500 border-green-500 scale-110'
                                                                        : 'bg-white border-slate-200 group-hover:border-brand-purple text-slate-400 group-hover:text-brand-purple'
                                                                        }`}
                                                                >
                                                                    {completed ? (
                                                                        <Check className="w-5 h-5 text-white" />
                                                                    ) : (
                                                                        <span className="text-sm font-bold">{idx + 1}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pt-1">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="flex justify-between items-start gap-4">
                                                                            <p
                                                                                className={`text-base font-medium leading-normal ${completed ? 'text-green-800 line-through opacity-70' : 'text-slate-800'}`}
                                                                            >
                                                                                {stepText}
                                                                            </p>
                                                                            {stepDate && (
                                                                                <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded-md whitespace-nowrap">
                                                                                    {new Date(stepDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {stepHabit && (
                                                                            <div className="flex items-center mt-1 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-fit border border-slate-100">
                                                                                <span className="font-bold text-brand-indigo uppercase tracking-wider text-[10px] mr-3">Habit</span>
                                                                                <span className="font-medium text-slate-700">{stepHabit}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* Linked Resource */}
                                                                    {hasResource && (
                                                                        <a
                                                                            href={milestone.resources![idx].url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="inline-flex items-center gap-2 mt-3 text-sm font-bold !text-black hover:text-slate-700 hover:underline bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-all"
                                                                            style={{ color: 'black' }}
                                                                        >
                                                                            {getIconForType(milestone.resources![idx].type)}
                                                                            <span>Open Resource</span>
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {milestone.resources && milestone.resources.length > 0 && (
                                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                                <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </div>
                                                    Curated Resources
                                                </h4>
                                                <div className="grid gap-3">
                                                    {milestone.resources.map((resource, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-indigo/30 hover:bg-white hover:shadow-md hover:shadow-brand-indigo/5 transition-all group"
                                                        >

                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-base truncate group-hover:text-brand-indigo transition-colors capitalize !text-black" style={{ color: 'black' }}>
                                                                    {resource.title}
                                                                </div>
                                                                <div className="text-sm truncate !text-slate-700" style={{ color: '#334155' }}>
                                                                    {(() => { try { return new URL(resource.url).hostname; } catch { return resource.url; } })()}
                                                                </div>
                                                            </div>

                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {goalId && (
                                            <div className="space-y-5 pt-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                                        <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                                                            <PenLine className="w-5 h-5" />
                                                        </div>
                                                        Reflections
                                                        {journalEntries.length > 0 && (
                                                            <JournalBadge count={journalEntries.length} />
                                                        )}
                                                    </h4>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJournalEntry(undefined);
                                                            setShowJournalEditor(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-purple hover:bg-brand-purple/90 rounded-full transition-all shadow-md shadow-brand-purple/20 hover:scale-105 active:scale-95"
                                                    >
                                                        <PenLine className="w-4 h-4" />
                                                        New Entry
                                                    </button>
                                                </div>

                                                {journalEntries.length > 0 ? (
                                                    <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                                                        <JournalTimeline
                                                            entries={journalEntries}
                                                            compact
                                                            onEntryClick={(entry) => {
                                                                setSelectedJournalEntry(entry);
                                                                setShowJournalEditor(true);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 group hover:border-brand-purple/30 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedJournalEntry(undefined);
                                                            setShowJournalEditor(true);
                                                        }}
                                                    >
                                                        <div className="p-3 bg-white rounded-full shadow-sm w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                            <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-brand-purple" />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600">No journal entries yet</p>
                                                        <p className="text-xs text-slate-400 mt-1">Capture your thoughts on this milestone</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>


                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null;
};
