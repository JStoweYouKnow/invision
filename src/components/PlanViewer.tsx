import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, LayoutList, Trophy, Sparkles, Share2, Globe, Lock, Trash2, ExternalLink, Download, Pause, Play } from 'lucide-react';
import type { GeneratedPlan } from '@/lib/gemini';
import { TheGuide } from '@/components/TheGuide';
import { CalendarView } from '@/components/CalendarView';
import { MilestoneModal } from '@/components/MilestoneModal';
import { AchievementCelebration } from '@/components/AchievementCelebration';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Achievement, AchievementType, DateChange, PauseRecord, StepChange } from '@/types';
import { Fireworks } from '@/components/Fireworks';
// import { useAuth } from '@/contexts/AuthContext';
import { ThemeBackground } from '@/components/backgrounds';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
// import { TimelineNode } from '@/components/themes/TimelineNode';
import { useTheme } from '@/contexts/ThemeContext';
import { ExportModal } from '@/components/ExportModal';
import { Tooltip } from '@/components/TooltipSystem';
import { PauseGoalModal } from '@/components/PauseGoalModal';
import { GoalInsights } from '@/components/GoalInsights';

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
    onProgressChange?: (completed: number, total: number) => void;
    isReadOnly?: boolean; // Prevents milestone/step completion for non-owners
    authorName?: string; // Goal owner's name for header display
    // Pause functionality
    isPaused?: boolean;
    pausedAt?: number;
    pauseReason?: string;
    pauseReasonCategory?: PauseRecord['reasonCategory'];
    pauseHistory?: PauseRecord[];
    onPause?: (reason: string, reasonCategory: PauseRecord['reasonCategory']) => void;
    onResume?: () => void;
    // Date change callback
    onMilestoneDateChange?: (milestoneIndex: number, newDate: string, change: DateChange) => void;
    // Step change callback
    onMilestoneStepsChange?: (milestoneIndex: number, steps: { text: string; date: string; habit?: string }[], changes: StepChange[]) => void;
    // For insights
    goalCreatedAt?: number;
}

// const QUOTES = [
//     { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
//     { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
//     { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
//     { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
//     { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" }
// ];

import { calendarService } from '@/lib/calendar';

