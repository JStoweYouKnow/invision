import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ExternalLink, LayoutList, Trophy, Sparkles, Share2, Globe, Lock, Trash2 } from 'lucide-react';
import type { GeneratedPlan } from '@/lib/gemini';
import { TheGuide } from '@/components/TheGuide';
import { CalendarView } from '@/components/CalendarView';
import { MilestoneModal } from '@/components/MilestoneModal';
import { AchievementCelebration } from '@/components/AchievementCelebration';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Achievement, AchievementType } from '@/types';
import { Fireworks } from '@/components/Fireworks';
// import { useAuth } from '@/contexts/AuthContext';
import { ThemeBackground } from '@/components/backgrounds';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
// import { TimelineNode } from '@/components/themes/TimelineNode';
import { MoonContainer } from '@/components/themes/MoonContainer';
import { BrainContainer } from '@/components/themes/BrainContainer';
import { TreeContainer } from '@/components/themes/TreeContainer';
import { useTheme } from '@/contexts/ThemeContext';

interface PlanViewerProps {
    plan: GeneratedPlan;
    visionImage?: string;
    isPublic?: boolean;
    onTogglePublic?: () => Promise<void>;
    onGoHome?: () => void;
    standalone?: boolean; // New prop to control layout mode
    onUpdatePlan?: (newPlan: GeneratedPlan) => void;
    goalId?: string;
    onDelete?: () => void;
}

// const QUOTES = [
//     { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
//     { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
//     { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
//     { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
//     { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" }
// ];

