import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SavedGoal } from '@/lib/firestore';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeEntity, type EntityType } from './ThemeEntity';
import { useGalaxyEngine } from '@/hooks/useGalaxyEngine';

interface CosmicJourneyViewProps {
    goals: SavedGoal[];
}


// Local patterns removed in favor of useGalaxyEngine


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

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const CosmicJourneyView: React.FC<CosmicJourneyViewProps> = ({ goals }) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { colors, particles } = currentTheme;
    const isTreeTheme = currentTheme.id === 'tree';
    const isBrainTheme = currentTheme.id === 'brain';

    // Calculate positions based on theme
    // Use the Galaxy Engine for consistent physics and layout
    // We Map goals to the engine's item format
    const { nodes } = useGalaxyEngine(goals, {
        centerX: 50,
        centerY: 50,
        spreadFactor: isBrainTheme ? 15 : 18, // Tighter for brain
        zoomLevel: 1,
        spiralConstant: 2.4 // Golden angle approximation
    });

    // Helper to get position from nodes (fallback for non-engine usages if any)
    const getPosition = (index: number) => {
        const node = nodes[index];
        return node ? { x: node.x, y: node.y } : { x: 50, y: 50 };
    };

    // Calculate neural connections (nearest neighbors)
    const getNeuralConnections = () => {
        const connections: { start: { x: number, y: number }, end: { x: number, y: number }, key: string }[] = [];
        const positions = goals.map((_, i) => getPosition(i));

        // For each node, connect to k nearest neighbors
        positions.forEach((pos1, i) => {
            // Find distances to all other nodes
            const distances = positions.map((pos2, j) => ({
                index: j,
                dist: Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y)
            })).filter(d => d.index !== i); // Exclude self

            // Sort by distance
            distances.sort((a, b) => a.dist - b.dist);

            // Connect to closest 3-4 neighbors to form a mesh
            const k = 4;
            distances.slice(0, k).forEach(neighbor => {
                // Avoid duplicates (only add if i < neighbor.index)
                if (i < neighbor.index) {
                    connections.push({
                        start: pos1,
                        end: positions[neighbor.index],
                        key: `${i}-${neighbor.index}`
                    });
                }
            });
        });
        return connections;
    };

    const synapticParticles = React.useMemo(() => {
        return [...Array(80)].map((_, i) => ({
            left: pseudoRandom(i) * 80 + 10,
            top: pseudoRandom(i + 100) * 70 + 15,
            size: pseudoRandom(i + 200) < 0.3 ? '2px' : '1px',
            duration: pseudoRandom(i + 300) * 2 + 1,
            delay: pseudoRandom(i + 400) * 5
        }));
    }, []);

    return (
        <div className="relative w-full h-[600px] md:h-[700px] rounded-3xl overflow-hidden border border-white/10 bg-background">
            {/* Background Layers */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Theme-specific background elements */}
                {isTreeTheme ? (
                    <>
                        {/* Yggdrasil Trunk and Branches - Subtle Background */}
                        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
                                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Massive Trunk */}
                            <path d="M 45 100 Q 50 60 48 40 Q 50 30 52 40 Q 50 60 55 100" fill="url(#trunkGrad)" />
                            {/* Roots */}
                            <path d="M 45 90 Q 30 95 20 100" stroke="url(#trunkGrad)" strokeWidth="2" fill="none" />
                            <path d="M 55 90 Q 70 95 80 100" stroke="url(#trunkGrad)" strokeWidth="2" fill="none" />
                            {/* Abstract Branches */}
                            <path d="M 48 40 Q 30 30 20 20" stroke={colors.secondary} strokeWidth="0.5" fill="none" opacity="0.4" />
                            <path d="M 52 40 Q 70 30 80 20" stroke={colors.secondary} strokeWidth="0.5" fill="none" opacity="0.4" />
                            <path d="M 50 35 Q 50 15 50 5" stroke={colors.secondary} strokeWidth="0.5" fill="none" opacity="0.3" />
                        </svg>

                        {/* Ambient Forest Particles */}
                        {[...Array(40)].map((_, i) => (
                            <motion.div
                                key={`leaf-particle-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    left: `${(i * 19) % 100}%`,
                                    top: `${(i * 29) % 100}%`,
                                    width: '3px',
                                    height: '3px',
                                    backgroundColor: particles.color,
                                    boxShadow: `0 0 4px ${particles.glowColor}`,
                                }}
                                animate={{
                                    y: [0, 20],
                                    x: [0, (i % 2 === 0 ? 5 : -5)],
                                    opacity: [0, 0.8, 0],
                                }}
                                transition={{
                                    duration: 4 + (i % 3),
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.2
                                }}
                            />
                        ))}
                    </>
                ) : isBrainTheme ? (
                    <>
                        {/* Realistic Brain Overlay Background */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-60">
                            <svg viewBox="0 0 500 400" className="w-[90%] h-[90%] opacity-80">
                                <defs>
                                    <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
                                        <stop offset="70%" stopColor={colors.secondary} stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </radialGradient>
                                    <filter id="brainBlur" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="10" />
                                    </filter>
                                </defs>

                                {/* Main Cerebrum Shape - Side Profile */}
                                <path
                                    d="M 120 280 
                                       Q 80 250 80 180 
                                       C 80 80 180 40 280 50
                                       C 380 60 440 120 440 200
                                       Q 440 280 380 320
                                       C 320 350 250 340 220 300
                                       Q 180 340 120 280 Z"
                                    fill={colors.secondary}
                                    fillOpacity="0.3"
                                    stroke={colors.primary}
                                    strokeWidth="1"
                                    strokeOpacity="0.5"
                                    filter="url(#brainBlur)"
                                />
                                {/* Inner Glow Center */}
                                <ellipse cx="260" cy="180" rx="150" ry="100" fill="url(#brainGlow)" />
                            </svg>
                        </div>


                        {/* Synaptic background particles */}
                        {synapticParticles.map((particle, i) => (
                            <motion.div
                                key={`synapse-spark-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    left: `${particle.left}%`,
                                    top: `${particle.top}%`,
                                    width: particle.size,
                                    height: particle.size,
                                    backgroundColor: colors.accent,
                                    boxShadow: `0 0 2px ${colors.accent}`,
                                }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1.5, 0]
                                }}
                                transition={{
                                    duration: particle.duration,
                                    repeat: Infinity,
                                    delay: particle.delay
                                }}
                            />
                        ))}
                    </>
                ) : (
                    /* Existing Starfield for Space/Other themes */
                    <>
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
                        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-30"
                            style={{ background: `radial-gradient(circle, ${colors.primary}66 0%, transparent 70%)` }} />
                        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-25"
                            style={{ background: `radial-gradient(circle, ${colors.secondary}59 0%, transparent 70%)` }} />
                    </>
                )}
            </div>

            {/* Neural Connections (Mesh) for Brain Theme */}
            {isBrainTheme && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.1" />
                            <stop offset="50%" stopColor={colors.primary} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.accent} stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    {getNeuralConnections().map((conn, idx) => (
                        <motion.line
                            key={`neural-link-${conn.key}`}
                            x1={`${conn.start.x}%`}
                            y1={`${conn.start.y}%`}
                            x2={`${conn.end.x}%`}
                            y2={`${conn.end.y}%`}
                            stroke="url(#neuralGradient)"
                            strokeWidth="0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.1, 0.4, 0.1] }}
                            transition={{ duration: 3, delay: idx * 0.05, repeat: Infinity }}
                        />
                    ))}
                </svg>
            )}

            {/* Constellation Lines (Only for non-tree AND non-brain themes) */}
            {!isTreeTheme && !isBrainTheme && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* ... Existing constellation code ... */}
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

                    {goals.map((goal, goalIndex) => {
                        const planetPos = getPosition(goalIndex);
                        const phases = goal.plan?.timeline || [];
                        const starPositions = phases.map((_, phaseIdx) =>
                            getPhaseStarPosition(phaseIdx, phases.length, planetPos.x, planetPos.y)
                        );
                        // ... connection logic ...
                        const constellation = CONSTELLATIONS[phases.length];
                        const connections = constellation
                            ? constellation.connections
                            : phases.map((_, i) => i > 0 ? [i - 1, i] : [-1, -1]).slice(1) as [number, number][];

                        return (
                            <g key={`constellation-${goalIndex}`}>
                                {connections.map(([startIdx, endIdx], lineIdx) => {
                                    if (startIdx < 0 || endIdx < 0 || startIdx >= phases.length || endIdx >= phases.length) return null;
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
            )}

            {/* Journey Nodes (Planetoids or Leaves) */}
            {goals.map((goal, goalIndex) => {
                const position = getPosition(goalIndex);
                const phases = goal.plan?.timeline || [];
                // Brain nodes are smaller and uniform
                const entitySize = (isTreeTheme || isBrainTheme) ? (isBrainTheme ? 30 : 50) : 40 + Math.min(phases.length * 3, 20);

                // Deterministically create a seed index based on goal ID
                const uniqueString = goal.id || goalIndex.toString();
                const seedIndex = uniqueString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

                // For trees/brains, we override the entity type
                let entityVisualType: 'leaf' | 'node' | undefined = undefined;
                if (isTreeTheme) entityVisualType = 'leaf';
                if (isBrainTheme) entityVisualType = 'node';

                return (
                    <React.Fragment key={goal.id}>
                        {/* Phase Stars - Rendered ONLY if NOT tree/brain mode */}
                        {!isTreeTheme && !isBrainTheme && phases.map((phase, phaseIdx) => {
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

                        {/* Connecting branch line for Tree Mode */}
                        {isTreeTheme && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                <motion.path
                                    d={`M 50 50 Q 50 40 ${position.x} ${position.y}`} // Simple curve from center trunk
                                    stroke={colors.secondary}
                                    strokeWidth="1"
                                    fill="none"
                                    opacity="0.3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, delay: goalIndex * 0.1 }}
                                />
                            </svg>
                        )}

                        {/* Interactive Entity */}
                        <motion.div
                            role="button"
                            tabIndex={0}
                            aria-label={`View ${goal.title}`}
                            className="absolute z-20 cursor-pointer group focus-visible:outline-none"
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: isTreeTheme || isBrainTheme ? 30 : 20
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: goalIndex * 0.15, type: 'spring', stiffness: 100 }}
                            whileHover={{ scale: 1.2, rotate: isTreeTheme ? 10 : 0 }}
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
                                className="relative group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                            >
                                <ThemeEntity
                                    size={entitySize}
                                    index={seedIndex}
                                    seed={goal.id}
                                    type={entityVisualType as EntityType}
                                    progress={phases.length > 0 ? phases.filter(p => p.isCompleted).length / phases.length : 0}
                                />
                            </div>

                            {/* Label */}
                            <div
                                className={`absolute left-1/2 -bottom-6 -translate-x-1/2 whitespace-nowrap text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10 max-w-[150px] truncate text-center transition-opacity ${isTreeTheme ? 'bg-green-900/40 backdrop-blur-sm' : isBrainTheme ? 'bg-indigo-900/40 backdrop-blur-sm' : 'bg-black/70 backdrop-blur-md'}`}
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
                            <div className="text-6xl mb-4">{isTreeTheme ? "🌱" : isBrainTheme ? "🧠" : "🌌"}</div>
                            <h3 className="text-xl font-semibold text-white/70">
                                {isTreeTheme ? "The Forest is Quiet" : isBrainTheme ? "Empty Network" : "Your cosmos awaits"}
                            </h3>
                            <p className="text-white/50 mt-2">Create your first {isTreeTheme ? "seed" : isBrainTheme ? "neuron" : "journey"} to see it grow</p>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
