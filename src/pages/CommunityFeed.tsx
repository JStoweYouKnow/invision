import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User as UserIcon, ArrowLeft, Sparkles } from 'lucide-react';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import { MOCK_GOALS } from '@/lib/mockData';
import { ThemeEntity } from '@/components/ThemeEntity';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeBackground } from '@/components/backgrounds';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';

interface CommunityFeedProps {
    demoMode?: boolean;
}

// Theme-specific text for page header
const themeText = {
    space: {
        title: 'Galactic Visions',
        subtitle: 'Explore the universe of dreams shared by fellow voyagers.',
        backText: 'Back to Orbit',
        countLabel: 'Solar Systems Detected',
        loadingText: 'Scanning Galaxy...',
        hintText: 'Hover over a star system to explore',
    },
    brain: {
        title: 'Collective Consciousness',
        subtitle: 'Discover the network of aspirations from fellow minds.',
        backText: 'Back to Cortex',
        countLabel: 'Neural Clusters Detected',
        loadingText: 'Syncing Neural Patterns...',
        hintText: 'Hover over a node to explore',
    },
    tree: {
        title: 'Forest of Dreams',
        subtitle: 'Wander through the grove of visions from fellow growers.',
        backText: 'Back to Grove',
        countLabel: 'Life Seeds Detected',
        loadingText: 'Growing Forest...',
        hintText: 'Hover over a seedling to explore',
    },
    custom: {
        title: 'Shared Visions',
        subtitle: 'Explore the dreams shared by the community.',
        backText: 'Back to Home',
        countLabel: 'Visions Detected',
        loadingText: 'Loading...',
        hintText: 'Hover over an element to explore',
    },
};

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ demoMode = false }) => {
    const [goals, setGoals] = useState<SavedGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { user } = useAuth();
    const { openDrawer } = useMessaging();

    const { colors, particles } = currentTheme;
    const themeKey = currentTheme.id === 'custom' ? 'custom' : currentTheme.id;
    const text = themeText[themeKey as keyof typeof themeText] || themeText.space;

    const handleMessageUser = async (targetUserId: string) => {
        if (!user) {
            // If not logged in, maybe show toast or redirect (for now just return)
            return;
        }
        try {
            const conversationId = await firestoreService.createConversation([user.uid, targetUserId]);
            openDrawer(conversationId);
        } catch (error) {
            console.error("Failed to start conversation", error);
        }
    };

    useEffect(() => {
        const fetchGoals = async () => {
            if (demoMode) {
                setTimeout(() => {
                    setGoals(MOCK_GOALS);
                    setLoading(false);
                }, 800);
                return;
            }

            try {
                const publicGoals = await firestoreService.getPublicGoals();
                setGoals(publicGoals);
            } catch (error) {
                console.error("Failed to fetch public goals", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [demoMode]);

    // Calculate spiral positions
    const spiralNodes = useMemo(() => {
        return goals.map((goal, index) => {
            // Golden Angle = 137.5 degrees
            const angle = index * 2.4;
            // Radius grows with square root of index to maintain even density
            const radius = 60 + (35 * Math.sqrt(index));

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Size variation (deterministic based on title length)
            const size = 40 + ((goal.title.length * 7) % 20);

            return { goal, x, y, size, delay: index * 0.05, entityIndex: index };
        });
    }, [goals]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
                    />
                    <p className="font-display animate-pulse" style={{ color: `${colors.primary}cc` }}>
                        {text.loadingText}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black text-foreground overflow-hidden z-40"
            style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0 }}
        >
            {/* Theme Background */}
            <ThemeBackground className="z-0" />

            {/* Particles Layer */}
            {[...Array(100)].map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i % 5) * 0.4 }}
                    style={{
                        width: (i % 10) > 8 ? 2 : 1,
                        height: (i % 10) > 8 ? 2 : 1,
                        left: `${(i * 17 + 7) % 100}%`,
                        top: `${(i * 23 + 11) % 100}%`,
                        backgroundColor: particles.color,
                        boxShadow: `0 0 4px ${particles.glowColor}`,
                    }}
                />
            ))}

            {/* Nebula effects */}
            <div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[100px] rounded-full mix-blend-screen"
                style={{ backgroundColor: `${colors.primary}1a` }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] blur-[120px] rounded-full mix-blend-screen"
                style={{ backgroundColor: `${colors.secondary}1a` }}
            />

            {/* Header - positioned below navigation */}
            <header className="absolute top-16 left-0 right-0 z-40 p-6 md:p-8 pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-4">
                    <HomeButton />

                    <Link
                        to={demoMode ? "/demo" : "/dashboard"}
                        className="inline-flex items-center gap-2 hover:text-brand-purple mb-2 transition-colors text-sm font-medium text-white"
                        style={{ color: 'white', textDecoration: 'none' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {text.backText}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                        {text.title}
                    </h1>
                    <p className="text-white/60 max-w-md mt-2">
                        {text.subtitle}
                    </p>
                </div>
            </header>

            {/* Solar Systems Badge - Fixed Bottom Right */}
            <div
                className="fixed z-50 pointer-events-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-white/80 flex items-center gap-2"
                style={{ position: 'fixed', bottom: '24px', right: '24px' }}
            >
                <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
                {goals.length} {text.countLabel}
            </div>



            {/* Interactive Galaxy Container - Direct Viewport Positioning */}
            <div
                className="fixed inset-0 cursor-move active:cursor-grabbing perspective-[1000px] z-20 overflow-hidden pointer-events-none"
                style={{ width: '100vw', height: '100vh' }}
            >
                {/* We make this container pointer-events-none so drags pass through, but children need events */}

                <AnimatePresence>
                    {spiralNodes.map((node) => {
                        const isHovered = hoveredGoal === node.goal.id;

                        return (
                            <motion.div
                                key={node.goal.id}
                                className="absolute pointer-events-auto"
                                initial={{ scale: 0 }}
                                animate={{
                                    scale: 1,
                                    x: node.x,
                                    y: node.y
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 20,
                                    delay: node.delay
                                }}
                                style={{
                                    left: '50vw',
                                    top: '50vh',
                                    zIndex: isHovered ? 60 : 30
                                }}
                            >
                                <div
                                    className="relative group cursor-pointer"
                                    onMouseEnter={() => setHoveredGoal(node.goal.id || null)}
                                    onMouseLeave={() => setHoveredGoal(null)}
                                    onClick={(e) => {
                                        // Mobile/Touch logic: First tap shows card (hover), Second tap navigates
                                        if (hoveredGoal !== node.goal.id) {
                                            e.preventDefault();
                                            setHoveredGoal(node.goal.id || null);
                                        } else {
                                            navigate(`/plan/${node.goal.id}`);
                                        }
                                    }}
                                >
                                    {/* The Entity (Planet/Neuron/Leaf based on theme) */}
                                    <motion.div
                                        animate={isHovered ? { scale: 1.5 } : { scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <ThemeEntity
                                            index={node.entityIndex}
                                            size={node.size}
                                            seed={node.goal.id}
                                        />
                                    </motion.div>

                                    <AnimatePresence>
                                        {isHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-slate-900/90 backdrop-blur-xl border border-brand-purple/30 rounded-xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] z-[70] text-left pointer-events-auto"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {node.goal.authorPhoto ? (
                                                        <img src={node.goal.authorPhoto} alt="Author" className="w-6 h-6 rounded-full border border-white/20" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                            <UserIcon className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-white/70 font-medium truncate">{node.goal.authorName || 'Anonymous'}</span>

                                                </div>

                                                <h3 className="text-white font-bold leading-tight mb-2 text-sm line-clamp-2">
                                                    {node.goal.title}
                                                </h3>

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                                                        <Calendar className="w-3 h-3" />
                                                        {node.goal.createdAt.toLocaleDateString()}
                                                    </div>

                                                    {/* Message Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMessageUser(node.goal.userId);
                                                        }}
                                                        className="px-3 py-1 bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/50 rounded-full text-[10px] font-bold text-white uppercase tracking-wider transition-colors flex items-center gap-1"
                                                    >
                                                        Message
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Central Core */}
                <motion.div
                    className="absolute w-64 h-64 rounded-full blur-[60px] pointer-events-none z-0"
                    style={{ left: '50vw', top: '50vh', x: '-50%', y: '-50%', backgroundColor: `${colors.glow}33` }}
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />
                <motion.div
                    className="absolute w-32 h-32 rounded-full blur-[30px] pointer-events-none"
                    style={{ left: '50vw', top: '50vh', x: '-50%', y: '-50%', backgroundColor: colors.primary }}
                    animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            </div>

            {/* Navigation Menu - Top Center */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
                <NavigationMenu demoMode={demoMode} />
            </div>

            {/* Instruction Toast (moved up slightly) */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="absolute left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/50 text-xs font-medium pointer-events-none z-[60]"
                style={{ bottom: '80px' }}
            >
                {text.hintText}
            </motion.div>
        </div>
    );
};
