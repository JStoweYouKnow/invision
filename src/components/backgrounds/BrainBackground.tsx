import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface BrainBackgroundProps {
    className?: string;
}

interface Neuron {
    id: number;
    x: number;
    y: number;
    size: number;
    connections: number[];
}

// Generate stable neuron network
function generateNeurons(count: number, seed: number = 42): Neuron[] {
    const neurons: Neuron[] = [];
    const random = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

    for (let i = 0; i < count; i++) {
        neurons.push({
            id: i,
            x: random(i * 2) * 100,
            y: random(i * 2 + 1) * 100,
            size: 6 + random(i * 3) * 10,
            connections: [],
        });
    }

    // Create connections to nearby neurons
    neurons.forEach((neuron, i) => {
        const connectionCount = 1 + Math.floor(random(i * 4) * 3);
        const distances = neurons
            .map((other, j) => ({
                index: j,
                dist: Math.hypot(neuron.x - other.x, neuron.y - other.y)
            }))
            .filter(d => d.index !== i && d.dist < 35)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, connectionCount);

        neuron.connections = distances.map(d => d.index);
    });

    return neurons;
}

export const BrainBackground: React.FC<BrainBackgroundProps> = ({ className = '' }) => {
    const { currentTheme } = useTheme();
    const { colors, particles } = currentTheme;

    const neurons = useMemo(() => generateNeurons(particles.count), [particles.count]);

    // Get unique connections (avoid drawing same line twice)
    const connections = useMemo(() => {
        const seen = new Set<string>();
        const result: { from: Neuron; to: Neuron; id: string }[] = [];

        neurons.forEach(neuron => {
            neuron.connections.forEach(targetId => {
                const key = [neuron.id, targetId].sort().join('-');
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push({
                        from: neuron,
                        to: neurons[targetId],
                        id: key
                    });
                }
            });
        });

        return result;
    }, [neurons]);

    return (
        <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
            style={{ backgroundColor: colors.background }}>

            {/* Neural glow nebulas */}
            <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-30"
                style={{ background: `radial-gradient(circle, ${colors.primary}50 0%, transparent 70%)` }} />
            <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-25"
                style={{ background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)` }} />

            {/* SVG for dendrite connections */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="dendriteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
                        <stop offset="50%" stopColor={colors.accent} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="dendriteGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Dendrite connections */}
                {connections.map(({ from, to, id }, i) => {
                    // Calculate control point for curved line
                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const perpX = -dy * 0.2;
                    const perpY = dx * 0.2;

                    return (
                        <motion.path
                            key={id}
                            d={`M ${from.x}% ${from.y}% Q ${midX + perpX}% ${midY + perpY}% ${to.x}% ${to.y}%`}
                            stroke="url(#dendriteGradient)"
                            strokeWidth="1.5"
                            fill="none"
                            filter="url(#dendriteGlow)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 2, delay: i * 0.05 }}
                        />
                    );
                })}

                {/* Synaptic pulses traveling along connections */}
                {connections.slice(0, 15).map(({ from, to, id }, i) => {
                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const perpX = -dy * 0.2;
                    const perpY = dx * 0.2;

                    return (
                        <motion.circle
                            key={`pulse-${id}`}
                            r="3"
                            fill={colors.accent}
                            filter="url(#dendriteGlow)"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                offsetDistance: ['0%', '100%'],
                            }}
                            transition={{
                                duration: 2 + (i % 3),
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeInOut"
                            }}
                            style={{
                                offsetPath: `path("M ${from.x}% ${from.y}% Q ${midX + perpX}% ${midY + perpY}% ${to.x}% ${to.y}%")`,
                            }}
                        />
                    );
                })}
            </svg>

            {/* Neuron cell bodies */}
            {neurons.map((neuron, i) => (
                <motion.div
                    key={`neuron-${neuron.id}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${neuron.x}%`,
                        top: `${neuron.y}%`,
                        width: `${neuron.size}px`,
                        height: `${neuron.size}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: particles.color,
                        boxShadow: `0 0 ${neuron.size}px ${neuron.size / 2}px ${particles.glowColor},
                                    0 0 ${neuron.size * 2}px ${neuron.size}px ${colors.glow}`
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 3 + (i % 4),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (i % 6) * 0.3
                    }}
                />
            ))}

            {/* Floating neural particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${(i * 17) % 100}%`,
                        top: `${(i * 23) % 100}%`,
                        width: '2px',
                        height: '2px',
                        backgroundColor: colors.accent,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: 4 + (i % 3),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2
                    }}
                />
            ))}
        </div>
    );
};
