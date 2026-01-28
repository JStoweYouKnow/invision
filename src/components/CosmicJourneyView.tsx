import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SavedGoal } from '@/lib/firestore';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeEntity } from './ThemeEntity';

interface CosmicJourneyViewProps {
    goals: SavedGoal[];
}

// Position planetoids in a spiral pattern across the canvas
const getPlanetoidPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 + Math.PI / 4;
    const radius = 120 + (index % 3) * 80;
    const centerX = 50; // percentage
    const centerY = 50;

    return {
        x: centerX + Math.cos(angle) * (radius / 5),
        y: centerY + Math.sin(angle) * (radius / 8),
    };
};

// Constellation patterns with relative coordinates (x, y) [-1 to 1 range] and connections
const CONSTELLATIONS: Record<number, { points: { x: number; y: number }[]; connections: [number, number][] }> = {
    3: { // Orion's Belt
        points: [{ x: -1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: -1 }],
        connections: [[0, 1], [1, 2]]
    },
    4: { // Crux (Southern Cross)
        points: [{ x: 0, y: -1.8 }, { x: -1.2, y: -0.3 }, { x: 1.2, y: -0.5 }, { x: 0, y: 1.8 }],
        connections: [[0, 3], [1, 2]]
    },
    5: { // Cassiopeia (W shape)
        points: [{ x: -1.8, y: -1.2 }, { x: -0.8, y: 0.8 }, { x: 0.2, y: 0 }, { x: 1.2, y: 0.8 }, { x: 1.8, y: -1.2 }],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
    },
    7: { // Big Dipper (Ursa Major)
        points: [
            { x: -2.5, y: 1.5 }, { x: -1.5, y: 1.2 }, { x: -0.5, y: 0.8 }, // Handle
            { x: 0.5, y: 0.5 }, { x: 1.5, y: -0.5 }, { x: 2.2, y: 0.8 }, { x: 1.2, y: 1.8 } // Bucket
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 3]]
    }
};

// Default circular pattern for other counts
const getCircularPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
};

// Get star positions around a planetoid
const getPhaseStarPosition = (phaseIndex: number, totalPhases: number, planetX: number, planetY: number) => {
    const scale = 12; // Radius/spread of constellation
    let offsetX = 0;
    let offsetY = 0;

    const constellation = CONSTELLATIONS[totalPhases];
    if (constellation && constellation.points[phaseIndex]) {
        offsetX = constellation.points[phaseIndex].x * scale;
        offsetY = constellation.points[phaseIndex].y * scale;
    } else {
        const circlePos = getCircularPosition(phaseIndex, totalPhases);
        offsetX = circlePos.x * scale;
        offsetY = circlePos.y * scale;
    }

    return {
        x: planetX + offsetX,
        y: planetY + offsetY,
    };
};

