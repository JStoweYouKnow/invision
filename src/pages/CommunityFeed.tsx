import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Sparkles, UserPlus, Users, X, Check, ChevronDown } from 'lucide-react';
import { firestoreService, type SavedGoal, type GoalCategory } from '@/lib/firestore';
import { MOCK_GOALS, MOCK_ADDITIONAL_GOALS } from '@/lib/mockData';
import { ThemeEntity } from '@/components/ThemeEntity';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeBackground } from '@/components/backgrounds';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';

interface CommunityFeedProps {
    demoMode?: boolean;
}

const CATEGORIES: GoalCategory[] = ['Career', 'Health', 'Travel', 'Creative', 'Lifestyle', 'Finance', 'Education', 'Other'];

// ... (Theme Text same as before) ...
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
    const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [showFriendsOnly, setShowFriendsOnly] = useState(false);
    const [friendIds, setFriendIds] = useState<string[]>([]);

    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { user } = useAuth();
    const { openDrawer } = useMessaging();

    const { colors, particles } = currentTheme;
    const themeKey = currentTheme.id === 'custom' ? 'custom' : currentTheme.id;
    const text = themeText[themeKey as keyof typeof themeText] || themeText.space;

    // Load goals
    useEffect(() => {
        const fetchGoals = async () => {
            if (demoMode) {
                // Combine standard mock goals and additional ones for demo
                const allMock = [...MOCK_GOALS, ...MOCK_ADDITIONAL_GOALS];
                setTimeout(() => {
                    setGoals(allMock);
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

    // Load user friends
    useEffect(() => {
        const loadFriends = async () => {
            if (user) {
                const profile = await firestoreService.getUserProfile(user.uid);
                if (profile && profile.friends) {
                    setFriendIds(profile.friends);
                }
            }
        };
        loadFriends();
    }, [user]);

    const handleMessageUser = async (targetUserId: string) => {
        if (!user) {
            alert('Please log in to message this user');
            return;
        }
        try {
            const conversationId = await firestoreService.createConversation([user.uid, targetUserId]);
            openDrawer(conversationId);
        } catch (error) {
            console.error("Failed to start conversation", error);
        }
    };

    const handleToggleFriend = async (targetUserId: string) => {
        if (!user) {
            alert('Please log in to add friends');
            return;
        }
        try {
            const isFriend = friendIds.includes(targetUserId);
            // Optimistic update
            if (isFriend) {
                setFriendIds(prev => prev.filter(id => id !== targetUserId));
            } else {
                setFriendIds(prev => [...prev, targetUserId]);
            }

            await firestoreService.toggleFriend(user.uid, targetUserId);
        } catch (error) {
            console.error("Failed to toggle friend", error);
            // Revert on error
            // We can reload profile here to be safe
            const profile = await firestoreService.getUserProfile(user.uid);
            if (profile) setFriendIds(profile.friends || []);
        }
    };

    // Filter goals
    const filteredGoals = useMemo(() => {
        return goals.filter(goal => {
            // Filter by category
            if (selectedCategory && goal.category !== selectedCategory) return false;

            // Filter by friends
            if (showFriendsOnly) {
                if (!user) return false; // Guest has no friends
                if (!friendIds.includes(goal.userId)) return false;
            }

            return true;
        });
    }, [goals, selectedCategory, showFriendsOnly, user, friendIds]);

    // Calculate spiral positions
    const spiralNodes = useMemo(() => {
        // Use filtered goals
        return filteredGoals.map((goal, index) => {
            const angle = index * 2.4;
            const radius = 60 + (35 * Math.sqrt(index));
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const size = 40 + ((goal.title.length * 7) % 20);

            return { goal, x, y, size, delay: index * 0.05, entityIndex: index };
        });
    }, [filteredGoals]);

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
            <ThemeBackground className="z-0" />

            {/* Particles Layer - same as before */}
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

            {/* Nebula effects - same as before */}
            <div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[100px] rounded-full mix-blend-screen"
                style={{ backgroundColor: `${colors.primary}1a` }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] blur-[120px] rounded-full mix-blend-screen"
                style={{ backgroundColor: `${colors.secondary}1a` }}
            />

            {/* Header */}
            <header className="absolute top-16 left-0 right-0 z-40 p-6 md:p-8 pointer-events-none flex flex-col items-start gap-4">
                <div className="pointer-events-auto w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <HomeButton />
                            <ThemeQuickToggle />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
                            {text.title}
                        </h1>
                        <p className="text-white/60 max-w-md">
                            {text.subtitle}
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Friends Toggle */}
                        <button
                            onClick={() => setShowFriendsOnly(!showFriendsOnly)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${showFriendsOnly ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            Friends
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        {/* Categories Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-black flex items-center gap-2 hover:bg-white/90"
                            >
                                {selectedCategory || 'All Categories'}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isCategoryOpen && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />

                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full mt-2 left-0 w-48 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs hover:bg-black/5 transition-colors ${!selectedCategory ? 'text-brand-purple font-bold' : 'text-black/70'}`}
                                            >
                                                All Categories
                                            </button>
                                            <div className="h-px bg-black/10 mx-2 my-1" />
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setIsCategoryOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-black/5 transition-colors ${selectedCategory === cat ? 'text-brand-purple font-bold' : 'text-black/70'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="ml-1 p-1 rounded-full hover:bg-white/20 text-white/50 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Solar Systems Badge - Fixed Bottom Right */}
            <div
                className="fixed z-50 pointer-events-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-white/80 flex items-center gap-2"
                style={{ position: 'fixed', bottom: '24px', right: '24px' }}
            >
                <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
                {filteredGoals.length} / {goals.length} {text.countLabel}
            </div>

            {/* Interactive Galaxy Container */}
            <div
                className="fixed inset-0 cursor-move active:cursor-grabbing perspective-[1000px] z-20 overflow-hidden pointer-events-none"
                style={{ width: '100vw', height: '100vh' }}
            >
                <AnimatePresence mode="popLayout">
                    {spiralNodes.map((node) => {
                        const isHovered = hoveredGoal === node.goal.id;
                        const isFriend = user ? friendIds.includes(node.goal.userId) : false;

                        return (
                            <motion.div
                                key={node.goal.id}
                                className="absolute pointer-events-auto"
                                layout
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    x: node.x,
                                    y: node.y
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 20,
                                    delay: node.delay // Stagger effect
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
                                        if (hoveredGoal !== node.goal.id) {
                                            e.preventDefault();
                                            setHoveredGoal(node.goal.id || null);
                                        } else {
                                            navigate(`/plan/${node.goal.id}`);
                                        }
                                    }}
                                >
                                    {/* The Entity */}
                                    <motion.div
                                        animate={isHovered ? { scale: 1.5 } : { scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <ThemeEntity
                                            index={node.entityIndex}
                                            size={node.size}
                                            seed={node.goal.id}
                                        />

                                        {/* Friend Indicator */}
                                        {isFriend && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        )}
                                    </motion.div>

                                    <AnimatePresence>
                                        {isHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 bg-slate-900/90 backdrop-blur-xl border border-brand-purple/30 rounded-xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] z-[70] text-left pointer-events-auto"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {node.goal.authorPhoto ? (
                                                        <img src={node.goal.authorPhoto} alt="Author" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                            <UserIcon className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-white font-medium truncate flex items-center gap-2">
                                                            {node.goal.authorName || 'Anonymous'}
                                                            {isFriend && <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Friend</span>}
                                                        </div>
                                                        <div className="text-xs text-white/50 truncate">{node.goal.category || 'Visionary'}</div>
                                                    </div>
                                                </div>

                                                <h3 className="text-white font-bold leading-tight mb-2 text-sm line-clamp-2">
                                                    {node.goal.title}
                                                </h3>

                                                <p className="text-white/70 text-xs line-clamp-2 mb-3">
                                                    {node.goal.description}
                                                </p>

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 gap-2">

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleFriend(node.goal.userId);
                                                        }}
                                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${isFriend ? 'bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                                    >
                                                        {isFriend ? (
                                                            <>
                                                                <Check className="w-3 h-3" />
                                                                Friends
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="w-3 h-3" />
                                                                Add Friend
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Message Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMessageUser(node.goal.userId);
                                                        }}
                                                        className="flex-1 py-1.5 bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/50 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
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

            {/* Navigation Menu */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
                <NavigationMenu demoMode={demoMode} />
            </div>

            {/* Instruction Toast */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="absolute left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/50 text-xs font-medium pointer-events-none z-[60]"
                style={{ bottom: '80px' }}
            >
                {filteredGoals.length === 0 ? 'No visions found in this sector' : text.hintText}
            </motion.div>
        </div>
    );
};
