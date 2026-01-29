import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SavedGoal } from '@/lib/firestore';
import { useTheme } from '@/contexts/ThemeContext';

import { ThemeEntity, ThemeCentralEntity } from './ThemeEntity';

interface SolarSystemHomeProps {
    goals: SavedGoal[];
}

// Orbital configuration
const ORBITS = [
    { radius: 120, label: '< 1 month', speed: 60, opacity: 0.4 },
    { radius: 200, label: '1-3 months', speed: 90, opacity: 0.3 },
    { radius: 280, label: '3-6 months', speed: 120, opacity: 0.2 },
    { radius: 360, label: '6+ months', speed: 180, opacity: 0.15 },
];

// Calculate which orbit a goal belongs to based on timeline
function getOrbitIndex(goal: SavedGoal): number {
    const timeline = goal.plan?.timeline;
    if (!timeline || timeline.length === 0) return 3;

    // Get the last milestone date
    const lastMilestone = timeline[timeline.length - 1];
    if (!lastMilestone?.date) return 3;

    const deadline = new Date(lastMilestone.date);
    const now = new Date();
    const monthsUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsUntil <= 1) return 0;
    if (monthsUntil <= 3) return 1;
    if (monthsUntil <= 6) return 2;
    return 3;
}

// Calculate progress percentage
function getProgress(goal: SavedGoal): number {
    const timeline = goal.plan?.timeline;
    if (!timeline || timeline.length === 0) return 0;

    const completed = timeline.filter(m => m.isCompleted).length;
    return Math.round((completed / timeline.length) * 100);
}

export const SolarSystemHome: React.FC<SolarSystemHomeProps> = ({ goals }) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { colors } = currentTheme;

    // Group goals by orbit
    const goalsByOrbit = useMemo(() => {
        const grouped: SavedGoal[][] = [[], [], [], []];
        goals.forEach(goal => {
            const orbitIndex = getOrbitIndex(goal);
            grouped[orbitIndex].push(goal);
        });
        return grouped;
    }, [goals]);

    // Calculate positions for each goal on its orbit
    const positionedGoals = useMemo(() => {
        return goalsByOrbit.flatMap((orbitGoals, orbitIndex) => {
            const orbit = ORBITS[orbitIndex];
            return orbitGoals.map((goal, goalIndex) => {
                // Distribute goals evenly around the orbit
                const baseAngle = (goalIndex / Math.max(orbitGoals.length, 1)) * 360;

                // Deterministically create a seed index based on goal ID or name
                const uniqueString = goal.id || goal.title || goalIndex.toString();
                const seed = uniqueString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

                return {
                    goal,
                    orbitIndex,
                    radius: orbit.radius,
                    speed: orbit.speed,
                    startAngle: baseAngle,
                    progress: getProgress(goal),
                    globalIndex: seed,
                };
            });
        });
    }, [goalsByOrbit]);

    const handleGoalClick = (goalId: string | undefined) => {
        if (goalId) {
            navigate(`/plan/${goalId}`);
        }
    };

    return (
        <div
            className="relative w-full max-w-[800px] mx-auto"
            style={{ aspectRatio: '1/1', minHeight: '320px' }}
        >
            {/* Deep space background */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse at 30% 30%, ${colors.primary}25 0%, transparent 50%),
                            radial-gradient(ellipse at 70% 70%, ${colors.secondary}25 0%, transparent 50%),
                            radial-gradient(circle at center, ${colors.background}e6 0%, ${colors.background} 100%)
                        `,
                    }}
                />
                {/* Stars/Particles */}
                {[...Array(60)].map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute w-0.5 h-0.5 rounded-full"
                        style={{
                            left: `${(i * 17 + 7) % 100}%`,
                            top: `${(i * 23 + 11) % 100}%`,
                            backgroundColor: currentTheme.particles.color,
                            boxShadow: `0 0 4px ${currentTheme.particles.glowColor}`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2 + (i % 3),
                            repeat: Infinity,
                            delay: (i % 5) * 0.4,
                        }}
                    />
                ))}
            </div>

            {/* Orbital rings */}
            {ORBITS.map((orbit, index) => (
                <motion.div
                    key={`orbit-${index}`}
                    className="absolute rounded-full border"
                    style={{
                        width: orbit.radius * 2,
                        height: orbit.radius * 2,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        borderColor: `${colors.accent}${Math.round(orbit.opacity * 255).toString(16).padStart(2, '0')}`,
                        boxShadow: `0 0 20px ${colors.glow}`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                />
            ))}

            {/* Central Entity (Sun/Brain/Tree based on theme) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <ThemeCentralEntity size={96} />
            </div>

            {/* Goals as themed entities */}
            {positionedGoals.map(({ goal, radius, speed, startAngle, progress, globalIndex }, index) => (
                <motion.div
                    key={goal.id || index}
                    className="absolute"
                    style={{
                        left: '50%',
                        top: '50%',
                        width: 0,
                        height: 0,
                    }}
                    animate={{
                        rotate: [startAngle, startAngle + 360],
                    }}
                    transition={{
                        duration: speed,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {/* Planet */}
                    <motion.button
                        className="absolute cursor-pointer group"
                        style={{
                            left: radius,
                            top: 0,
                            transform: 'translate(-50%, -50%)',
                        }}
                        onClick={() => handleGoalClick(goal.id)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        // Counter-rotate to keep planet upright
                        animate={{
                            rotate: [-(startAngle), -(startAngle + 360)],
                        }}
                        transition={{
                            duration: speed,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    >

                        {/* Entity body (Planet/Neuron/Leaf based on theme) */}
                        <div
                            className="relative w-12 h-12 flex items-center justify-center"
                        >
                            <div className="absolute inset-0">
                                <ThemeEntity index={globalIndex} size={48} />
                            </div>

                            {/* Progress ring - overlaid on top */}
                            <svg
                                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10"
                                viewBox="0 0 48 48"
                            >
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="22"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="22"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(progress / 100) * 138} 138`}
                                />
                            </svg>
                            <span
                                className="z-10 font-bold text-sm"
                                style={{
                                    color: '#FFFFFF',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)'
                                }}
                            >
                                {progress}%
                            </span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div
                                className="px-3 py-2 rounded-lg text-sm text-white whitespace-nowrap"
                                style={{
                                    background: `${colors.background}f2`,
                                    border: `1px solid ${colors.accent}4d`,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                    color: '#ffffff',
                                }}
                            >
                                <div className="font-semibold">{goal.title}</div>
                                <div className="text-xs text-white/60">{progress}% complete</div>
                            </div>
                        </div>
                    </motion.button>
                </motion.div>
            ))}

            {/* Orbit labels */}
            <div
                className="absolute w-full px-4 flex flex-wrap justify-center gap-6 pointer-events-none z-20"
                style={{ bottom: '24px' }}
            >
                {ORBITS.map((orbit, index) => (
                    <div key={index} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                        <div
                            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{
                                color: `${colors.accent}${Math.round(orbit.opacity * 2 * 255).toString(16).padStart(2, '0')}`,
                                backgroundColor: 'currentColor',
                            }}
                        />
                        <span className="text-xs text-white/80 font-medium whitespace-nowrap">{orbit.label}</span>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {goals.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white/60">
                        <p className="text-lg mb-2">No visions in orbit yet</p>
                        <p className="text-sm">Create your first vision to launch it into the cosmos</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolarSystemHome;
