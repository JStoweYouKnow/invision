import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VisionStar, StarPattern } from '@/types';

interface ConstellationProps {
    id: string;
    name: string;
    stars: VisionStar[];
    pattern?: StarPattern;
    isActive?: boolean;
    scale?: number;
    showLabels?: boolean;
    onStarClick?: (star: VisionStar) => void;
    onConstellationClick?: () => void;
}

// Predefined constellation patterns
const PRESET_PATTERNS: Record<number, StarPattern> = {
    3: {
        // Triangle (Orion's Belt style)
        points: [
            { x: 0, y: 0 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 1 },
        ],
        connections: [
            [0, 1],
            [1, 2],
            [2, 0],
        ],
    },
    4: {
        // Diamond
        points: [
            { x: 0.5, y: 0 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 1 },
            { x: 0, y: 0.5 },
        ],
        connections: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
        ],
    },
    5: {
        // Pentagon/Star shape
        points: [
            { x: 0.5, y: 0 },
            { x: 1, y: 0.4 },
            { x: 0.8, y: 1 },
            { x: 0.2, y: 1 },
            { x: 0, y: 0.4 },
        ],
        connections: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 0],
        ],
    },
    6: {
        // Hexagon
        points: [
            { x: 0.5, y: 0 },
            { x: 1, y: 0.25 },
            { x: 1, y: 0.75 },
            { x: 0.5, y: 1 },
            { x: 0, y: 0.75 },
            { x: 0, y: 0.25 },
        ],
        connections: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 0],
        ],
    },
    7: {
        // Big Dipper
        points: [
            { x: 0, y: 0.3 },
            { x: 0.3, y: 0.2 },
            { x: 0.6, y: 0.1 },
            { x: 0.9, y: 0 },
            { x: 1, y: 0.3 },
            { x: 0.8, y: 0.6 },
            { x: 0.5, y: 0.5 },
        ],
        connections: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
            [6, 3],
        ],
    },
};

// Generate a simple circular pattern for any count
const generateCircularPattern = (count: number): StarPattern => {
    const points = [];
    const connections: [number, number][] = [];

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        points.push({
            x: 0.5 + 0.4 * Math.cos(angle),
            y: 0.5 + 0.4 * Math.sin(angle),
        });
        connections.push([i, (i + 1) % count]);
    }

    return { points, connections };
};

export const Constellation: React.FC<ConstellationProps> = ({
    id,
    name,
    stars,
    pattern,
    isActive = false,
    scale = 200,
    showLabels = true,
    onStarClick,
    onConstellationClick,
}) => {
    // Get or generate pattern based on star count
    const activePattern = useMemo(() => {
        if (pattern) return pattern;
        return PRESET_PATTERNS[stars.length] || generateCircularPattern(stars.length);
    }, [pattern, stars.length]);

    // Map stars to pattern positions
    const starPositions = useMemo(() => {
        return stars.map((star, index) => {
            const point = activePattern.points[index] || { x: 0.5, y: 0.5 };
            return {
                ...star,
                displayX: point.x * scale,
                displayY: point.y * scale,
            };
        });
    }, [stars, activePattern, scale]);

    // Animation variants
    const connectionVariants = {
        idle: { opacity: 0.2, pathLength: 1 },
        active: { opacity: 0.6, pathLength: 1 },
    };

    const starVariants = {
        idle: { scale: 1, opacity: 0.6 },
        active: { scale: 1.2, opacity: 1 },
    };

    return (
        <motion.div
            className="relative group cursor-pointer"
            style={{
                width: scale,
                height: scale,
            }}
            onClick={onConstellationClick}
            whileHover={{ scale: 1.05 }}
            role="button"
            aria-label={`Constellation: ${name}`}
            tabIndex={0}
            data-constellation-id={id}
        >
            {/* SVG for connection lines */}
            <svg
                className="absolute inset-0 pointer-events-none"
                width={scale}
                height={scale}
            >
                <defs>
                    <filter id={`constellation-glow-${id}`}>
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Connection lines */}
                {activePattern.connections.map(([startIdx, endIdx], i) => {
                    const start = activePattern.points[startIdx];
                    const end = activePattern.points[endIdx];
                    if (!start || !end) return null;

                    return (
                        <motion.line
                            key={`connection-${i}`}
                            x1={start.x * scale}
                            y1={start.y * scale}
                            x2={end.x * scale}
                            y2={end.y * scale}
                            stroke="rgba(255, 255, 255, 0.4)"
                            strokeWidth={isActive ? 2 : 1}
                            strokeLinecap="round"
                            filter={isActive ? `url(#constellation-glow-${id})` : undefined}
                            variants={connectionVariants}
                            initial="idle"
                            animate={isActive ? 'active' : 'idle'}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    );
                })}
            </svg>

            {/* Stars */}
            {starPositions.map((star, index) => (
                <motion.div
                    key={star.id}
                    className="absolute cursor-pointer"
                    style={{
                        left: star.displayX - 16,
                        top: star.displayY - 16,
                        width: 32,
                        height: 32,
                    }}
                    variants={starVariants}
                    initial="idle"
                    animate={isActive ? 'active' : 'idle'}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStarClick?.(star);
                    }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {/* Star glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                        }}
                        animate={
                            isActive
                                ? {
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }
                                : undefined
                        }
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                        }}
                    />

                    {/* Star point */}
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            fontSize: isActive ? 16 : 12,
                        }}
                    >
                        {star.imageUrl ? (
                            <div
                                className="w-6 h-6 rounded-full bg-cover bg-center border border-white/30"
                                style={{ backgroundImage: `url(${star.imageUrl})` }}
                            />
                        ) : (
                            <span
                                className="text-white"
                                style={{
                                    textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                                }}
                            >
                                ✦
                            </span>
                        )}
                    </div>

                    {/* Star tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                            {star.title}
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Constellation name label */}
            {showLabels && (
                <motion.div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                >
                    <div
                        className="font-outfit font-medium text-sm tracking-wider uppercase"
                        style={{
                            color: isActive ? '#f3e8ff' : 'rgba(255, 255, 255, 0.5)',
                            textShadow: isActive
                                ? '0 0 20px rgba(168, 85, 247, 0.8)'
                                : 'none',
                        }}
                    >
                        {name}
                    </div>
                </motion.div>
            )}

            {/* Twinkle effect on idle */}
            {!isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-0.5 h-0.5 bg-white rounded-full"
                            style={{
                                left: `${20 + (i * 23) % 60}%`,
                                top: `${20 + (i * 37) % 60}%`,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.7,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Activation pulse effect */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </motion.div>
    );
};

export default Constellation;
