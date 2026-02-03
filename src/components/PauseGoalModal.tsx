import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Clock, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { PauseRecord } from '@/types';

interface PauseGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    goalTitle: string;
    isPaused: boolean;
    pausedAt?: number;
    pauseReason?: string;
    pauseHistory?: PauseRecord[];
    onPause: (reason: string, reasonCategory: PauseRecord['reasonCategory']) => void;
    onResume: () => void;
}

const PAUSE_REASONS: { id: PauseRecord['reasonCategory']; label: string; icon: string; description: string }[] = [
    { id: 'health', label: 'Health issue', icon: '🏥', description: 'Taking time to recover' },
    { id: 'family', label: 'Family emergency', icon: '👨‍👩‍👧', description: 'Family needs attention' },
    { id: 'work', label: 'Work crisis', icon: '💼', description: 'Work demands taking over' },
    { id: 'travel', label: 'Travel/vacation', icon: '✈️', description: 'Away from routine' },
    { id: 'mental', label: 'Mental break', icon: '🧘', description: 'Need time to recharge' },
    { id: 'other', label: 'Other', icon: '📝', description: 'Something else' },
];

const MAX_PAUSES_BEFORE_WARNING = 3;

export const PauseGoalModal: React.FC<PauseGoalModalProps> = ({
    isOpen,
    onClose,
    goalTitle,
    isPaused,
    pausedAt,
    pauseReason,
    pauseHistory = [],
    onPause,
    onResume,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<PauseRecord['reasonCategory'] | null>(null);
    const [customReason, setCustomReason] = useState('');
    const [showResumeConfirm, setShowResumeConfirm] = useState(false);

    const pauseCount = pauseHistory.length + (isPaused ? 1 : 0);
    const showPauseWarning = pauseCount >= MAX_PAUSES_BEFORE_WARNING;

    // Calculate days paused if currently paused
    const daysPaused = isPaused && pausedAt
        ? differenceInDays(new Date(), new Date(pausedAt))
        : 0;

    // Total historical pause days
    const totalHistoricalPauseDays = pauseHistory.reduce((sum, record) => {
        if (record.resumedAt) {
            return sum + differenceInDays(new Date(record.resumedAt), new Date(record.pausedAt));
        }
        return sum;
    }, 0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedCategory(null);
            setCustomReason('');
            setShowResumeConfirm(false);
        }
    }, [isOpen]);

    const handlePause = () => {
        if (selectedCategory) {
            const reason = customReason.trim() || PAUSE_REASONS.find(r => r.id === selectedCategory)?.label || '';
            onPause(reason, selectedCategory);
            onClose();
        }
    };

    const handleResume = () => {
        onResume();
        onClose();
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
                            <div className={`p-6 ${isPaused ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isPaused ? 'bg-blue-100' : 'bg-slate-200'}`}>
                                            {isPaused ? (
                                                <Play className="w-6 h-6 text-blue-600" />
                                            ) : (
                                                <Pause className="w-6 h-6 text-slate-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg ${isPaused ? 'text-blue-900' : 'text-slate-900'}`}>
                                                {isPaused ? 'Resume Goal' : 'Pause Goal'}
                                            </h3>
                                            <p className="text-sm text-slate-600 truncate max-w-[200px]">
                                                {goalTitle}
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
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {isPaused ? (
                                    // Resume View
                                    <div className="space-y-4">
                                        {/* Pause Status */}
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                                <span className="font-bold text-blue-800">Currently Paused</span>
                                            </div>
                                            <p className="text-blue-700 text-sm">
                                                Paused for <strong>{daysPaused} days</strong>
                                                {pauseReason && (
                                                    <span> - "{pauseReason}"</span>
                                                )}
                                            </p>
                                            {pausedAt && (
                                                <p className="text-blue-600 text-xs mt-1">
                                                    Since {format(new Date(pausedAt), 'MMMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>

                                        {/* What happens on resume */}
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-green-800 text-sm font-medium">
                                                When you resume, all milestone dates will shift forward by <strong>{daysPaused} days</strong> to account for the pause.
                                            </p>
                                        </div>

                                        {/* Resume Button */}
                                        {showResumeConfirm ? (
                                            <div className="space-y-2">
                                                <p className="text-center text-sm text-gray-600">
                                                    Ready to continue your journey?
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowResumeConfirm(false)}
                                                        className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleResume}
                                                        className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Play className="w-5 h-5" />
                                                        Resume Now
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowResumeConfirm(true)}
                                                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Play className="w-5 h-5" />
                                                Resume This Goal
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // Pause View
                                    <div className="space-y-4">
                                        {/* Warning if many pauses */}
                                        {showPauseWarning && (
                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-amber-800 text-sm font-medium">
                                                            You've paused this goal {pauseCount} times
                                                        </p>
                                                        <p className="text-amber-700 text-xs mt-1">
                                                            Total pause time: {totalHistoricalPauseDays} days.
                                                            Consider if this goal is still a priority.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        <p className="text-gray-600 text-sm">
                                            Pausing is different from extending deadlines. Use this for life disruptions that affect all milestones.
                                        </p>

                                        {/* Reason Selection */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                What's happening?
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PAUSE_REASONS.map((reason) => (
                                                    <button
                                                        key={reason.id}
                                                        onClick={() => setSelectedCategory(reason.id)}
                                                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedCategory === reason.id
                                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{reason.icon}</span>
                                                            <span className={`text-sm font-medium ${selectedCategory === reason.id ? 'text-blue-700' : 'text-gray-700'
                                                                }`}>
                                                                {reason.label}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Optional custom reason */}
                                        {selectedCategory && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Add a note (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    placeholder="Brief description..."
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-gray-800"
                                                    maxLength={100}
                                                />
                                            </div>
                                        )}

                                        {/* What happens */}
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-slate-700 text-sm">
                                                <strong>What happens when paused:</strong>
                                            </p>
                                            <ul className="text-slate-600 text-sm mt-2 space-y-1 list-disc list-inside">
                                                <li>Time stops counting toward deadlines</li>
                                                <li>All dates shift when you resume</li>
                                                <li>Progress is preserved</li>
                                            </ul>
                                        </div>

                                        {/* Pause Button */}
                                        <button
                                            onClick={handlePause}
                                            disabled={!selectedCategory}
                                            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Pause className="w-5 h-5" />
                                            Pause Goal
                                        </button>
                                    </div>
                                )}

                                {/* Pause History */}
                                {pauseHistory.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                            Pause History
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {pauseHistory.slice(-3).reverse().map((record, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-600">
                                                        {record.reason}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">
                                                        {record.daysShifted} days
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
