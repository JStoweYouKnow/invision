import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SavedGoal } from '@/lib/firestore';
import type { Voyage, Constellation as ConstellationType, VoyagerPosition } from '@/types';
import { CelestialDestination } from './CelestialDestination';
import { VoyageTrajectory } from './VoyageTrajectory';
import { Constellation } from './Constellation';
import { TheGuide } from './TheGuide';
import { ZoomIn, ZoomOut, Home, Compass } from 'lucide-react';

interface CosmosMapProps {
    goals: SavedGoal[];
    voyages?: Voyage[];
    constellations?: ConstellationType[];
    voyagerPosition?: VoyagerPosition;
    showGuide?: boolean;
    onGoalClick?: (goalId: string) => void;
}

// Calculate positions in a spiral galaxy pattern
const getGalaxyPosition = (index: number, _total: number, zoomLevel: number) => {
    // Golden angle for natural spiral distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;
    const radius = Math.sqrt(index + 1) * 12;

    const centerX = 50;
    const centerY = 50;

    return {
        x: centerX + Math.cos(angle) * radius / zoomLevel,
        y: centerY + Math.sin(angle) * radius / zoomLevel,
    };
};

// Map goal status to destination status (derived from plan progress)
const getDestinationStatus = (goal: SavedGoal) => {
    const phases = goal.plan?.timeline || [];
    const completedPhases = phases.filter(p => p.isCompleted).length;
    const totalPhases = phases.length;

    if (totalPhases === 0) return 'undiscovered' as const;
    if (completedPhases === totalPhases) return 'arrived' as const;
    if (completedPhases > 0) return 'enRoute' as const;
    return 'charted' as const;
};

// Calculate progress percentage for a goal
const getGoalProgress = (goal: SavedGoal) => {
    const phases = goal.plan?.timeline || [];
    if (phases.length === 0) return 0;
    const completed = phases.filter(p => p.isCompleted).length;
    return Math.round((completed / phases.length) * 100);
};

// Get celestial type based on goal properties
const getCelestialType = (index: number) => {
    const types = ['planet', 'star', 'gasGiant', 'icePlanet', 'moon'] as const;
    // Could be expanded to use goal categories/tags
    return types[index % types.length];
};

