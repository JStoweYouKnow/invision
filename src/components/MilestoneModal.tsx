import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen, Video, Wrench, CheckCircle2, Check, Trophy, Sparkles, PenLine, Calendar, History, ChevronDown, ChevronUp, Camera, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { geminiService, type GeneratedPlan } from '@/lib/gemini';
import { JournalEditor } from './JournalEditor';
import { JournalTimeline, JournalBadge } from './JournalTimeline';
import { firestoreService, type JournalEntry } from '@/lib/firestore';
import { DateChangeReflectionModal } from './DateChangeReflectionModal';
import type { DateChange, DateChangeReason, DateChangeType, StepChange } from '@/types';
import { Save } from 'lucide-react';

// Step type from GeneratedPlan
type StepType = { text: string; date: string; habit?: string };

// Extended milestone type with date history
type MilestoneWithHistory = GeneratedPlan['timeline'][0] & {
    dateHistory?: DateChange[];
    stepHistory?: StepChange[];
};

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    milestone: MilestoneWithHistory | null;
    milestoneIndex?: number;
    completedSteps?: Set<string>;
    onStepComplete?: (milestoneIndex: number, stepIndex: number) => void;
    onDateChange?: (milestoneIndex: number, newDate: string, change: DateChange) => void;
    onStepsChange?: (milestoneIndex: number, steps: StepType[], changes: StepChange[]) => void;
    goalId?: string;
    goalTitle?: string;
    isReadOnly?: boolean;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
    isOpen,
    onClose,
    milestone,
    milestoneIndex = 0,
    completedSteps = new Set(),
    onStepComplete,
    onDateChange,
    onStepsChange,
    goalId,
    goalTitle,
    isReadOnly = false
}) => {
    const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set());
    const [showJournalEditor, setShowJournalEditor] = useState(false);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | undefined>();

    // Date editing state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [proposedDate, setProposedDate] = useState<string>('');
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [showDateHistory, setShowDateHistory] = useState(false);

    // Step editing state
    const [isEditingSteps, setIsEditingSteps] = useState(false);
    const [editableSteps, setEditableSteps] = useState<StepType[]>([]);
    const [pendingStepChanges, setPendingStepChanges] = useState<StepChange[]>([]);

    // Progress check-in state
    const [progressPhoto, setProgressPhoto] = useState<string | null>(null);
    const [progressAnalysis, setProgressAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const progressFileRef = useRef<HTMLInputElement>(null);

    // Grounded resources state
    const [groundedResources, setGroundedResources] = useState<{ title: string; url: string; type?: 'article' | 'video' | 'tool' }[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(false);


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
        // Don't allow step completion in read-only mode
        if (isReadOnly) return;

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

    // Initialize editable steps when entering edit mode
    const startEditingSteps = () => {
        if (!milestone?.steps) return;
        const steps = milestone.steps.map(step =>
            typeof step === 'string'
                ? { text: step, date: '', habit: '' }
                : { text: step.text, date: step.date || '', habit: step.habit || '' }
        );
        setEditableSteps(steps);
        setPendingStepChanges([]);
        setIsEditingSteps(true);
    };

    // Cancel editing and reset state
    const cancelEditingSteps = () => {
        setIsEditingSteps(false);
        setEditableSteps([]);
        setPendingStepChanges([]);

    };

    // Update a step date
    const updateStepDate = (index: number, date: string) => {
        const newSteps = [...editableSteps];
        const oldStep = { ...newSteps[index] };
        newSteps[index] = { ...newSteps[index], date };
        setEditableSteps(newSteps);

        // Track the change
        const change: StepChange = {
            id: `step-change-${Date.now()}-${index}`,
            changeType: 'edit',
            changedAt: Date.now(),
            stepIndex: index,
            previousValue: { date: oldStep.date },
            newValue: { date }
        };
        setPendingStepChanges(prev => [...prev, change]);
    };

    // Save step changes
    const saveStepChanges = () => {
        if (!onStepsChange || pendingStepChanges.length === 0) {
            cancelEditingSteps();
            return;
        }

        onStepsChange(milestoneIndex, editableSteps, pendingStepChanges);
        setIsEditingSteps(false);
        setEditableSteps([]);
        setPendingStepChanges([]);

    };

    // Handle progress photo upload and analysis
    const handleProgressPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !milestone) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            setProgressPhoto(dataUri);
            setIsAnalyzing(true);
            setProgressAnalysis(null);

            try {
                const analysis = await geminiService.analyzeProgressPhoto(
                    goalTitle || '',
                    milestone.milestone,
                    dataUri,
                    milestone.description
                );
                setProgressAnalysis(analysis);
            } catch {
                setProgressAnalysis("Great job documenting your progress! Visual check-ins help you see how far you've come.");
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Fetch grounded resources via Google Search
    const fetchGroundedResources = async () => {
        if (!milestone || !goalTitle) return;
        setIsLoadingResources(true);
        try {
            const resources = await geminiService.getGroundedResources(goalTitle, milestone.milestone);
            setGroundedResources(resources);
        } catch {
            setGroundedResources([]);
        } finally {
            setIsLoadingResources(false);
        }
    };

    // Handle date change confirmation from reflection modal
    const handleDateChangeConfirm = (reason: DateChangeReason, explanation: string, changeType: DateChangeType) => {
        if (!milestone || !onDateChange || !proposedDate) return;

        const currentDateObj = new Date(milestone.date + 'T00:00:00');
        const proposedDateObj = new Date(proposedDate + 'T00:00:00');
        const daysDiff = Math.round((proposedDateObj.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));

        const dateChange: DateChange = {
            id: `change-${Date.now()}`,
            previousDate: milestone.date,
            newDate: proposedDate,
            changedAt: Date.now(),
            reason,
            explanation,
            changeType,
            daysDiff,
        };

        onDateChange(milestoneIndex, proposedDate, dateChange);
        setShowDatePicker(false);
        setProposedDate('');
        setShowReflectionModal(false);
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
                        className="fixed inset-0 modal-backdrop-macos z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[700px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="modal-macos rounded-2xl overflow-hidden flex flex-col h-full pointer-events-auto"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000000' }}
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
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo bg-indigo-50 px-3 py-1 rounded-full">
                                                            {format(new Date(milestone.date), 'MMMM do, yyyy')}
                                                        </span>
                                                        {/* Date History Badge */}
                                                        {milestone.dateHistory && milestone.dateHistory.length > 0 && (
                                                            <button
                                                                onClick={() => setShowDateHistory(!showDateHistory)}
                                                                className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                                                            >
                                                                <History className="w-3 h-3" />
                                                                {milestone.dateHistory.length}x changed
                                                                {showDateHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Date Change Button - Only if not read-only */}
                                                    {!isReadOnly && onDateChange && (
                                                        <div className="flex items-center gap-2">
                                                            {showDatePicker ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="date"
                                                                        value={proposedDate}
                                                                        onChange={(e) => setProposedDate(e.target.value)}
                                                                        min={new Date().toISOString().split('T')[0]}
                                                                        className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-slate-800"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            if (proposedDate && proposedDate !== milestone.date) {
                                                                                setShowReflectionModal(true);
                                                                            }
                                                                        }}
                                                                        disabled={!proposedDate || proposedDate === milestone.date}
                                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                                    >
                                                                        Continue
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowDatePicker(false);
                                                                            setProposedDate('');
                                                                        }}
                                                                        className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setProposedDate(milestone.date);
                                                                        setShowDatePicker(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-purple transition-colors"
                                                                >
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    Need to adjust this deadline?
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Date History Dropdown */}
                                                    {showDateHistory && milestone.dateHistory && milestone.dateHistory.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="w-full mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200"
                                                        >
                                                            <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
                                                                Date Change History
                                                            </h5>
                                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                {milestone.dateHistory.slice().reverse().map((change, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${change.changeType === 'extend'
                                                                                ? 'bg-amber-100 text-amber-700'
                                                                                : 'bg-green-100 text-green-700'
                                                                                }`}>
                                                                                {change.changeType === 'extend' ? `+${change.daysDiff}d` : `${change.daysDiff}d`}
                                                                            </span>
                                                                            <span className="text-slate-600">
                                                                                {change.reason.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-slate-400">
                                                                            {format(new Date(change.changedAt), 'MMM d')}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
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
                                        {((milestone.steps && milestone.steps.length > 0) || isEditingSteps) && (
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between px-1">
                                                    <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                                        <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                        Action Plan
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        {!isEditingSteps && (
                                                            <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                                {completedCount}/{totalSteps} complete
                                                            </span>
                                                        )}
                                                        {/* Edit/Save Button */}
                                                        {!isReadOnly && onStepsChange && (
                                                            isEditingSteps ? (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={cancelEditingSteps}
                                                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={saveStepChanges}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                                                    >
                                                                        <Save className="w-3.5 h-3.5" />
                                                                        Save Dates
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={startEditingSteps}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-purple border border-slate-200 hover:border-brand-purple/30 rounded-lg hover:bg-purple-50 transition-colors"
                                                                >
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    Adj. Dates
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress bar - only in view mode */}
                                                {!isEditingSteps && (
                                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }}
                                                            className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full shadow-[0_2px_10px_rgba(168,85,247,0.3)]"
                                                            transition={{ type: "spring", stiffness: 100 }}
                                                        />
                                                    </div>
                                                )}

                                                {!isEditingSteps && allComplete && (
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

                                                {/* EDIT MODE - DATES ONLY */}
                                                {isEditingSteps ? (
                                                    <div className="space-y-3">
                                                        <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 mb-4 flex gap-2">
                                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                                            <p>You can adjust the target dates for your steps to better fit your schedule. Step descriptions are fixed.</p>
                                                        </div>
                                                        {editableSteps.map((step, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm"
                                                            >
                                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                                    {idx + 1}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-800 mb-1">{step.text}</p>
                                                                    {step.habit && (
                                                                        <p className="text-xs text-slate-500 italic">Habit: {step.habit}</p>
                                                                    )}
                                                                </div>
                                                                <div className="w-40">
                                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                                                        Target Date
                                                                    </label>
                                                                    <input
                                                                        type="date"
                                                                        value={step.date}
                                                                        onChange={(e) => updateStepDate(idx, e.target.value)}
                                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-slate-800"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* VIEW MODE */
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
                                                                    whileHover={isReadOnly ? {} : { scale: 1.01 }}
                                                                    whileTap={isReadOnly ? {} : { scale: 0.99 }}
                                                                    className={`flex flex-col items-center text-center gap-4 p-4 rounded-2xl border transition-all shadow-sm group ${completed
                                                                        ? 'bg-green-50/50 border-green-200'
                                                                        : isReadOnly
                                                                            ? 'bg-white border-slate-200'
                                                                            : 'bg-white border-slate-200 hover:border-brand-purple/40 hover:shadow-md hover:shadow-brand-purple/5 cursor-pointer'
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
                                                                        <div className="flex flex-col gap-1.5 w-full">
                                                                            <div className="flex flex-col items-center gap-2">
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
                                                                                <div className="flex items-center justify-center mt-1 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-fit mx-auto border border-slate-100">
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
                                                )}
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
                                                            className="flex flex-col items-center text-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-indigo/30 hover:bg-white hover:shadow-md hover:shadow-brand-indigo/5 transition-all group"
                                                        >

                                                            <div className="flex-1 min-w-0 w-full">
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

                                        {/* Progress Check-in (Multimodal) */}
                                        {!isReadOnly && (
                                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                                <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                                    <div className="bg-teal-100 p-1.5 rounded-lg text-teal-600">
                                                        <Camera className="w-5 h-5" />
                                                    </div>
                                                    Progress Check-in
                                                </h4>

                                                <input
                                                    ref={progressFileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={handleProgressPhoto}
                                                />

                                                {!progressPhoto ? (
                                                    <button
                                                        onClick={() => progressFileRef.current?.click()}
                                                        className="w-full flex flex-col items-center gap-3 py-8 bg-teal-50/50 rounded-2xl border-2 border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer group"
                                                    >
                                                        <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                            <Camera className="w-6 h-6 text-teal-500" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium text-slate-700">Upload a progress photo</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">AI will analyze your progress and give feedback</p>
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="relative rounded-xl overflow-hidden">
                                                            <img
                                                                src={progressPhoto}
                                                                alt="Progress check-in"
                                                                className="w-full h-48 object-cover"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    setProgressPhoto(null);
                                                                    setProgressAnalysis(null);
                                                                    if (progressFileRef.current) progressFileRef.current.value = '';
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {isAnalyzing ? (
                                                            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
                                                                <Loader2 className="w-5 h-5 text-teal-600 animate-spin flex-shrink-0" />
                                                                <p className="text-sm text-teal-700 font-medium">Analyzing your progress...</p>
                                                            </div>
                                                        ) : progressAnalysis ? (
                                                            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
                                                                <div className="p-1.5 bg-white rounded-lg shadow-sm h-fit">
                                                                    <Sparkles className="w-4 h-4 text-teal-600" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-xs font-bold text-teal-800 uppercase tracking-wide mb-1">AI Feedback</h5>
                                                                    <p className="text-sm text-teal-900 leading-relaxed">{progressAnalysis}</p>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Grounded Resource Discovery */}
                                        {!isReadOnly && (
                                            <div className="pt-4">
                                                {groundedResources.length === 0 ? (
                                                    <button
                                                        onClick={fetchGroundedResources}
                                                        disabled={isLoadingResources}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors text-sm font-medium text-blue-700 disabled:opacity-50"
                                                    >
                                                        {isLoadingResources ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Search className="w-4 h-4" />
                                                        )}
                                                        {isLoadingResources ? 'Searching with Google...' : 'Find Verified Resources with Google Search'}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <h4 className="font-bold text-sm flex items-center gap-2 text-blue-800">
                                                            <Search className="w-4 h-4" />
                                                            Verified Resources (via Google Search)
                                                        </h4>
                                                        <div className="grid gap-2">
                                                            {groundedResources.map((resource, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 hover:border-blue-300 hover:bg-blue-100 transition-all group"
                                                                >
                                                                    {getIconForType(resource.type)}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-slate-800 truncate">{resource.title}</p>
                                                                        <p className="text-xs text-slate-500 truncate">
                                                                            {(() => { try { return new URL(resource.url).hostname; } catch { return resource.url; } })()}
                                                                        </p>
                                                                    </div>
                                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {goalId && !isReadOnly && (
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


                    {/* Date Change Reflection Modal */}
                    {milestone && (
                        <DateChangeReflectionModal
                            isOpen={showReflectionModal}
                            onClose={() => {
                                setShowReflectionModal(false);
                                setShowDatePicker(false);
                                setProposedDate('');
                            }}
                            milestoneName={milestone.milestone}
                            currentDate={milestone.date}
                            proposedDate={proposedDate || milestone.date}
                            stepsCompleted={completedCount}
                            totalSteps={totalSteps}
                            onConfirm={handleDateChangeConfirm}
                        />
                    )}
                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null;
};
