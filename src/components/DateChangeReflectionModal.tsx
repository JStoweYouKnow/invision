import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Calendar, ArrowRight, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { DateChangeReason, DateChangeType } from '@/types';

interface DateChangeReflectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    milestoneName: string;
    currentDate: string;          // YYYY-MM-DD
    proposedDate: string;         // YYYY-MM-DD
    stepsCompleted: number;
    totalSteps: number;
    onConfirm: (reason: DateChangeReason, explanation: string, changeType: DateChangeType) => void;
}

const REASON_OPTIONS: { id: DateChangeReason; label: string; icon: string }[] = [
    { id: 'life_event', label: 'Life event', icon: '🌊' },
    { id: 'underestimated_effort', label: 'Underestimated effort', icon: '📊' },
    { id: 'priorities_shifted', label: 'Priorities shifted', icon: '🔄' },
    { id: 'health_issue', label: 'Health issue', icon: '🏥' },
    { id: 'work_crisis', label: 'Work crisis', icon: '💼' },
    { id: 'other', label: 'Other', icon: '📝' },
];

const REFLECTION_PROMPTS = [
    "What prevented you from meeting the original deadline?",
    "What will you do differently to meet this new date?",
    "Is this a one-time adjustment or a pattern you're noticing?"
];

export const DateChangeReflectionModal: React.FC<DateChangeReflectionModalProps> = ({
    isOpen,
    onClose,
    milestoneName,
    currentDate,
    proposedDate,
    stepsCompleted,
    totalSteps,
    onConfirm,
}) => {
    const [step, setStep] = useState<'warning' | 'reflect' | 'confirm'>('warning');
    const [selectedReason, setSelectedReason] = useState<DateChangeReason | null>(null);
    const [explanation, setExplanation] = useState('');
    const [countdown, setCountdown] = useState(5);
    const [isCommitted, setIsCommitted] = useState(false);

    // Calculate date difference
    const currentDateObj = new Date(currentDate + 'T00:00:00');
    const proposedDateObj = new Date(proposedDate + 'T00:00:00');
    const daysDiff = differenceInDays(proposedDateObj, currentDateObj);
    const isExtending = daysDiff > 0;
    const changeType: DateChangeType = isExtending ? 'extend' : 'reschedule';

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // Skip warning for rescheduling (moving earlier)
            setStep(isExtending ? 'warning' : 'reflect');
            setSelectedReason(null);
            setExplanation('');
            setCountdown(5);
            setIsCommitted(false);
        }
    }, [isOpen, isExtending]);

    // Countdown timer for confirmation step
    useEffect(() => {
        if (step === 'confirm' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [step, countdown]);

    const canProceedToReflect = true;
    const canProceedToConfirm = selectedReason && explanation.length >= 20 && isCommitted;
    const canFinalConfirm = countdown === 0;

    const handleConfirm = () => {
        if (selectedReason) {
            onConfirm(selectedReason, explanation, changeType);
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[10001] p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className={`p-6 ${isExtending ? 'bg-amber-50' : 'bg-green-50'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {isExtending ? (
                                            <div className="p-2 bg-amber-100 rounded-xl">
                                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-green-100 rounded-xl">
                                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className={`font-bold text-lg ${isExtending ? 'text-amber-900' : 'text-green-900'}`}>
                                                {isExtending ? 'Extending Deadline' : 'Moving Up Deadline'}
                                            </h3>
                                            <p className={`text-sm ${isExtending ? 'text-amber-700' : 'text-green-700'}`}>
                                                {milestoneName}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Date Change Visualization */}
                                <div className="mt-4 flex items-center justify-center gap-4 p-4 bg-white/60 rounded-xl">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current</div>
                                        <div className="font-bold text-gray-800">
                                            {format(currentDateObj, 'MMM d')}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${isExtending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {isExtending ? (
                                            <>
                                                <ArrowRight className="w-4 h-4" />
                                                +{daysDiff} days
                                            </>
                                        ) : (
                                            <>
                                                <ArrowLeft className="w-4 h-4" />
                                                {daysDiff} days
                                            </>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">New</div>
                                        <div className={`font-bold ${isExtending ? 'text-amber-700' : 'text-green-700'}`}>
                                            {format(proposedDateObj, 'MMM d')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {step === 'warning' && (
                                        <motion.div
                                            key="warning"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {/* Progress Warning */}
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Clock className="w-5 h-5 text-slate-500" />
                                                    <span className="font-medium text-slate-700">Current Progress</span>
                                                </div>
                                                <p className="text-slate-600">
                                                    You're <strong>{stepsCompleted}/{totalSteps} steps</strong> complete
                                                    {totalSteps > 0 && (
                                                        <span className="text-slate-500">
                                                            {' '}({Math.round((stepsCompleted / totalSteps) * 100)}%)
                                                        </span>
                                                    )}
                                                </p>
                                                {stepsCompleted === 0 && totalSteps > 0 && (
                                                    <p className="text-amber-600 text-sm mt-2 font-medium">
                                                        Consider completing at least one step before extending.
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-slate-600 text-sm">
                                                Extending deadlines can be necessary, but it's important to understand why.
                                                This helps you set more realistic goals in the future.
                                            </p>

                                            <button
                                                onClick={() => setStep('reflect')}
                                                disabled={!canProceedToReflect}
                                                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                                            >
                                                I Understand, Continue
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'reflect' && (
                                        <motion.div
                                            key="reflect"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {/* Reflection Prompt */}
                                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                <p className="text-purple-800 text-sm font-medium italic">
                                                    "{REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]}"
                                                </p>
                                            </div>

                                            {/* Reason Selection */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Why are you {isExtending ? 'extending' : 'rescheduling'}? *
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {REASON_OPTIONS.map((reason) => (
                                                        <button
                                                            key={reason.id}
                                                            onClick={() => setSelectedReason(reason.id)}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedReason === reason.id
                                                                ? 'border-brand-purple bg-purple-50 shadow-md'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <span className="text-lg mr-2">{reason.icon}</span>
                                                            <span className={`text-sm font-medium ${selectedReason === reason.id ? 'text-brand-purple' : 'text-gray-700'
                                                                }`}>
                                                                {reason.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Explanation */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Brief explanation * <span className="font-normal text-gray-400">(min 20 chars)</span>
                                                </label>
                                                <textarea
                                                    value={explanation}
                                                    onChange={(e) => setExplanation(e.target.value)}
                                                    placeholder="What happened and what will you do differently?"
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-purple focus:ring-0 resize-none text-gray-800"
                                                    rows={3}
                                                />
                                                <div className="flex justify-between mt-1">
                                                    <span className={`text-xs ${explanation.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {explanation.length}/20 minimum
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Commitment Checkbox */}
                                            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isCommitted}
                                                    onChange={(e) => setIsCommitted(e.target.checked)}
                                                    className="mt-0.5 w-5 h-5 text-brand-purple border-gray-300 rounded focus:ring-brand-purple"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    <strong>I commit to this new date</strong> and will work to meet it.
                                                </span>
                                            </label>

                                            <button
                                                onClick={() => isExtending ? setStep('confirm') : handleConfirm()}
                                                disabled={!canProceedToConfirm}
                                                className={`w-full py-3 px-4 ${isExtending
                                                    ? 'bg-amber-500 hover:bg-amber-600'
                                                    : 'bg-green-500 hover:bg-green-600'
                                                    } disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors`}
                                            >
                                                {isExtending ? 'Continue to Confirmation' : 'Confirm New Date'}
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'confirm' && (
                                        <motion.div
                                            key="confirm"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {/* Summary */}
                                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Reason:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {REASON_OPTIONS.find(r => r.id === selectedReason)?.label}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Days extended:</span>
                                                    <span className="font-medium text-amber-700">+{daysDiff}</span>
                                                </div>
                                            </div>

                                            <p className="text-center text-gray-600 text-sm">
                                                This gives you time to reflect before confirming.
                                            </p>

                                            {/* Countdown Button */}
                                            <button
                                                onClick={handleConfirm}
                                                disabled={!canFinalConfirm}
                                                className={`w-full py-4 px-4 rounded-xl font-bold text-lg transition-all ${canFinalConfirm
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {canFinalConfirm ? (
                                                    'Confirm Date Change'
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Calendar className="w-5 h-5" />
                                                        Changing in {countdown}...
                                                    </span>
                                                )}
                                            </button>

                                            <button
                                                onClick={onClose}
                                                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                            >
                                                Cancel - Keep Original Date
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Step Indicator */}
                            {isExtending && (
                                <div className="px-6 pb-4 flex justify-center gap-2">
                                    {['warning', 'reflect', 'confirm'].map((s, idx) => (
                                        <div
                                            key={s}
                                            className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-amber-500' :
                                                ['warning', 'reflect', 'confirm'].indexOf(step) > idx ? 'bg-amber-300' : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
