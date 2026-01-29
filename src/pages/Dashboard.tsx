import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Globe, Grid3X3, Sun, Brain, TreeDeciduous, Network, Leaf, Lock } from 'lucide-react';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import { MOCK_GOALS } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CosmicJourneyView } from '@/components/CosmicJourneyView';
import { SolarSystemHome } from '@/components/SolarSystemHome';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
import { ThemeBackground } from '@/components/backgrounds';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';

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
        cosmos: { label: 'Forest', icon: TreeDeciduous },
        solar: { label: 'Canopy', icon: Leaf },
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
    const [viewMode, setViewMode] = useState<'grid' | 'cosmos' | 'solar'>('solar'); // Default to solar for new feature

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
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden">
            {/* Theme Background */}
            <ThemeBackground className="z-0" />

            {/* Fixed Logo & Theme Toggle Top Left */}
            <div className="fixed top-6 left-6 z-50 flex items-center gap-14">
                <HomeButton />
                <ThemeQuickToggle />
            </div>

            <div className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center justify-center gap-4 mb-8 pt-8">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight">My Visions</h1>
                        <p className="text-lg text-slate-300">Track your progress and revisit your visions.</p>
                        <button
                            onClick={async () => {
                                if (window.confirm('Create dummy users (Sarah & David) for testing?')) {
                                    const { seedDummyData } = await import('@/lib/seeder');
                                    const result = await seedDummyData();
                                    alert(result.message);
                                }
                            }}
                            className="mt-4 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded shadow-lg hover:shadow-purple-500/25 transition-all mx-auto"
                        >
                            Seed Data
                        </button>
                    </div>
                </div>

                {/* Unified Navigation Bar */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {/* Menu Options */}
                    <NavigationMenu demoMode={demoMode} />

                    {/* Separator - visible on desktop */}
                    <div className="hidden md:block w-px h-6 bg-white/20" />

                    {/* View Toggle */}
                    <div role="tablist" aria-label="View mode" className="flex p-1 bg-white/10 rounded-full border border-white/10 shrink-0">
                        <button
                            role="tab"
                            aria-selected={viewMode === 'grid'}
                            aria-label="Grid view"
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'grid'
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
                            Grid
                        </button>
                        <button
                            role="tab"
                            aria-selected={viewMode === 'cosmos'}
                            aria-label="Cosmos view"
                            onClick={() => setViewMode('cosmos')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'cosmos'
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
                        <button
                            role="tab"
                            aria-selected={viewMode === 'solar'}
                            aria-label="Solar view"
                            onClick={() => setViewMode('solar')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none ${viewMode === 'solar'
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
                    </div>

                    {/* Separator */}
                    <div className="hidden md:block w-px h-6 bg-white/20" />

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
                    <SolarSystemHome goals={goals} />
                ) : viewMode === 'cosmos' ? (
                    <CosmicJourneyView goals={goals} />
                ) : (
                    <div className="flex flex-col items-center gap-24 pb-32">
                        {goals.map((goal, index) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="w-full max-w-[44rem]"
                            >
                                <Link to={`/plan/${goal.id}`} className="group flex flex-col items-center gap-8">
                                    {/* Image Container */}
                                    <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-black/40 transition-transform duration-500 group-hover:scale-[1.02]">
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10" />
                                        <img
                                            src={(!goal.visionImage || goal.visionImage.includes("images.unsplash.com"))
                                                ? `https://image.pollinations.ai/prompt/${encodeURIComponent(`cinematic shot of ${goal.title}, futuristic, inspirational, highly detailed, 8k`)}?width=1024&height=1024&nologo=true`
                                                : goal.visionImage}
                                            alt={goal.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Status & Visibility Badges */}
                                        <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 items-end">
                                            <span className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider">
                                                In Progress
                                            </span>

                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault(); // Prevent navigation
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
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${goal.isPublic
                                                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                                    : 'bg-black/40 text-slate-400 hover:text-white hover:bg-black/60'
                                                    }`}
                                            >
                                                {goal.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                {goal.isPublic ? 'Public' : 'Private'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Below */}
                                    <div className="flex flex-col items-center text-center space-y-4 w-full px-4">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm font-medium uppercase tracking-widest">
                                                {goal.createdAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <h3 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight group-hover:text-brand-purple transition-colors duration-300">
                                            {goal.title}
                                        </h3>

                                        <p className="text-lg text-slate-300 font-medium leading-relaxed line-clamp-2 max-w-2xl">
                                            {goal.description}
                                        </p>

                                        <div className="pt-2 text-brand-indigo font-bold text-sm uppercase tracking-widest flex items-center gap-2 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            Continue Journey <ArrowRight className="w-4 h-4" />
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