import { calendarService } from '@/lib/calendar';

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan, visionImage, onGoHome, isPublic, onTogglePublic, standalone = true, onUpdatePlan, goalId, onDelete }) => {

    // const { user } = useAuth();
    const [imgSeed, setImgSeed] = useState(0);
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'vision'>('vision'); // Debug: default to vision
    const [isSyncing, setIsSyncing] = useState(false);

    // Check if the provided image is a valid image URL
    // Accept any valid http(s) URL or data URI - only treat as placeholder if empty/invalid
    const isPlaceholder = (url?: string) => {
        if (!url || url.trim() === '') return true;
        // Accept local paths, pollinations, data URIs, and any other valid http(s) URLs
        return !url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/');
    };

    // Determine which image to show
    // If we have generated a new one (seed > 0) use dynamic local URL construction based on the original base if possible,
    // OR just use the visionImage if it's already a pollinations URL and we just append seed.

    // Helper to construct new url with seed
    const getDynamicUrl = (baseSource: string | undefined, seed: number) => {
        // If the user explicitly requested a remix (seed > 0), we ALWAYS want a dynamic generation,
        // UNLESS it's already a pollinations URL (in which case we just update the seed on it).
        const isPollinations = baseSource?.includes('pollinations.ai');

        if (seed > 0 && !isPollinations) {
            // User wants remix, but we have a non-pollinations static image.
            // Generate a fresh one using the seed.
            const prompt = encodeURIComponent(`wide cinematic shot of ${plan.title}, photorealistic, natural lighting, inspirational, highly detailed, 8k, wide angle`);
            return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
        }

        // Force generation if it's a placeholder OR if we don't have a source
        if (!baseSource || isPlaceholder(baseSource)) {
            // Fallback to fresh generation if it was a placeholder
            // Use a stable seed based on the title length if seed is 0 to ensure consistent but dynamic initial image
            const effectiveSeed = seed > 0 ? seed : (plan.title.length + 42);
            const prompt = encodeURIComponent(`wide cinematic shot of ${plan.title}, photorealistic, natural lighting, inspirational, highly detailed, 8k, wide angle`);
            return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${effectiveSeed}`;
        }

        // If it's a pollinations URL
        if (isPollinations) {
            try {
                const url = new URL(baseSource!);
                // Force square aspect ratio for the new design, refreshing the composition
                url.searchParams.set('width', '1024');
                url.searchParams.set('height', '1024');

                // Only modify seed if we have a NEW local seed (regenerated)
                if (seed > 0) {
                    url.searchParams.set('seed', seed.toString());
                }
                return url.toString();
            } catch {
                return baseSource;
            }
        }

        return baseSource;
    };

    const displayImage = getDynamicUrl(visionImage, imgSeed);
    const showDynamicImage = imgSeed > 0 || (visionImage && (visionImage.includes('pollinations.ai') || visionImage.startsWith('data:image/'))) || (visionImage && isPlaceholder(visionImage));

    // Select quote based on seed (pseudo-random but consistent for same seed)
    // Select quote based on seed (pseudo-random but consistent for same seed)
    // const quoteIndex = imgSeed % QUOTES.length;
    // const currentQuote = QUOTES[quoteIndex] || QUOTES[0]; // Fallback safety

    const { currentTheme } = useTheme();
    // cast currentTheme.id to string to avoid type error if strict unions don't overlap
    const themeId = currentTheme.id as string;

    const MilestoneContainer = React.useMemo(() => {
        switch (themeId) {
            case 'brain':
                return BrainContainer;
            case 'tree':
                return TreeContainer;
            default:
                return MoonContainer;
        }
    }, [themeId]);

    // ... render ...


    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [, setRecentlyCompleted] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);

    // Achievement celebration state
    const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
    const [achievementVisible, setAchievementVisible] = useState(false);

    // Missing state variables for milestone selection
    const [selectedMilestone, setSelectedMilestone] = useState<GeneratedPlan['timeline'][0] | null>(null);
    const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number>(-1);

    // Calculate total steps across all milestones
    const totalSteps = plan.timeline.reduce((acc, item) => acc + (item.steps?.length || 0), 0);
    const completedCount = completedSteps.size;
    const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    // Handle step completion
    const handleStepComplete = (milestoneIndex: number, stepIndex: number) => {
        const stepKey = `${milestoneIndex}-${stepIndex}`;
        const newCompleted = new Set(completedSteps);

        if (newCompleted.has(stepKey)) {
            newCompleted.delete(stepKey);
        } else {
            newCompleted.add(stepKey);
            setRecentlyCompleted(stepKey);
            setShowConfetti(true);
            setShowReward(true);

            // Check if this completes a milestone
            const milestone = plan.timeline[milestoneIndex];
            const milestoneStepsCompleted = milestone.steps.filter((_, idx) =>
                newCompleted.has(`${milestoneIndex}-${idx}`) || (milestoneIndex === milestoneIndex && stepIndex === idx)
            ).length;

            // Trigger Achievement Celebration
            const allMilestoneStepsDone = milestoneStepsCompleted === milestone.steps.length;
            const isLastMilestone = milestoneIndex === plan.timeline.length - 1;
            const allStepsDone = newCompleted.size + 1 === totalSteps;

            const step = milestone.steps[stepIndex];
            let achievementType: AchievementType = 'waypoint';
            let achievementTitle = typeof step === 'string' ? step : step.text;
            let achievementDesc = `Step completed in "${milestone.milestone}"`;

            if (allMilestoneStepsDone) {
                achievementType = 'milestone';
                achievementTitle = milestone.milestone;
                achievementDesc = `You've completed all steps in this milestone!`;
            }

            if (allStepsDone && isLastMilestone) {
                achievementType = 'goal';
                achievementTitle = plan.title;
                achievementDesc = `Congratulations! You've completed your entire journey!`;
            }

            // Show achievement celebration
            setActiveAchievement({
                id: stepKey,
                type: achievementType,
                title: achievementTitle,
                description: achievementDesc,
                earnedAt: Date.now(),
                stats: {
                    waypointsCleared: newCompleted.size + 1,
                },
            });
            setAchievementVisible(true);

            // Hide confetti after animation
            setTimeout(() => setShowConfetti(false), 3000);
            setTimeout(() => setShowReward(false), 2500);
            setTimeout(() => setRecentlyCompleted(null), 1000);
        }

        setCompletedSteps(newCompleted);
    };

    // Handle achievement dismiss
    const handleAchievementDismiss = () => {
        setAchievementVisible(false);
        setTimeout(() => setActiveAchievement(null), 500);
    };

    const isStepCompleted = (milestoneIndex: number, stepIndex: number) => {
        return completedSteps.has(`${milestoneIndex}-${stepIndex}`);
    };

    if (!plan || !plan.timeline) {
        return <div className="p-8 text-center text-red-400">Error: No plan data available.</div>;
    }

    return (
        <ErrorBoundary>
            {/* Conditional Wrapper based on standalone prop */}
            <div className={standalone ? "min-h-screen bg-transparent text-foreground relative overflow-hidden" : "relative"}>
                {/* Theme Background only if standalone */}
                {standalone && <ThemeBackground className="z-0" />}

                {/* Main Content */}
                <div className={`relative z-10 w-full max-w-xl mx-auto space-y-10 pb-32 ${standalone ? "p-4 md:p-8" : ""}`}>
                    {/* ... (Fireworks, Reward, Header content same) ... */}
                    <Fireworks show={showConfetti} />
                    <AnimatePresence>
                        {showReward && (
                            <motion.div
                                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-gradient-to-r from-brand-indigo to-brand-purple text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
                            >
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Step Completed!</p>
                                    <p className="text-sm opacity-90">Keep up the great work!</p>
                                </div>
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Home Button & Progress Bar */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            {onGoHome && (
                                <motion.button
                                    onClick={onGoHome}
                                    whileHover={{ scale: 1.02, opacity: 0.9 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 group transition-all duration-300 bg-transparent border-none p-0 outline-none"
                                >
                                    <div className="relative flex items-center justify-center">
                                        <img src="/images/galaxy-bubble-v2.png" alt="InVision logo" className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ width: '48px', height: '48px' }} />
                                    </div>
                                    <span className="font-display tracking-tight leading-[0.9] italic" style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>InVision</span>
                                </motion.button>
                            )}
                            <div className="flex items-center gap-4">
                                <ThemeQuickToggle />
                            </div>
                        </div>

                        {totalSteps > 0 && (
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-brand-purple" />
                                        <span className="font-bold text-brand-slate text-sm">
                                            {completedCount} / {totalSteps} steps
                                        </span>
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                        transition={{ type: "spring", stiffness: 100 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>


                    {/* View Toggle & Content */}
                    <div className="space-y-32">
                        <div className="flex flex-col items-center gap-6">
                            <h2 className="text-4xl font-display font-bold text-center">Your Vision</h2>

                            <div className="flex flex-wrap justify-center items-center gap-16">
                                {/* View Modes Container */}
                                <div className="flex flex-wrap justify-center items-center gap-2 p-1 bg-white/5 rounded-full w-fit backdrop-blur-md">
                                    <button
                                        onClick={() => setViewMode('vision')}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'vision'
                                            ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20'
                                            : 'text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Vision
                                    </button>
                                    <button
                                        onClick={() => setViewMode('timeline')}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'timeline'
                                            ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20'
                                            : 'text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                        Timeline
                                    </button>
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'calendar'
                                            ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20'
                                            : 'text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                        Calendar
                                    </button>
                                </div>

                                {/* Actions Container */}
                                <div className="flex flex-wrap justify-center items-center gap-2 p-1 bg-white/5 rounded-full w-fit backdrop-blur-md">
                                    {onTogglePublic && (
                                        <button
                                            onClick={onTogglePublic}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 ${isPublic
                                                ? 'text-green-300 hover:text-green-200'
                                                : 'text-muted-foreground hover:text-white'
                                                }`}
                                        >
                                            {isPublic ? (
                                                <>
                                                    <Globe className="w-4 h-4" />
                                                    Public
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4" />
                                                    Private
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            const shareData = {
                                                title: `My Vision: ${plan.title}`,
                                                text: `I'm manifesting: "${plan.title}"\n\n${plan.visionaryDescription ? `"${plan.visionaryDescription}"\n\n` : ''}Follow my journey on Invision!`,
                                                url: window.location.href
                                            };

                                            if (navigator.share) {
                                                try {
                                                    await navigator.share(shareData);
                                                } catch {
                                                    // Handle error silently
                                                }
                                            } else {
                                                const clipboardText = `${shareData.title}\n\n${shareData.text}\n${shareData.url}`;
                                                await navigator.clipboard.writeText(clipboardText);
                                                alert('Vision summary copied to clipboard!');
                                            }
                                        }}
                                        className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all text-brand-purple hover:text-brand-purple/80 hover:scale-105 active:scale-95"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (isSyncing) return;
                                            try {
                                                setIsSyncing(true);
                                                const token = await calendarService.getAccessToken();
                                                const count = await calendarService.syncToCalendar(plan, token);
                                                alert(`Successfully synced ${count} events to your Google Calendar!`);
                                            } catch (error) {
                                                console.error(error);
                                                alert('Failed to sync. Please ensure popups are allowed and try again.');
                                            } finally {
                                                setIsSyncing(false);
                                            }
                                        }}
                                        disabled={isSyncing}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${isSyncing
                                            ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                                            : 'text-brand-indigo hover:text-brand-indigo/80 hover:scale-105 active:scale-95'}`}
                                    >
                                        <CalendarIcon className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                                        {isSyncing ? 'Syncing...' : 'Sync to Calendar'}
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* View Toggle & Content */}
                        <div className="space-y-8">
                            {/* Wrapper for AnimatePresence to ensure layout stability */}
                            <div className="relative min-h-[600px]">
                                <AnimatePresence mode="wait">
                                    {viewMode === 'vision' ? (
                                        <motion.div
                                            key="vision"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className="relative mx-auto w-full max-w-xl flex flex-col items-center gap-8"
                                        >
                                            {/* Vision Board Card (Image Only) */}
                                            <div className="relative w-full max-w-[44rem] aspect-square rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-2xl group flex-shrink-0 bg-black/40">
                                                {/* AI Generated Image */}
                                                <img
                                                    key={imgSeed}
                                                    src={displayImage}
                                                    alt="Vision Visualization"
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
                                                />
                                            </div>

                                            {/* Content Below Image (Profile Style) */}
                                            <div
                                                className="flex flex-col items-center text-center space-y-6 mx-auto w-full max-w-[44rem]"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="text-brand-indigo text-xs font-bold uppercase tracking-wider">
                                                        {showDynamicImage ? "AI Vision" : "Legacy Artifact"}
                                                    </div>
                                                </div>

                                                <h2 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight drop-shadow-sm break-words w-full">
                                                    {plan.title}
                                                </h2>

                                                {plan.visionaryDescription && (
                                                    <p className="text-xl md:text-2xl text-slate-300 font-medium italic break-words leading-relaxed w-full">
                                                        "{plan.visionaryDescription}"
                                                    </p>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap justify-center gap-5 mt-6 w-full">
                                                    <button
                                                        onClick={() => setImgSeed(prev => prev + 1)}
                                                        className="px-7 py-3 rounded-full bg-white text-black text-base font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 hover:scale-105 active:scale-95 duration-200"
                                                    >
                                                        <Sparkles className="w-5 h-5" />
                                                        Remix
                                                    </button>

                                                    {onDelete && (
                                                        <button
                                                            onClick={onDelete}
                                                            className="px-7 py-3 rounded-full bg-red-500/10 text-red-500 text-base font-bold flex items-center gap-2 hover:bg-red-500/20 transition-colors border border-red-500/20 hover:scale-105 active:scale-95 duration-200"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : viewMode === 'timeline' ? (
                                        <motion.div
                                            key="timeline"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="relative"
                                        >
                                            <div className={`relative p-8 rounded-3xl backdrop-blur-sm ${themeId === 'moon' ? 'bg-slate-900/50' : 'bg-white/40'}`}>
                                                <div className="absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-transparent via-brand-purple/50 to-transparent" />
                                                <div className="space-y-12 relative">
                                                    {plan.timeline.map((item, milestoneIndex) => {
                                                        // Calculate milestone completion
                                                        const milestoneSteps = item.steps?.length || 0;
                                                        const completedMilestoneSteps = item.steps?.filter((_, stepIdx) =>
                                                            isStepCompleted(milestoneIndex, stepIdx)
                                                        ).length || 0;
                                                        const isMilestoneComplete = milestoneSteps > 0 && completedMilestoneSteps === milestoneSteps;

                                                        // Calculate if this is the active milestone (first incomplete one)
                                                        let isActive = false;
                                                        if (!isMilestoneComplete) {
                                                            const prevMilestoneComplete = milestoneIndex === 0 ||
                                                                (plan.timeline[milestoneIndex - 1].steps?.every((_, idx) => isStepCompleted(milestoneIndex - 1, idx)) ?? true);
                                                            isActive = prevMilestoneComplete;
                                                        }

                                                        return (
                                                            <motion.div
                                                                key={milestoneIndex}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                whileInView={{ opacity: 1, x: 0 }}
                                                                viewport={{ once: true }}
                                                                transition={{ delay: milestoneIndex * 0.1 }}
                                                                className={`relative pl-12 group ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100 transition-opacity'}`}
                                                            >
                                                                {/* Milestone Dot */}
                                                                <div className={`absolute left-[29px] top-0 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 transition-all duration-500 z-10 
                                                    ${isMilestoneComplete
                                                                        ? 'bg-brand-teal border-brand-teal shadow-[0_0_10px_rgba(45,212,191,0.5)] scale-110'
                                                                        : isActive
                                                                            ? 'bg-brand-purple border-white shadow-[0_0_15px_rgba(139,92,246,0.6)] animate-pulse scale-125'
                                                                            : 'bg-slate-800 border-slate-600'}`}
                                                                />

                                                                {/* Content Card */}
                                                                {/* Content Card */}
                                                                <div
                                                                    className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group-hover:shadow-lg group-hover:shadow-brand-purple/5"
                                                                    onClick={() => {
                                                                        setSelectedMilestone(item);
                                                                        setSelectedMilestoneIndex(milestoneIndex);
                                                                    }}
                                                                >
                                                                    <MilestoneContainer>
                                                                        <div className={`relative p-5 md:p-6 transition-colors rounded-2xl ${themeId === 'tree' ? '' : 'bg-transparent'}`}>
                                                                            <div className="flex flex-col gap-3 items-center text-center">
                                                                                {/* Title Row */}
                                                                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                                                                    <h4 className={`text-lg md:text-xl font-bold font-display leading-tight ${isMilestoneComplete ? 'text-brand-teal line-through opacity-70' : 'text-white'
                                                                                        }`}>
                                                                                        {item.milestone}
                                                                                    </h4>
                                                                                    {isMilestoneComplete && (
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2 py-1 rounded-full">
                                                                                            Completed
                                                                                        </span>
                                                                                    )}
                                                                                    {isActive && !isMilestoneComplete && (
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple bg-brand-purple/10 px-2 py-1 rounded-full animate-pulse">
                                                                                            In Progress
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Date Badge - Minimalist for spheres */}
                                                                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full ${themeId === 'tree' || themeId === 'brain' || themeId === 'space' ? 'text-white/60' : 'text-cyan-200/80'}`}>
                                                                                    {item.date}
                                                                                </span>

                                                                                {/* Description - Readable, High Contrast, Centered */}
                                                                                <div className="flex-1 w-full flex items-center justify-center overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                                                    <p className="text-[11px] md:text-xs text-center text-slate-100 font-medium leading-relaxed max-w-[90%] drop-shadow-md tracking-wide px-2">
                                                                                        {item.description}
                                                                                    </p>
                                                                                </div>

                                                                                {/* Interaction Hint */}
                                                                                <div className="flex-shrink-0 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-white/90 uppercase tracking-[0.2em] drop-shadow-md pb-1">
                                                                                    Tap to Expand
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </MilestoneContainer>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="calendar"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <CalendarView
                                                plan={plan}
                                                onSelectEvent={(milestone, index) => {
                                                    setSelectedMilestone(milestone);
                                                    setSelectedMilestoneIndex(index);
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Resources */}
                        {plan.sources.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mt-20 w-full max-w-[44rem] mx-auto"
                            >
                                <div className="flex flex-col items-center gap-6 mb-10 text-center">
                                    <h3 className="text-3xl font-bold font-display text-white/90">Curated Resources</h3>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {plan.sources.map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group hover:scale-[1.01]"
                                        >
                                            <div className="flex-1 min-w-0 pr-5 text-left">
                                                <h4 className="font-bold text-slate-100 text-lg truncate mb-0.5 group-hover:text-white transition-colors">
                                                    {source.title}
                                                </h4>
                                                <p className="text-sm text-slate-400 truncate opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {(() => { try { return new URL(source.url).hostname; } catch { return source.url; } })()}
                                                </p>
                                            </div>
                                            <ExternalLink className="w-6 h-6 text-slate-400 group-hover:text-brand-purple transition-colors flex-shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}


                        {/* Detail Modal */}
                        <MilestoneModal
                            isOpen={!!selectedMilestone}
                            onClose={() => setSelectedMilestone(null)}
                            milestone={selectedMilestone}
                            milestoneIndex={selectedMilestoneIndex}
                            completedSteps={completedSteps}
                            onStepComplete={handleStepComplete}
                            goalId={goalId}
                            goalTitle={plan.title}
                        />
                    </div>

                    {/* The Guide AI Assistant - outside main content for fixed positioning */}
                    < TheGuide goal={plan.title} plan={plan} context={{ currentLocation: 'planet' }} onUpdatePlan={onUpdatePlan} />

                    {/* Achievement Celebration Overlay */}
                    {
                        activeAchievement && achievementVisible && (
                            <AchievementCelebration
                                achievement={activeAchievement}
                                onDismiss={handleAchievementDismiss}
                            />
                        )
                    }
                </div >
            </div >
        </ErrorBoundary >
    );
};
