import React, { useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement, AchievementType } from '@/types';

interface AchievementCelebrationProps {
    achievement: Achievement | null;
    onDismiss: () => void;
    onShare?: () => void;
}

// Configuration per achievement type
const ACHIEVEMENT_CONFIG: Record<
    AchievementType,
    {
        title: string;
        icon: string;
        duration: number;
        particleCount: number;
        glowColor: string;
        gradient: string;
    }
> = {
    waypoint: {
        title: 'Waypoint Cleared',
        icon: '✦',
        duration: 2000,
        particleCount: 12,
        glowColor: 'rgba(168, 85, 247, 0.6)',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    },
    milestone: {
        title: 'Milestone Reached',
        icon: '🎯',
        duration: 3500,
        particleCount: 24,
        glowColor: 'rgba(59, 130, 246, 0.6)',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    },
    goal: {
        title: 'New World Discovered',
        icon: '🪐',
        duration: 5000,
        particleCount: 48,
        glowColor: 'rgba(251, 191, 36, 0.6)',
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
    constellation: {
        title: 'Constellation Complete',
        icon: '⭐',
        duration: 4000,
        particleCount: 32,
        glowColor: 'rgba(236, 72, 153, 0.6)',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
};

// Generate random particles
const generateParticles = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (i / count) * 360 + Math.random() * 30,
        distance: 100 + Math.random() * 150,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? '#fef08a' : '#a855f7',
    }));
};

export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
    achievement,
    onDismiss,
    onShare,
}) => {
    // Compute particles based on achievement - using useMemo to avoid effect setState
    const particles = useMemo(() => {
        if (!achievement) return [];
        const config = ACHIEVEMENT_CONFIG[achievement.type];
        return generateParticles(config.particleCount);
    }, [achievement]);

    const showFullCelebration = !!achievement;

    // Memoize stable onDismiss to avoid effect re-runs
    const stableOnDismiss = useCallback(() => {
        onDismiss();
    }, [onDismiss]);

    useEffect(() => {
        if (!achievement) return;

        // Auto-dismiss for smaller achievements
        if (achievement.type === 'waypoint') {
            const config = ACHIEVEMENT_CONFIG[achievement.type];
            const timer = setTimeout(stableOnDismiss, config.duration);
            return () => clearTimeout(timer);
        }
    }, [achievement, stableOnDismiss]);

    if (!achievement) return null;

    const config = ACHIEVEMENT_CONFIG[achievement.type];
    const isFullScreen = achievement.type === 'goal' || achievement.type === 'constellation';

    return (
        <AnimatePresence>
            {showFullCelebration && (
                <motion.div
                    className={`fixed inset-0 z-[100] flex items-center justify-center ${isFullScreen ? 'bg-black/60 backdrop-blur-sm' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={isFullScreen ? undefined : onDismiss}
                >
                    {/* Aurora background for full-screen celebrations */}
                    {isFullScreen && (
                        <>
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: `
                                        radial-gradient(ellipse at 30% 20%, ${config.glowColor.replace('0.6', '0.2')} 0%, transparent 50%),
                                        radial-gradient(ellipse at 70% 80%, ${config.glowColor.replace('0.6', '0.2')} 0%, transparent 50%)
                                    `,
                                }}
                                animate={{
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </>
                    )}

                    {/* Particle explosion */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {particles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                className="absolute rounded-full"
                                style={{
                                    width: particle.size,
                                    height: particle.size,
                                    background: particle.color,
                                    left: '50%',
                                    top: '50%',
                                }}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
                                    y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: particle.duration,
                                    delay: particle.delay,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </div>

                    {/* Main celebration card */}
                    <motion.div
                        className={`relative z-10 text-center ${isFullScreen ? 'w-full max-w-md mx-4' : ''}`}
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {/* Glow ring */}
                        <motion.div
                            className="absolute inset-0 rounded-3xl pointer-events-none"
                            style={{
                                background: config.glowColor,
                                filter: 'blur(40px)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.4, 0.2],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                        />

                        {/* Card content */}
                        <div
                            className="relative rounded-3xl p-8 overflow-hidden bg-white border border-slate-200 shadow-2xl"
                        >
                            {/* Decorative top border */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1"
                                style={{ background: config.gradient }}
                            />

                            {/* Icon */}
                            <motion.div
                                className="text-6xl mb-4"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: achievement.type === 'goal' ? [0, 5, -5, 0] : 0,
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {config.icon}
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="font-outfit font-bold text-2xl md:text-3xl mb-2"
                                style={{
                                    background: config.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {config.title}
                            </motion.h2>

                            {/* Achievement name */}
                            <motion.p
                                className="text-slate-900 text-lg md:text-xl font-semibold mb-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                "{achievement.title}"
                            </motion.p>

                            {/* Description */}
                            {achievement.description && (
                                <motion.p
                                    className="text-slate-600 text-sm mb-6"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {achievement.description}
                                </motion.p>
                            )}

                            {/* Stats */}
                            {achievement.stats && isFullScreen && (
                                <motion.div
                                    className="flex justify-center gap-6 mb-8 text-sm p-4 bg-slate-50 rounded-2xl"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {achievement.stats.daysToComplete && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-900">
                                                {achievement.stats.daysToComplete}
                                            </div>
                                            <div className="text-slate-500">days</div>
                                        </div>
                                    )}
                                    {achievement.stats.waypointsCleared && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-900">
                                                {achievement.stats.waypointsCleared}
                                            </div>
                                            <div className="text-slate-500">waypoints</div>
                                        </div>
                                    )}
                                    {achievement.stats.streakDays && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-900">
                                                {achievement.stats.streakDays}
                                            </div>
                                            <div className="text-slate-500">day streak</div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Actions */}
                            {isFullScreen && (
                                <motion.div
                                    className="flex justify-center gap-3"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <button
                                        onClick={onDismiss}
                                        className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium hover:text-slate-900"
                                    >
                                        Continue
                                    </button>
                                    {onShare && (
                                        <button
                                            onClick={onShare}
                                            className="px-6 py-2.5 rounded-full text-white font-medium transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                                            style={{
                                                background: config.gradient,
                                            }}
                                        >
                                            Share 🚀
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Waypoint mini-celebration (positioned at top-center) */}
                    {!isFullScreen && (
                        <motion.div
                            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
                            initial={{ y: -100, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -100, opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <div
                                className="relative px-6 py-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-xl"
                            >
                                {/* Animated icon */}
                                <motion.span
                                    className="text-3xl"
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: 2,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    {config.icon}
                                </motion.span>
                                <div>
                                    <motion.div
                                        className="text-lg font-bold"
                                        style={{
                                            background: config.gradient,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {config.title}
                                    </motion.div>
                                    <motion.div
                                        className="text-sm text-slate-600 font-medium"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {achievement.title}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AchievementCelebration;
