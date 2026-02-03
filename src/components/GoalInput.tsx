import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { MoonContainer } from './themes/MoonContainer';
import { BrainContainer } from './themes/BrainContainer';
import { TreeContainer } from './themes/TreeContainer';
import { VoiceInput } from './VoiceInput';
import { Tooltip } from './TooltipSystem';
import { GoalTemplates } from './GoalTemplates';

interface GoalInputProps {
    onSubmit: (goal: string, timeline: string, image?: File) => Promise<void>;
    onWormhole?: () => Promise<void>;
    isLoading?: boolean;
    children?: React.ReactNode;
}

const TIMELINE_OPTIONS = [
    { label: '1 Month', value: '1 month' },
    { label: '3 Months', value: '3 months' },
    { label: '6 Months', value: '6 months' },
    { label: '1 Year', value: '1 year' },
    { label: '3 Years', value: '3 years' },
    { label: '5 Years', value: '5 years' },
    { label: 'Flexible', value: 'flexible' },
];

export const GoalInput: React.FC<GoalInputProps> = ({ onSubmit, onWormhole, isLoading = false, children }) => {
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [timeline, setTimeline] = useState('flexible');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { currentTheme } = useTheme();

    const ContainerComponent = useMemo(() => {
        switch (currentTheme.id) {
            case 'brain':
                return BrainContainer;
            case 'tree':
                return TreeContainer;
            default:
                // Default to Moon for space and others
                return MoonContainer;
        }
    }, [currentTheme.id]);

    // Create object URL for image preview and clean up on change/unmount
    const imagePreviewUrl = useMemo(() => {
        if (!selectedImage) return null;
        return URL.createObjectURL(selectedImage);
    }, [selectedImage]);

    useEffect(() => {
        // Cleanup function to revoke the object URL when component unmounts or image changes
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !selectedImage) return;
        await onSubmit(input, timeline, selectedImage || undefined);
        setInput('');
        setSelectedImage(null);
    };

    return (
        <div className="flex items-center justify-center p-4">
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                {/* Theme-Aware Container */}
                <ContainerComponent isFocused={isFocused}>
                    <div className="flex flex-col gap-3 text-center">
                        {/* Header Content passed from parent */}
                        <div className="mb-1">
                            {children}
                        </div>

                        <GoalTemplates onSelect={setInput} />

                        {selectedImage && imagePreviewUrl && (
                            <div className="relative w-fit mx-auto">
                                <img
                                    src={imagePreviewUrl}
                                    alt="Goal reference"
                                    className="h-20 w-20 object-cover rounded-2xl border border-white/70 shadow-lg rotate-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 p-1.5 bg-white/95 rounded-full text-slate-500 hover:text-red-500 shadow-md border border-gray-200 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Main Input Area */}
                        <div className="relative flex flex-col gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                autoFocus
                                placeholder="Describe your dream..."
                                style={{
                                    color: ['brain', 'tree'].includes(currentTheme.id) ? '#ffffff' : undefined
                                }}
                                className={`w-full bg-transparent border-none text-base md:text-lg font-display font-bold ${['brain', 'tree'].includes(currentTheme.id)
                                    ? 'text-white placeholder:text-white/60 caret-white selection:bg-white/20'
                                    : 'text-slate-800 placeholder:text-slate-500 caret-purple-600 selection:bg-purple-200'
                                    } placeholder:font-playful placeholder:font-bold placeholder:tracking-wide focus:ring-0 focus:outline-none resize-none min-h-[35px] max-h-[80px] py-1.5 text-center leading-tight tracking-tight break-words whitespace-pre-wrap`}
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />

                            {/* Timeline Selection - Dropdown */}
                            <div className="mt-3 flex items-center justify-center gap-2">
                                {/* Hide "Timeline:" label on mobile */}
                                <div
                                    className="hidden sm:flex items-center justify-center h-11 rounded-full text-sm font-medium shadow-md backdrop-blur-md px-5"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                    }}
                                >
                                    <span>Timeline:</span>
                                </div>
                                <div className="relative">
                                    <select
                                        value={timeline}
                                        onChange={(e) => setTimeline(e.target.value)}
                                        className="appearance-none rounded-full cursor-pointer transition-all duration-200 shadow-md hover:scale-105 text-center h-11 min-h-[44px] px-6 sm:px-10 text-sm font-semibold"
                                        style={{
                                            backgroundColor: currentTheme.colors.primary,
                                            color: '#ffffff',
                                            border: 'none',
                                            boxShadow: `0 4px 6px -1px ${currentTheme.colors.primary}4D`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.filter = 'none';
                                        }}
                                    >
                                        {TIMELINE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value} style={{ backgroundColor: currentTheme.colors.primary, color: '#ffffff', textAlign: 'center' }}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Custom dropdown arrow */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar - Wraps on mobile */}
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3">
                                {/* Voice Input Button */}
                                <Tooltip id="voice-input" content="Speak your goal" position="top">
                                    <VoiceInput
                                        onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
                                        disabled={isLoading}
                                    />
                                </Tooltip>

                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="flex items-center justify-center px-4 sm:px-5 h-11 min-h-[44px] rounded-full transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: currentTheme.colors.primary,
                                        color: '#ffffff',
                                        boxShadow: `0 4px 6px -1px ${currentTheme.colors.primary}4D`,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.filter = 'brightness(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = 'none';
                                    }}
                                    title="Add URL"
                                >
                                    <span className="text-sm font-semibold whitespace-nowrap">URL</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={isLoading || (!input.trim() && !selectedImage)}
                                    className="flex items-center justify-center px-5 sm:px-6 h-11 min-h-[44px] rounded-full transition-all duration-300 shadow-md hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                        backgroundColor: currentTheme.colors.primary,
                                        color: '#ffffff',
                                        boxShadow: `0 4px 6px -1px ${currentTheme.colors.primary}4D`,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.filter = 'none';
                                        }
                                    }}
                                >
                                    <span className="text-sm font-semibold whitespace-nowrap">{isLoading ? 'Launching...' : 'Launch'}</span>
                                </button>

                                {/* Wormhole Button */}
                                {onWormhole && (
                                    <button
                                        type="button"
                                        onClick={(e) => e.preventDefault()}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onWormhole?.();
                                        }}
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-1.5 px-4 sm:px-5 h-11 min-h-[44px] rounded-full transition-all duration-300 shadow-md hover:scale-105 active:scale-95 hover:rotate-2 disabled:opacity-40 backdrop-blur-sm"
                                        style={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                            color: currentTheme.colors.primary,
                                            border: `1px solid ${currentTheme.colors.primary}66`,
                                            boxShadow: `0 0 10px ${currentTheme.colors.primary}20`,
                                        }}
                                        title="Surprise Me"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20a8 8 0 1 0-8-8" />
                                            <path d="M10 14a3 3 0 1 0 3-3" />
                                            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                                        </svg>
                                        <span className="text-sm font-semibold whitespace-nowrap hidden sm:inline">Wormhole</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </ContainerComponent>
            </motion.form>
        </div>
    );
};
