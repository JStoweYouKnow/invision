import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Tooltip } from '@/components/TooltipSystem';
import { Calendar, ArrowRight, Globe, Grid3X3, Sun, Brain, TreeDeciduous, Network, Leaf, Lock, BarChart3 } from 'lucide-react';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import { MOCK_GOALS } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CosmicJourneyView } from '@/components/CosmicJourneyView';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
import { ThemeBackground } from '@/components/backgrounds';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { SkeletonDashboard } from '@/components/Skeleton';
import { CosmosMap3D } from '@/components/3d';

interface DashboardProps {
    demoMode?: boolean;
}

// Theme-specific view mode labels and icons
const themeViewModes = {
    space: {
        cosmos: { label: 'Cosmos', icon: Globe },
        solar: { label: 'Solar', icon: Sun },
    },
    brain: {
        cosmos: { label: 'Network', icon: Network },
        solar: { label: 'Synapse', icon: Brain },
    },
    tree: {
        cosmos: { label: 'Tree', icon: TreeDeciduous },
        solar: { label: 'Forest', icon: Leaf },
    },
    custom: {
        cosmos: { label: 'Cosmos', icon: Globe },
        solar: { label: 'Solar', icon: Sun },
    },
};

export const Dashboard: React.FC<DashboardProps> = ({ demoMode = false }) => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const [goals, setGoals] = useState<SavedGoal[]>([]);
    const [loading, setLoading] = useState(!demoMode);
    const [viewMode, setViewMode] = useState<'grid' | 'cosmos' | 'solar' | '3d' | 'analytics'>('grid');

    useEffect(() => {
        if (demoMode) {
            setGoals(MOCK_GOALS);
            return;
        }

        if (user) {
            const fetchGoals = async () => {
                try {
                    const userGoals = await firestoreService.getUserGoals(user.uid);
                    setGoals(userGoals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
                } catch (error) {
                    console.error("Failed to fetch goals", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchGoals();
        }
    }, [user, demoMode]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden">
                <ThemeBackground className="z-0" />
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 relative z-10">
                    <SkeletonDashboard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden">
            {/* Theme Background */}
            <ThemeBackground className="z-0" />

            {/* Fixed Logo & Theme Toggle Top Left */}
            <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-4 md:gap-14">
                <HomeButton />
                <ThemeQuickToggle />
            </div>

            <div className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center justify-center gap-4 mb-8 pt-8">
                    <div className="text-center flex flex-col items-center gap-4">
                        <h1 className="text-2xl md:text-4xl font-display font-bold mb-2 tracking-tight">My Visions</h1>

                        {/* Menu Options */}
                        <div className="relative z-40">
                            <NavigationMenu demoMode={demoMode} />
                        </div>

                        <p className="text-base md:text-lg text-slate-300">Track your progress and revisit your visions.</p>
                    </div>
                </div>

                {/* View Toggles - Centered below */}
                <div className="flex justify-center mb-8 relative z-30">

                    {/* View Toggle */}
                    <div role="tablist" aria-label="View mode" className="flex p-1 bg-white/10 rounded-full border border-white/10 shrink-0">
                        <button
                            role="tab"
                            aria-selected={viewMode === 'grid'}
                            aria-label="Grid view"
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'grid'
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
                            Grid
                        </button>
                        <Tooltip id="view-cosmos" content={<div><span className="font-bold">Cosmic Journey</span><br />Explore your visions as a celestial map.</div>} position="top">
                            <button
                                role="tab"
                                aria-selected={viewMode === 'cosmos'}
                                // ... existing props ...
                                onClick={() => setViewMode('cosmos')}
                                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'cosmos'
                                    ? 'bg-white text-black'
                                    : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                {(() => {
                                    const themeKey = currentTheme.id === 'custom' ? 'custom' : currentTheme.id;
                                    const config = themeViewModes[themeKey as keyof typeof themeViewModes]?.cosmos || themeViewModes.space.cosmos;
                                    const Icon = config.icon;
                                    return (
                                        <>
                                            <Icon className="w-4 h-4" />
                                            {config.label}
                                        </>
                                    );
                                })()}
                            </button>
                        </Tooltip>
                        <button
                            role="tab"
                            aria-selected={viewMode === 'solar'}
                            aria-label="Solar view"
                            onClick={() => setViewMode('solar')}
                            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'solar'
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            {(() => {
                                const themeKey = currentTheme.id === 'custom' ? 'custom' : currentTheme.id;
                                const config = themeViewModes[themeKey as keyof typeof themeViewModes]?.solar || themeViewModes.space.solar;
                                const Icon = config.icon;
                                return (
                                    <>
                                        <Icon className="w-4 h-4" />
                                        {config.label}
                                    </>
                                );
                            })()}
                        </button>
                        {/* 3D Toggle Removed - Merged into Solar View */}
                        <Tooltip id="view-analytics" content={<div><span className="font-bold">New: Analytics</span><br />Track your progress with charts & stats.</div>} position="top" forceVisible={goals.length > 0 && !localStorage.getItem('invision_seen_tooltips')?.includes('view-analytics')}>
                            <button
                                role="tab"
                                aria-selected={viewMode === 'analytics'}
                                aria-label="Analytics view"
                                onClick={() => setViewMode('analytics')}
                                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'analytics'
                                    ? 'bg-white text-black'
                                    : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                                Analytics
                            </button>
                        </Tooltip>
                    </div>

                </div>

                {goals.length === 0 ? (
                    <div className="text-center py-24 mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-8 h-8 text-white/60" />
                        </div>
                        <h2 className="text-2xl font-display font-bold mb-2 text-white">No visions yet</h2>
                        <p className="text-slate-300 mb-8 text-base max-w-md px-4">Your future is waiting to be written. Start by visualizing your first goal today.</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-3 rounded-full font-bold transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
                        >
                            Create a Vision
                        </Link>
                    </div>
                ) : viewMode === 'solar' ? (
                    <CosmosMap3D goals={goals} className="mb-8" />
                ) : viewMode === 'cosmos' ? (
                    <CosmicJourneyView goals={goals} />
                ) : viewMode === 'analytics' ? (
                    <AnalyticsDashboard />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-32">
                        {goals.map((goal, index) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="w-full"
                            >
                                <Link to={`/plan/${goal.id}`} className="group relative block w-full aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-lg transition-transform duration-500 hover:-translate-y-2 active:scale-[0.98]">
                                    {/* Image */}
                                    <div className="absolute inset-0 bg-slate-900">
                                        <img
                                            src={(!goal.visionImage || goal.visionImage.includes("images.unsplash.com"))
                                                ? `https://image.pollinations.ai/prompt/${encodeURIComponent(`cinematic shot of ${goal.title}, futuristic, inspirational, highly detailed, 8k`)}?width=800&height=1000&nologo=true`
                                                : goal.visionImage}
                                            alt={goal.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 md:group-hover:blur-[2px]"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 md:opacity-60 md:group-hover:opacity-90 transition-opacity duration-300" />
                                    </div>

                                    {/* Visibility Badge (Top Right) - Larger touch target on mobile */}
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            try {
                                                const newStatus = !goal.isPublic;
                                                await firestoreService.toggleVisibility(goal.id!, newStatus);
                                                setGoals(prev => prev.map(g =>
                                                    g.id === goal.id ? { ...g, isPublic: newStatus } : g
                                                ));
                                            } catch (error) {
                                                console.error("Failed to toggle visibility", error);
                                            }
                                        }}
                                        className={`absolute top-3 right-3 md:top-4 md:right-4 z-30 p-2.5 md:p-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95 ${goal.isPublic
                                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                            : 'bg-black/40 text-slate-400 hover:text-white hover:bg-black/60'
                                            }`}
                                        title={goal.isPublic ? "Public" : "Private"}
                                    >
                                        {goal.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </button>

                                    {/* Gallery Overlay Content */}
                                    <div className="absolute inset-0 z-20 p-4 md:p-6 flex flex-col justify-end">

                                        {/* Status Tag - Always visible on mobile */}
                                        <div className="mb-auto md:transform md:-translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300 delay-100">
                                            <span className="inline-block px-2.5 py-1 md:px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                                                In Progress
                                            </span>
                                        </div>

                                        <div className="md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300">
                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-white/60 text-[11px] md:text-xs font-medium uppercase tracking-widest mb-1.5 md:mb-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {goal.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>

                                            {/* Title - Smaller on mobile */}
                                            <h3 className="text-xl md:text-2xl font-bold font-sans text-white leading-tight mb-1.5 md:mb-2">
                                                {goal.title}
                                            </h3>

                                            {/* Description - Always visible on mobile, hidden on desktop until hover */}
                                            <div className="md:grid md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                                                <div className="md:overflow-hidden">
                                                    <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 mb-3 md:mb-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                                        {goal.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-brand-indigo text-[11px] md:text-xs font-bold uppercase tracking-wider">
                                                        View Vision <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};