export const CosmosMap: React.FC<CosmosMapProps> = ({
    goals,
    voyages = [],
    constellations = [],
    voyagerPosition,
    showGuide = true,
    onGoalClick,
}) => {
    const navigate = useNavigate();
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewportCenter, setViewportCenter] = useState({ x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Calculate goal positions
    const goalPositions = useMemo(() => {
        return goals.map((goal, index) => ({
            goal,
            position: getGalaxyPosition(index, goals.length, zoomLevel),
            status: getDestinationStatus(goal),
            progress: getGoalProgress(goal),
            celestialType: getCelestialType(index),
        }));
    }, [goals, zoomLevel]);

    // Handle zoom
    const handleZoom = useCallback((direction: 'in' | 'out') => {
        setZoomLevel(prev => {
            const newLevel = direction === 'in' ? prev * 1.2 : prev / 1.2;
            return Math.max(0.5, Math.min(3, newLevel));
        });
    }, []);

    // Reset view
    const handleResetView = useCallback(() => {
        setZoomLevel(1);
        setViewportCenter({ x: 50, y: 50 });
    }, []);

    // Pan/drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = (e.clientX - dragStart.x) * 0.1;
        const dy = (e.clientY - dragStart.y) * 0.1;
        setViewportCenter(prev => ({
            x: Math.max(0, Math.min(100, prev.x - dx / zoomLevel)),
            y: Math.max(0, Math.min(100, prev.y - dy / zoomLevel)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        handleZoom(e.deltaY < 0 ? 'in' : 'out');
    };

    // Handle goal selection
    const handleGoalClick = (goalId: string) => {
        setSelectedGoalId(goalId);
        if (onGoalClick) {
            onGoalClick(goalId);
        } else {
            navigate(`/plan/${goalId}`);
        }
    };

    return (
        <div
            className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] rounded-3xl overflow-hidden border border-white/10"
            style={{
                background: 'linear-gradient(180deg, hsl(260, 80%, 4%) 0%, hsl(260, 80%, 8%) 50%, hsl(280, 60%, 6%) 100%)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* ═══════════════════════════════════════════════════════════════
                LAYER 0: Deep Space Background (Parallax)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Distant stars layer (slowest parallax) */}
                {[...Array(80)].map((_, i) => (
                    <motion.div
                        key={`distant-star-${i}`}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${((i * 17 + viewportCenter.x * 0.1) % 120) - 10}%`,
                            top: `${((i * 23 + viewportCenter.y * 0.1) % 120) - 10}%`,
                            width: '1px',
                            height: '1px',
                            opacity: 0.3 + (i % 5) * 0.1,
                        }}
                    />
                ))}

                {/* Medium stars layer */}
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={`medium-star-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${((i * 29 + viewportCenter.x * 0.3) % 120) - 10}%`,
                            top: `${((i * 19 + viewportCenter.y * 0.3) % 120) - 10}%`,
                            width: '2px',
                            height: '2px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 0 4px 1px rgba(255,255,255,0.3)',
                        }}
                        animate={{
                            opacity: [0.4, 0.9, 0.4],
                            scale: [0.9, 1.1, 0.9],
                        }}
                        transition={{
                            duration: 2 + (i % 3),
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    />
                ))}

                {/* Close stars (fastest parallax) */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={`close-star-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${((i * 41 + viewportCenter.x * 0.6) % 120) - 10}%`,
                            top: `${((i * 37 + viewportCenter.y * 0.6) % 120) - 10}%`,
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 0 10px 3px rgba(255,255,255,0.5)',
                        }}
                        animate={{
                            opacity: [0.6, 1, 0.6],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 3 + (i % 2),
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}

                {/* Nebula gradients */}
                <motion.div
                    className="absolute rounded-full blur-[120px] opacity-30"
                    style={{
                        left: `${20 - viewportCenter.x * 0.2}%`,
                        top: `${10 - viewportCenter.y * 0.2}%`,
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                    }}
                />
                <motion.div
                    className="absolute rounded-full blur-[100px] opacity-25"
                    style={{
                        right: `${10 - (100 - viewportCenter.x) * 0.2}%`,
                        bottom: `${10 - (100 - viewportCenter.y) * 0.2}%`,
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
                    }}
                />
                <motion.div
                    className="absolute rounded-full blur-[80px] opacity-20"
                    style={{
                        left: '40%',
                        top: '30%',
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 60%)',
                    }}
                    animate={{
                        opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Cosmic dust particles */}
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={`dust-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${(i * 31) % 100}%`,
                            top: `${(i * 43) % 100}%`,
                            width: '1px',
                            height: '1px',
                            backgroundColor: 'rgba(168, 85, 247, 0.4)',
                        }}
                        animate={{
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: 15 + (i % 10),
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    />
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 1: Stardust Trails (Completed journeys)
                ═══════════════════════════════════════════════════════════════ */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                    <linearGradient id="stardust-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(254, 240, 138, 0.8)" />
                        <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
                        <stop offset="100%" stopColor="rgba(254, 240, 138, 0.4)" />
                    </linearGradient>
                    <filter id="stardust-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Draw stardust trails for completed goals */}
                {goalPositions
                    .filter(gp => gp.status === 'arrived')
                    .map((gp, idx) => {
                        const points = [];
                        for (let i = 0; i <= 20; i++) {
                            const t = i / 20;
                            const angle = t * Math.PI * 0.5;
                            const x = gp.position.x + Math.sin(angle) * 5 * t;
                            const y = gp.position.y - t * 8;
                            points.push(`${x},${y}`);
                        }
                        return (
                            <motion.polyline
                                key={`stardust-${idx}`}
                                points={points.join(' ')}
                                fill="none"
                                stroke="url(#stardust-gradient)"
                                strokeWidth="2"
                                filter="url(#stardust-glow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.6 }}
                                transition={{ duration: 2, delay: idx * 0.3 }}
                            />
                        );
                    })}
            </svg>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 2: Voyager Position
                ═══════════════════════════════════════════════════════════════ */}
            {voyagerPosition && (
                <motion.div
                    className="absolute z-10"
                    style={{
                        left: `${voyagerPosition.x}%`,
                        top: `${voyagerPosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{
                        y: [0, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <div className="relative">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(168,85,247,0.5) 100%)',
                                boxShadow: '0 0 20px 8px rgba(168, 85, 247, 0.5)',
                            }}
                        >
                            <span className="text-lg">🚀</span>
                        </div>
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-purple-400"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.8, 0, 0.8],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 3: Constellations (Vision boards)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
                {constellations.map((constellation, idx) => (
                    <div
                        key={constellation.id}
                        className="absolute pointer-events-auto"
                        style={{
                            left: `${20 + idx * 25}%`,
                            top: `${15 + (idx % 2) * 20}%`,
                        }}
                    >
                        <Constellation
                            id={constellation.id}
                            name={constellation.name}
                            stars={constellation.stars}
                            pattern={constellation.pattern}
                            isActive={constellation.isActive}
                            scale={150}
                        />
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 4: Celestial Bodies (Goals)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0" style={{ zIndex: 4 }}>
                <AnimatePresence>
                    {goalPositions.map((gp, index) => (
                        <motion.div
                            key={gp.goal.id}
                            className="absolute"
                            style={{
                                left: `${gp.position.x}%`,
                                top: `${gp.position.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                delay: index * 0.1,
                                type: 'spring',
                                stiffness: 100,
                            }}
                        >
                            <CelestialDestination
                                id={gp.goal.id || `goal-${index}`}
                                name={gp.goal.title}
                                celestialType={gp.celestialType}
                                status={gp.status}
                                size={zoomLevel > 1.5 ? 'lg' : zoomLevel < 0.8 ? 'sm' : 'md'}
                                progress={gp.progress}
                                distanceFromOrigin={50 + index * 5}
                                onClick={() => gp.goal.id && handleGoalClick(gp.goal.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 5: Trajectories (Voyage paths)
                ═══════════════════════════════════════════════════════════════ */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                {voyages.map((voyage) => {
                    // Find origin (voyager position or previous goal) and destination
                    const destGoal = goalPositions.find(gp => gp.goal.id === voyage.goalId);
                    if (!destGoal) return null;

                    const origin = voyagerPosition || { x: 50, y: 90 };
                    const destination = destGoal.position;

                    return (
                        <VoyageTrajectory
                            key={voyage.id}
                            id={voyage.id}
                            origin={origin}
                            destination={destination}
                            status={voyage.status}
                            progress={voyage.progress}
                            waypoints={voyage.waypoints}
                            showLabels={zoomLevel > 0.8}
                        />
                    );
                })}
            </svg>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 6: Labels & Tooltips
                ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedGoalId && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <p className="text-white text-sm">
                                Press Enter to navigate, Escape to deselect
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 7: UI Overlay
                ═══════════════════════════════════════════════════════════════ */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                {/* Zoom controls */}
                <div className="flex flex-col gap-1 bg-black/50 backdrop-blur-md rounded-xl p-2 border border-white/10">
                    <button
                        onClick={() => handleZoom('in')}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                        aria-label="Zoom in"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="text-center text-xs text-white/60 py-1">
                        {Math.round(zoomLevel * 100)}%
                    </div>
                    <button
                        onClick={() => handleZoom('out')}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                        aria-label="Zoom out"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Reset view */}
                <button
                    onClick={handleResetView}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-white"
                    aria-label="Reset view"
                >
                    <Home className="w-5 h-5" />
                </button>
            </div>

            {/* Compass indicator */}
            <div className="absolute top-4 left-4 z-50">
                <motion.div
                    className="p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <Compass className="w-6 h-6 text-purple-400" />
                </motion.div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-50">
                <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 border border-white/10">
                    <div className="text-xs text-white/60 mb-2 font-semibold">Legend</div>
                    <div className="flex flex-col gap-1 text-xs text-white/80">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                            <span>Undiscovered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span>Charted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                            <span>En Route</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span>Arrived</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {goals.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-40">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <motion.div
                            className="text-7xl mb-6"
                            animate={{
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            🌌
                        </motion.div>
                        <h3 className="text-2xl font-outfit font-semibold text-white/80 mb-2">
                            Your cosmos awaits
                        </h3>
                        <p className="text-white/50 max-w-xs">
                            Chart your first destination to see it appear as a celestial body in your universe
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Screen reader accessible list */}
            <ul className="sr-only">
                {goals.map((goal) => (
                    <li key={`sr-${goal.id}`}>
                        <a href={`/plan/${goal.id}`}>{goal.title}</a>
                    </li>
                ))}
            </ul>

            {/* The Guide AI Assistant */}
            {showGuide && (
                <TheGuide
                    context={{
                        currentLocation: 'cosmos',
                    }}
                />
            )}
        </div>
    );
};

export default CosmosMap;