export const CosmicJourneyView: React.FC<CosmicJourneyViewProps> = ({ goals }) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { colors, particles } = currentTheme;

    return (
        <div className="relative w-full h-[600px] md:h-[700px] rounded-3xl overflow-hidden border border-white/10 bg-background">
            {/* Starfield Background */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Small twinkling stars */}
                {[...Array(60)].map((_, i) => (
                    <motion.div
                        key={`bg-star-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${(i * 17) % 100}%`,
                            top: `${(i * 23) % 100}%`,
                            width: '2px',
                            height: '2px',
                            backgroundColor: particles.color,
                            boxShadow: `0 0 4px ${particles.glowColor}`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2 + (i % 3),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (i % 5) * 0.4
                        }}
                    />
                ))}

                {/* Nebula glow */}
                <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-30"
                    style={{ background: `radial-gradient(circle, ${colors.primary}66 0%, transparent 70%)` }} />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-25"
                    style={{ background: `radial-gradient(circle, ${colors.secondary}59 0%, transparent 70%)` }} />
            </div>

            {/* SVG for constellation lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                    <linearGradient id="constellationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={`${colors.primary}cc`} />
                        <stop offset="100%" stopColor={`${colors.secondary}cc`} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Render constellation lines for each journey */}
                {goals.map((goal, goalIndex) => {
                    const planetPos = getPlanetoidPosition(goalIndex, goals.length);
                    const phases = goal.plan?.timeline || [];


                    // Draw lines between consecutive completed phases
                    const starPositions = phases.map((_, phaseIdx) =>
                        getPhaseStarPosition(phaseIdx, phases.length, planetPos.x, planetPos.y)
                    );

                    // Determine connections: either from defined constellation or sequential
                    const constellation = CONSTELLATIONS[phases.length];
                    const connections = constellation
                        ? constellation.connections
                        : phases.map((_, i) => i > 0 ? [i - 1, i] : [-1, -1]).slice(1) as [number, number][];

                    return (
                        <g key={`constellation-${goalIndex}`}>
                            {connections.map(([startIdx, endIdx], lineIdx) => {
                                // Validate indices
                                if (startIdx < 0 || endIdx < 0 || startIdx >= phases.length || endIdx >= phases.length) return null;

                                // Only draw line if both connected stars are completed
                                const isCompleted = phases[startIdx].isCompleted && phases[endIdx].isCompleted;
                                if (!isCompleted) return null;

                                const startPos = starPositions[startIdx];
                                const endPos = starPositions[endIdx];

                                return (
                                    <motion.line
                                        key={`line-${goalIndex}-${lineIdx}`}
                                        x1={`${startPos.x}%`}
                                        y1={`${startPos.y}%`}
                                        x2={`${endPos.x}%`}
                                        y2={`${endPos.y}%`}
                                        stroke="url(#constellationGradient)"
                                        strokeWidth="2"
                                        filter="url(#glow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1, delay: lineIdx * 0.2 }}
                                    />
                                );
                            })}
                        </g>
                    );
                })}
            </svg>

            {/* Journey Planetoids */}
            {goals.map((goal, goalIndex) => {
                const position = getPlanetoidPosition(goalIndex, goals.length);
                const phases = goal.plan?.timeline || [];
                const planetSize = 100 + Math.min(phases.length * 5, 40); // Increased minimum size for better touch targets

                return (
                    <React.Fragment key={goal.id}>
                        {/* Phase Stars - rendered independently for correct positioning */}
                        {phases.map((phase, phaseIdx) => {
                            const starPos = getPhaseStarPosition(phaseIdx, phases.length, position.x, position.y);
                            const isCompleted = phase.isCompleted;

                            return (
                                <motion.div
                                    key={`phase-star-${goal.id}-${phaseIdx}`}
                                    className="absolute rounded-full z-20 pointer-events-none"
                                    style={{
                                        left: `${starPos.x}%`,
                                        top: `${starPos.y}%`,
                                        width: isCompleted ? '10px' : '6px',
                                        height: isCompleted ? '10px' : '6px',
                                        backgroundColor: isCompleted ? colors.accent : particles.color,
                                        boxShadow: isCompleted
                                            ? `0 0 15px 5px ${colors.glow}`
                                            : `0 0 6px 2px ${particles.glowColor}`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={isCompleted ? { scale: 1, opacity: 1 } : {
                                        opacity: [0.4, 1, 0.4],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        delay: 0.5 + phaseIdx * 0.1,
                                        duration: isCompleted ? 0.5 : 2 + (phaseIdx % 3),
                                        repeat: isCompleted ? 0 : Infinity,
                                        ease: "easeInOut",
                                    }}
                                />
                            );
                        })}

                        {/* Planetoid/Moon - the journey itself */}
                        <motion.div
                            role="button"
                            tabIndex={0}
                            aria-label={`View ${goal.title}`}
                            className="absolute z-20 cursor-pointer group focus-visible:outline-none"
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: goalIndex * 0.15, type: 'spring', stiffness: 100 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            whileFocus={{ scale: 1.1 }}
                            onClick={() => navigate(`/plan/${goal.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navigate(`/plan/${goal.id}`);
                                }
                            }}
                        >
                            <div
                                className="relative group-hover:ring-2 group-hover:ring-brand-purple/60 group-focus-visible:ring-2 group-focus-visible:ring-brand-indigo group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background transition-all rounded-full"
                            >
                                <ThemeEntity
                                    size={planetSize}
                                    index={goalIndex}
                                    seed={goal.id}
                                />
                            </div>

                            {/* Journey title label - always visible */}
                            <div
                                className="absolute left-1/2 -bottom-7 -translate-x-1/2 whitespace-nowrap bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/10 max-w-[150px] truncate text-center"
                            >
                                {goal.title}
                            </div>
                        </motion.div>
                    </React.Fragment>
                );
            })}

            {/* Screen reader accessible list */}
            <ul className="sr-only">
                {goals.map((goal) => (
                    <li key={`sr-${goal.id}`}>
                        <a href={`/plan/${goal.id}`}>{goal.title}</a>
                    </li>
                ))}
            </ul>

            {/* Empty state */}
            {
                goals.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🌌</div>
                            <h3 className="text-xl font-semibold text-white/70">Your cosmos awaits</h3>
                            <p className="text-white/50 mt-2">Create your first journey to see it appear as a star</p>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