export const PlanViewer: React.FC<PlanViewerProps> = ({
    plan,
    visionImage,
    onGoHome,
    isPublic,
    onTogglePublic,
    standalone = true,
    onUpdatePlan,
    goalId,
    onDelete,
    onProgressChange,
    isReadOnly = false,
    authorName,
    // Pause props
    isPaused = false,
    pausedAt,
    pauseReason,
    pauseHistory = [],
    onPause,
    onResume,
    // Date change props
    onMilestoneDateChange,
    onMilestoneStepsChange,
    goalCreatedAt = Date.now(),
}) => {

    // const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'vision'>('vision'); // Debug: default to vision
    const [isSyncing, setIsSyncing] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

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

    const displayImage = getDynamicUrl(visionImage, 0);
    const showDynamicImage = (visionImage && (visionImage.includes('pollinations.ai') || visionImage.startsWith('data:image/'))) || (visionImage && isPlaceholder(visionImage));

    // Select quote based on seed (pseudo-random but consistent for same seed)
    // Select quote based on seed (pseudo-random but consistent for same seed)
    // const quoteIndex = imgSeed % QUOTES.length;
    // const currentQuote = QUOTES[quoteIndex] || QUOTES[0]; // Fallback safety

    const { currentTheme } = useTheme();
    // cast currentTheme.id to string to avoid type error if strict unions don't overlap
    // cast currentTheme.id to string to avoid type error if strict unions don't overlap

    // ... render ...

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

    // Calculate progress
    const totalSteps = Array.isArray(plan.timeline)
        ? plan.timeline.reduce((acc, item) => acc + (item.steps?.length || 0), 0)
        : 0;
    const completedCount = completedSteps.size;

    // Notify parent of progress changes
    useEffect(() => {
        onProgressChange?.(completedCount, totalSteps);
    }, [completedCount, totalSteps, onProgressChange]);

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
            <div className={standalone ? "h-screen bg-transparent text-foreground relative overflow-hidden flex flex-col" : "relative"}>
                {/* Theme Background only if standalone */}
                {standalone && <ThemeBackground className="z-0" />}

                {/* Main Content */}
                <div className={`relative z-10 w-full max-w-6xl mx-auto flex flex-col flex-1 overflow-hidden ${standalone ? "p-4 md:p-6" : ""}`}>
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

                    {/* Home Button & Theme Toggle - Compact Header */}
                    {standalone && (
                        <div className="flex items-center justify-between shrink-0 py-2">
                            {onGoHome && (
                                <motion.button
                                    onClick={onGoHome}
                                    whileHover={{ scale: 1.02, opacity: 0.9 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 group transition-all duration-300 bg-transparent border-none p-0 outline-none"
                                >
                                    <img src="/images/galaxy-bubble-v2.png" alt="InVision logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                                    <span className="font-display tracking-tight leading-[0.9] italic text-white text-2xl font-black">InVision</span>
                                </motion.button>
                            )}
                            <ThemeQuickToggle />
                        </div>
                    )}



                    {/* View Toggle & Content - Fills remaining space */}
                    <div className="flex flex-col flex-1 min-h-0 gap-2 md:gap-4">
                        {/* Header with title and controls */}
                        <div className="flex flex-col items-center gap-2 md:gap-3 shrink-0">
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-center">{authorName ? `${authorName}'s Vision` : 'Your Vision'}</h2>

                            {/* Mobile-friendly button layout: stacks on small screens */}
                            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2">
                                {/* View Mode Buttons */}
                                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full backdrop-blur-md">
                                    <button
                                        onClick={() => setViewMode('vision')}
                                        className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 transition-colors ${viewMode === 'vision'
                                            ? 'text-white shadow-lg shadow-white/10'
                                            : 'btn--ghost text-muted-foreground hover:text-white'
                                            }`}
                                        style={{
                                            backgroundColor: viewMode === 'vision' ? currentTheme.colors.primary : 'transparent',
                                            borderColor: viewMode === 'vision' ? currentTheme.colors.primary : 'transparent'
                                        }}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span className="hidden sm:inline">Vision</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('timeline')}
                                        className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 transition-colors ${viewMode === 'timeline'
                                            ? 'text-white shadow-lg shadow-white/10'
                                            : 'btn--ghost text-muted-foreground hover:text-white'
                                            }`}
                                        style={{
                                            backgroundColor: viewMode === 'timeline' ? currentTheme.colors.primary : 'transparent',
                                            borderColor: viewMode === 'timeline' ? currentTheme.colors.primary : 'transparent'
                                        }}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                        <span className="hidden sm:inline">Timeline</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 transition-colors ${viewMode === 'calendar'
                                            ? 'text-white shadow-lg shadow-white/10'
                                            : 'btn--ghost text-muted-foreground hover:text-white'
                                            }`}
                                        style={{
                                            backgroundColor: viewMode === 'calendar' ? currentTheme.colors.primary : 'transparent',
                                            borderColor: viewMode === 'calendar' ? currentTheme.colors.primary : 'transparent'
                                        }}
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Calendar</span>
                                    </button>
                                </div>

                                {/* Action Buttons - Separate group for mobile */}
                                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full backdrop-blur-md">
                                    {onTogglePublic && (
                                        <button
                                            onClick={onTogglePublic}
                                            className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 ${isPublic
                                                ? 'btn--ghost hover:opacity-80'
                                                : 'btn--ghost text-muted-foreground hover:text-white'
                                                }`}
                                            style={{ color: isPublic ? currentTheme.colors.accent : undefined }}
                                            title={isPublic ? "Public" : "Private"}
                                        >
                                            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isPublic ? 'Public' : 'Private'}</span>
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
                                        className="btn btn--ghost btn--sm gap-1.5 min-h-[44px] sm:min-h-0 hover:opacity-80"
                                        style={{ color: currentTheme.colors.accent }}
                                        title="Share"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Share</span>
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
                                        className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 ${isSyncing
                                            ? 'btn--ghost text-muted-foreground opacity-50 cursor-not-allowed'
                                            : 'btn--ghost hover:opacity-80'}`}
                                        style={{ color: isSyncing ? undefined : currentTheme.colors.accent }}
                                        title="Sync to Calendar"
                                    >
                                        <CalendarIcon className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                                        <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                                    </button>
                                    <Tooltip id="export-plan" content="Export Plan" position="bottom">
                                        <button
                                            onClick={() => setShowExportModal(true)}
                                            className="btn btn--ghost btn--sm gap-1.5 min-h-[44px] sm:min-h-0 hover:opacity-80"
                                            style={{ color: currentTheme.colors.accent }}
                                        >
                                            <Download className="w-4 h-4" />
                                            <span className="hidden sm:inline">Export</span>
                                        </button>
                                    </Tooltip>
                                    {/* Pause/Resume Button */}
                                    {(onPause || onResume) && !isReadOnly && (
                                        <button
                                            onClick={() => setShowPauseModal(true)}
                                            className={`btn btn--sm gap-1.5 min-h-[44px] sm:min-h-0 ${isPaused
                                                ? 'btn--ghost text-blue-400 hover:text-blue-300'
                                                : 'btn--ghost text-slate-400 hover:text-slate-300'
                                                }`}
                                            title={isPaused ? "Resume Goal" : "Pause Goal"}
                                        >
                                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={onDelete}
                                            className="btn btn--ghost btn--sm gap-1.5 min-h-[44px] sm:min-h-0 hover:opacity-80 text-red-400 hover:text-red-300"
                                            title="Delete Vision"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Paused Banner */}
                            {isPaused && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm"
                                >
                                    <Pause className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200 text-sm font-medium">
                                        Goal paused{pauseReason ? `: ${pauseReason}` : ''}
                                    </span>
                                    <button
                                        onClick={() => setShowPauseModal(true)}
                                        className="text-xs text-blue-300 hover:text-blue-100 underline"
                                    >
                                        Resume
                                    </button>
                                </motion.div>
                            )}

                            {/* Goal Insights - Show if there are date changes */}
                            {!isReadOnly && (
                                <GoalInsights
                                    plan={plan}
                                    pauseHistory={pauseHistory}
                                    goalCreatedAt={goalCreatedAt}
                                    compact={false}
                                    className="mt-2"
                                />
                            )}

                        </div>

                        {/* View Content - Fills remaining space */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {viewMode === 'vision' ? (
                                    <motion.div
                                        key="vision"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full"
                                    >
                                        {/* Editorial Card Container - Fits viewport */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full border border-white/10">

                                            {/* Left Column: Image (smaller to give more room to content) */}
                                            <div className="w-full md:w-2/5 relative bg-black/40 min-h-[180px] md:min-h-0 shrink-0">
                                                <img
                                                    src={displayImage}
                                                    alt="Vision Visualization"
                                                    className="w-full h-full object-cover absolute inset-0 transform hover:scale-105 transition-transform duration-[2s] ease-in-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-30" />
                                            </div>

                                            {/* Right Column: Content (larger for full text + resources) */}
                                            <div className="w-full md:w-3/5 p-5 md:p-6 flex flex-col items-start text-left relative overflow-y-auto">

                                                {/* Badge + Title Row */}
                                                <div className="flex items-start gap-3 mb-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 mt-1 ${showDynamicImage
                                                        ? 'bg-brand-indigo/20 border-brand-indigo/50 text-brand-indigo'
                                                        : 'bg-slate-700/30 border-slate-600 text-slate-400'
                                                        }`}>
                                                        {showDynamicImage ? "AI" : "Legacy"}
                                                    </span>
                                                    <h2 className="text-xl md:text-2xl font-bold font-sans text-white leading-tight drop-shadow-sm">
                                                        {plan.title}
                                                    </h2>
                                                </div>

                                                {/* Description - Full text */}
                                                {plan.visionaryDescription && (
                                                    <p className="text-sm text-slate-300 font-medium italic leading-relaxed mb-3 opacity-90">
                                                        "{plan.visionaryDescription}"
                                                    </p>
                                                )}

                                                {/* Resources - Compact inline list */}
                                                {plan.sources && plan.sources.length > 0 && (
                                                    <div className="w-full mb-3">
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Resources</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {plan.sources.slice(0, 4).map((source, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={source.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors truncate max-w-[180px]"
                                                                >
                                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">{source.title}</span>
                                                                </a>
                                                            ))}
                                                            {plan.sources.length > 4 && (
                                                                <span className="text-xs text-white/40 self-center">+{plan.sources.length - 4} more</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                {onDelete && (
                                                    <div className="mt-auto pt-3 w-full flex justify-start gap-3 border-t border-white/10">
                                                        <button
                                                            onClick={onDelete}
                                                            className="btn btn--destructive btn--sm gap-2 opacity-80 hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : viewMode === 'timeline' ? (
                                    <motion.div
                                        key="timeline"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full"
                                    >
                                        {/* Galaxy Grid Layout with Stars */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 pb-12 pt-4 px-4">
                                            {plan.timeline.map((item, milestoneIndex) => {
                                                // Calculate milestone completion
                                                const milestoneSteps = item.steps?.length || 0;
                                                const completedMilestoneSteps = item.steps?.filter((_, stepIdx) =>
                                                    isStepCompleted(milestoneIndex, stepIdx)
                                                ).length || 0;
                                                const isMilestoneComplete = milestoneSteps > 0 && completedMilestoneSteps === milestoneSteps;
                                                const progress = milestoneSteps > 0 ? (completedMilestoneSteps / milestoneSteps) * 100 : 0;

                                                // Calculate if this is the active milestone (first incomplete one)
                                                let isActive = false;
                                                if (!isMilestoneComplete) {
                                                    const prevMilestoneComplete = milestoneIndex === 0 ||
                                                        (plan.timeline[milestoneIndex - 1].steps?.every((_, idx) => isStepCompleted(milestoneIndex - 1, idx)) ?? true);
                                                    isActive = prevMilestoneComplete;
                                                }

                                                // Determine styles based on theme
                                                const getThemeStyles = () => {
                                                    const themeId = currentTheme?.id || 'moon';

                                                    // Brain Theme - Neurons
                                                    if (themeId === 'brain') {
                                                        return {
                                                            shape: '60% 40% 30% 70% / 60% 30% 70% 40%', // Neuron blob
                                                            gradient: isMilestoneComplete
                                                                ? 'radial-gradient(circle at 30% 30%, #2dd4bf, #0f766e)'
                                                                : isActive
                                                                    ? 'radial-gradient(circle at 30% 30%, #c084fc, #7e22ce)'
                                                                    : 'radial-gradient(circle at 30% 30%, #e2e8f0, #64748b)',
                                                            shadow: isMilestoneComplete
                                                                ? '0 0 40px rgba(45,212,191,0.6), inset 0 0 20px rgba(255,255,255,0.4)'
                                                                : isActive
                                                                    ? '0 0 50px rgba(168,85,247,0.6), inset 0 0 20px rgba(255,255,255,0.4)'
                                                                    : '0 0 20px rgba(255,255,255,0.1)',
                                                            texture: false,
                                                            planetOverlay: false
                                                        };
                                                    }

                                                    // Tree Theme - Seeds/Eggs
                                                    if (themeId === 'tree') {
                                                        return {
                                                            shape: '50% 50% 50% 50% / 60% 60% 40% 40%', // Seed/Egg
                                                            gradient: isMilestoneComplete
                                                                ? 'radial-gradient(circle at 40% 40%, #34d399, #059669)' // Emerald
                                                                : isActive
                                                                    ? 'radial-gradient(circle at 40% 40%, #fbbf24, #b45309)' // Amber
                                                                    : 'radial-gradient(circle at 40% 40%, #94a3b8, #475569)', // Slate
                                                            shadow: isMilestoneComplete
                                                                ? 'inset 5px 5px 10px rgba(255,255,255,0.3), 0 10px 20px rgba(0,0,0,0.3)'
                                                                : isActive
                                                                    ? 'inset 5px 5px 10px rgba(255,255,255,0.3), 0 10px 25px rgba(0,0,0,0.4)'
                                                                    : 'inset 2px 2px 5px rgba(255,255,255,0.1)',
                                                            texture: true, // Wood grain needed
                                                            planetOverlay: false
                                                        };
                                                    }

                                                    // Default: Cosmic / Moon (Planets)
                                                    return {
                                                        shape: '50%', // Perfect Circle
                                                        gradient: isMilestoneComplete
                                                            ? 'radial-gradient(circle at 30% 30%, #5eead4, #0d9488 40%, #115e59 80%, #042f2e 100%)'
                                                            : isActive
                                                                ? 'radial-gradient(circle at 35% 35%, #c4b5fd, #8b5cf6 40%, #5b21b6 80%, #2e1065 100%)'
                                                                : 'radial-gradient(circle at 30% 30%, #e2e8f0, #94a3b8 40%, #475569 80%, #0f172a 100%)',
                                                        shadow: isMilestoneComplete
                                                            ? 'inset -10px -10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(45,212,191,0.3)'
                                                            : isActive
                                                                ? 'inset -10px -10px 40px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.4)'
                                                                : 'inset -8px -8px 20px rgba(0,0,0,0.7)',
                                                        planetOverlay: true,
                                                        texture: false
                                                    };
                                                };

                                                const themeStyles = getThemeStyles();
                                                const currentThemeId = currentTheme?.id || 'moon';

                                                return (
                                                    <motion.div
                                                        key={milestoneIndex}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: milestoneIndex * 0.1, duration: 0.6, type: 'spring' }}
                                                        className="flex flex-col items-center group relative"
                                                        style={{ zIndex: isActive ? 10 : 0 }}
                                                    >
                                                        {/* Floating Label (Date) - Above */}
                                                        <motion.div
                                                            className="mb-3 opacity-60 group-hover:opacity-100 transition-opacity"
                                                            initial={{ y: 10, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 0.6 }}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                                                                {item.date}
                                                            </span>
                                                        </motion.div>

                                                        {/* The Theme-Aware Node */}
                                                        <div
                                                            className="relative cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedMilestone(item);
                                                                setSelectedMilestoneIndex(milestoneIndex);
                                                            }}
                                                        >
                                                            {/* Main Shape Graphic */}
                                                            <motion.div
                                                                whileHover={{ scale: 1.1, rotate: currentThemeId === 'brain' ? 10 : 5 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className={`w-24 h-24 md:w-32 md:h-32 transition-all duration-700 ease-out relative overflow-hidden`}
                                                                style={{
                                                                    borderRadius: themeStyles.shape,
                                                                    background: themeStyles.gradient,
                                                                    boxShadow: themeStyles.shadow,
                                                                    // Breathing animation for brain theme
                                                                    ...(currentThemeId === 'brain' && isActive ? {
                                                                        animation: 'pulse 3s infinite'
                                                                    } : {})
                                                                }}
                                                            >
                                                                {/* Internal Texture/Overlays */}

                                                                {/* Noise Filter (Universal texture) */}
                                                                <div className="absolute inset-0 opacity-40 mix-blend-overlay"
                                                                    style={{
                                                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                                                                        filter: 'contrast(120%) brightness(110%)'
                                                                    }}
                                                                />

                                                                {/* Specific Overlays */}
                                                                {/* Ring for Active Planet */}
                                                                {themeStyles.planetOverlay && isActive && !isMilestoneComplete && (
                                                                    <div className="absolute inset-[-10%] border-[6px] border-white/10 rounded-full skew-x-12 skew-y-12 scale-110 blur-[1px]" />
                                                                )}

                                                                {/* Tree Texture */}
                                                                {themeStyles.texture && currentThemeId === 'tree' && (
                                                                    <div className="absolute inset-0 opacity-30 mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                                                )}

                                                                {/* Shadow side overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 pointer-events-none"
                                                                    style={{ borderRadius: 'inherit' }}
                                                                />
                                                            </motion.div>

                                                            {/* Status Indicator Floating Near Node */}
                                                            <div className="absolute -bottom-2 -right-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 shadow-lg z-20">
                                                                {isMilestoneComplete ? (
                                                                    <span className="text-teal-400 font-bold text-xs flex items-center gap-1">
                                                                        <span className="text-[10px]">✓</span> Done
                                                                    </span>
                                                                ) : isActive ? (
                                                                    <span className={`${currentThemeId === 'tree' ? 'text-amber-400' : 'text-purple-400'} font-bold text-xs animate-pulse`}>
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[10px] font-medium">
                                                                        #{milestoneIndex + 1}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Floating Details (Below) */}
                                                        <div className="mt-6 text-center z-10 max-w-[180px]">
                                                            <h4 className={`text-sm md:text-base font-bold font-display leading-tight mb-2 transition-colors duration-300 ${isMilestoneComplete ? 'text-teal-100 text-shadow-teal' : isActive ? 'text-purple-100 text-shadow-purple' : 'text-slate-400'
                                                                }`}>
                                                                {item.milestone}
                                                            </h4>

                                                            {/* Progress or Description */}
                                                            {/* Only show progress bar if active or complete, otherwise subtle description */}
                                                            {(isActive || isMilestoneComplete) ? (
                                                                <div className="w-24 mx-auto space-y-1.5">
                                                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${progress}%` }}
                                                                            transition={{ duration: 1, delay: 0.5 }}
                                                                            className={`h-full ${isMilestoneComplete
                                                                                ? 'bg-teal-400'
                                                                                : currentThemeId === 'tree' ? 'bg-amber-500' : 'bg-purple-500'
                                                                                }`}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[9px] text-blue-200/50 uppercase tracking-widest">
                                                                        {completedMilestoneSteps}/{milestoneSteps} Steps
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed px-2">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Connector Line to Next Node (if not last) */}
                                                        {milestoneIndex < plan.timeline.length - 1 && (
                                                            <div className={`hidden lg:block absolute top-[4rem] -right-[50%] w-[80%] h-[1px] -z-10 
                                                                ${isMilestoneComplete
                                                                    ? 'bg-gradient-to-r from-teal-500/30 to-slate-700/30'
                                                                    : 'bg-gradient-to-r from-slate-700/30 to-slate-800/30'
                                                                }`}
                                                            />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
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

                    {/* Detail Modal */}
                    <MilestoneModal
                        isOpen={!!selectedMilestone}
                        onClose={() => setSelectedMilestone(null)}
                        milestone={selectedMilestone}
                        milestoneIndex={selectedMilestoneIndex}
                        completedSteps={completedSteps}
                        onStepComplete={handleStepComplete}
                        onDateChange={onMilestoneDateChange}
                        onStepsChange={onMilestoneStepsChange}
                        goalId={goalId}
                        goalTitle={plan.title}
                        isReadOnly={isReadOnly}
                    />

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

                    {/* Export Modal */}
                    <ExportModal
                        isOpen={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        plan={plan}
                        goalTitle={plan.title}
                        exportRef={exportRef as React.RefObject<HTMLElement>}
                    />

                    {/* Pause Goal Modal */}
                    {(onPause || onResume) && (
                        <PauseGoalModal
                            isOpen={showPauseModal}
                            onClose={() => setShowPauseModal(false)}
                            goalTitle={plan.title}
                            isPaused={isPaused}
                            pausedAt={pausedAt}
                            pauseReason={pauseReason}
                            pauseHistory={pauseHistory}
                            onPause={(reason, category) => {
                                onPause?.(reason, category);
                                setShowPauseModal(false);
                            }}
                            onResume={() => {
                                onResume?.();
                                setShowPauseModal(false);
                            }}
                        />
                    )}
                </div >
            </div >
        </ErrorBoundary >
    );
};
