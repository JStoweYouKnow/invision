import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen, Video, Wrench, CheckCircle2, Check, Trophy, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedPlan } from '@/lib/gemini';

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    milestone: GeneratedPlan['timeline'][0] | null;
    milestoneIndex?: number;
    completedSteps?: Set<string>;
    onStepComplete?: (milestoneIndex: number, stepIndex: number) => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
    isOpen,
    onClose,
    milestone,
    milestoneIndex = 0,
    completedSteps = new Set(),
    onStepComplete
}) => {
    const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set());

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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70] p-4"
                    >
                        <div
                            className="border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                        >
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                                <div className="flex-1" />
                                <h3 className="font-display font-bold text-lg text-slate-900">Milestone Details</h3>
                                <div className="flex-1 flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className="p-2 rounded-full bg-slate-100 hover:bg-red-100 border border-slate-200 hover:border-red-300 transition-colors text-slate-700"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <h2 className="text-3xl font-display font-bold leading-tight transition-none opacity-100 text-black">
                                            {milestone.milestone}
                                        </h2>
                                        <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo">
                                            {format(new Date(milestone.date), 'MMMM do, yyyy')}
                                        </span>
                                    </div>

                                    <p className="text-lg leading-relaxed font-light text-black">
                                        {milestone.description}
                                    </p>

                                    {milestone.whyItMatters && (
                                        <div className="flex gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-purple-900 text-sm mb-1">Why This Matters</h4>
                                                <p className="text-purple-800 text-sm italic">{milestone.whyItMatters}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actionable Steps */}
                                {milestone.steps && milestone.steps.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-base flex items-center gap-2 text-slate-900">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                Actionable Steps
                                            </h4>
                                            <span className="text-sm font-semibold text-slate-500">
                                                {completedCount}/{totalSteps} complete
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }}
                                                className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full"
                                                transition={{ type: "spring", stiffness: 100 }}
                                            />
                                        </div>

                                        {allComplete && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200"
                                            >
                                                <Trophy className="w-6 h-6 text-green-600" />
                                                <div>
                                                    <p className="font-bold text-green-700">Milestone Complete!</p>
                                                    <p className="text-sm text-green-600">Amazing work on this milestone!</p>
                                                </div>
                                                <Sparkles className="w-5 h-5 text-green-500 ml-auto" />
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
                                                        className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${completed
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-slate-50 border-slate-100 hover:border-brand-indigo/30 hover:bg-brand-indigo/5'
                                                            }`}
                                                        onClick={() => handleStepClick(idx)}
                                                    >
                                                        <div
                                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${completed
                                                                ? 'bg-green-500 border-green-500'
                                                                : 'bg-white border-slate-300 hover:border-brand-indigo'
                                                                }`}
                                                            style={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
                                                        >
                                                            {completed ? (
                                                                <Check className="w-4 h-4 text-white" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex justify-between items-start">
                                                                    <p
                                                                        className={`text-sm font-medium ${completed ? 'text-green-700 line-through' : 'text-slate-800'} text-justify`}
                                                                        style={{ textAlign: 'justify' }}
                                                                    >
                                                                        {stepText}
                                                                    </p>
                                                                    {stepDate && (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                                                            {new Date(stepDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {stepHabit && (
                                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md w-fit">
                                                                        <span className="font-bold text-brand-indigo">Habit:</span> {stepHabit}
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
                                                                    className="inline-flex items-center gap-2 mt-2 text-xs text-brand-purple hover:underline"
                                                                >
                                                                    {getIconForType(milestone.resources![idx].type)}
                                                                    <span>{milestone.resources![idx].title}</span>
                                                                    <ExternalLink className="w-3 h-3" />
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
                                    <div className="space-y-4 pt-4 border-t border-slate-200">
                                        <h4 className="font-bold text-base flex items-center gap-2 text-slate-900">
                                            <ExternalLink className="w-4 h-4 text-brand-purple" />
                                            Recommended Resources
                                        </h4>
                                        <div className="grid gap-3">
                                            {milestone.resources.map((resource, idx) => (
                                                <a
                                                    key={idx}
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-indigo/30 hover:bg-brand-indigo/5 transition-all group"
                                                >
                                                    <div className="p-2.5 rounded-lg bg-white shadow-sm text-brand-indigo group-hover:scale-110 transition-transform flex-shrink-0">
                                                        {getIconForType(resource.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-base truncate group-hover:text-brand-indigo transition-colors capitalize text-slate-800">
                                                            {resource.title}
                                                        </div>
                                                        <div className="text-sm truncate text-slate-500">
                                                            {(() => { try { return new URL(resource.url).hostname; } catch { return resource.url; } })()}
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-brand-indigo flex-shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
