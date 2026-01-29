import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Loader2, RefreshCw } from 'lucide-react';
import { geminiService } from '@/lib/gemini';
import { firestoreService, type JournalEntry, type JournalMood } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface JournalEditorProps {
    isOpen: boolean;
    onClose: () => void;
    goalId: string;
    goalTitle: string;
    milestoneName: string;
    milestoneIndex: number;
    existingEntry?: JournalEntry;
    onSave: (entry: JournalEntry) => void;
    isEmbedded?: boolean;
}

const MOODS: { value: JournalMood; emoji: string; label: string }[] = [
    { value: 'great', emoji: '🌟', label: 'Great' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'struggling', emoji: '😔', label: 'Struggling' },
    { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
    isOpen,
    onClose,
    goalId,
    goalTitle,
    milestoneName,
    milestoneIndex,
    existingEntry,
    onSave,
    isEmbedded = false
}) => {
    const { user } = useAuth();
    const [content, setContent] = useState(existingEntry?.content || '');
    const [mood, setMood] = useState<JournalMood>(existingEntry?.mood || 'neutral');
    const [aiPrompt, setAiPrompt] = useState(existingEntry?.aiPrompt || '');
    const [aiReflection, setAiReflection] = useState(existingEntry?.aiReflection || '');
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const generatePrompt = useCallback(async () => {
        setIsGeneratingPrompt(true);
        try {
            const prompt = await geminiService.generateJournalPrompt(
                goalTitle,
                milestoneName
            );
            setAiPrompt(prompt);
        } catch (error) {
            console.error('Failed to generate prompt:', error);
            setAiPrompt("What progress have you made today? How are you feeling about your journey?");
        } finally {
            setIsGeneratingPrompt(false);
        }
    }, [goalTitle, milestoneName]);

    // Reset state when modal opens with new context
    useEffect(() => {
        if (isOpen) {
            if (existingEntry) {
                setContent(existingEntry.content);
                setMood(existingEntry.mood || 'neutral');
                setAiPrompt(existingEntry.aiPrompt || '');
                setAiReflection(existingEntry.aiReflection || '');
            } else {
                setContent('');
                setMood('neutral');
                setAiReflection('');
                generatePrompt();
            }
        }
    }, [isOpen, existingEntry, generatePrompt]);

    const handleSave = async () => {
        if (!user || !content.trim()) return;

        setIsSaving(true);
        try {
            // Generate AI reflection
            const reflection = await geminiService.generateJournalReflection(
                goalTitle,
                milestoneName,
                content,
                mood
            );
            setAiReflection(reflection);

            const entryData = {
                goalId,
                milestoneIndex,
                userId: user.uid,
                content: content.trim(),
                mood,
                aiPrompt,
                aiReflection: reflection
            };

            if (existingEntry?.id) {
                await firestoreService.updateJournalEntry(existingEntry.id, entryData);
                onSave({
                    ...existingEntry,
                    ...entryData,
                    updatedAt: new Date()
                });
            } else {
                const id = await firestoreService.saveJournalEntry(entryData);
                onSave({
                    id,
                    ...entryData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save entry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const EditorContent = (
        <div className={`flex flex-col h-full bg-white ${isEmbedded ? '' : 'rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]'}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between relative">
                    <div className="w-full text-center px-8">
                        <h2 className="text-xl font-bold text-slate-900">Journal Entry</h2>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{milestoneName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* AI Prompt */}
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center justify-center mb-2 relative">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-purple" />
                            <span className="text-sm font-semibold text-brand-purple">Reflection Prompt</span>
                        </div>
                    </div>
                    {isGeneratingPrompt ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Generating prompt...</span>
                        </div>
                    ) : (
                        <div className="relative flex items-start justify-center gap-3">
                            <p className="text-slate-700 text-sm italic leading-relaxed text-center pt-1">
                                {aiPrompt}
                            </p>
                            {!existingEntry && (
                                <button
                                    onClick={generatePrompt}
                                    disabled={isGeneratingPrompt}
                                    className="flex-shrink-0 p-1.5 hover:bg-purple-100 rounded-full transition-colors text-brand-purple hover:text-brand-indigo"
                                    title="Generate new prompt"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Mood Selector */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                        How are you feeling?
                    </label>
                    <div className="flex gap-2">
                        {MOODS.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMood(m.value)}
                                className={`flex-1 py-2.5 rounded-xl text-center transition-all ${mood === m.value
                                    ? 'bg-brand-purple text-white shadow-lg scale-105'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                            >
                                <span className="text-lg">{m.emoji}</span>
                                <span className="block text-[10px] mt-0.5 font-medium">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Journal Text */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">
                        Your thoughts
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write freely about your progress, challenges, or insights..."
                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 resize-none text-sm leading-relaxed text-center"
                    />
                    <p className="text-xs text-slate-400 mt-1 text-center">
                        {content.length} characters
                    </p>
                </div>

                {/* AI Reflection (shown for existing entries) */}
                {aiReflection && existingEntry && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-purple-100">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-brand-purple" />
                            <span className="text-sm font-semibold text-brand-purple">AI Reflection</span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed text-center">{aiReflection}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !content.trim()}
                    className="flex-1 py-3 rounded-full font-bold text-white bg-brand-purple hover:bg-brand-purple/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Save Entry
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    if (isEmbedded) {
        return isOpen ? EditorContent : null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101] px-4"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    >
                        {EditorContent}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
