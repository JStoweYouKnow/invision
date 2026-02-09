import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { CelestialBody, type CelestialType } from './CelestialBody';

export type NeuralType = 'neuron' | 'node' | 'synapse' | 'brain';
export type ForestType = 'oak' | 'pine' | 'willow' | 'bonsai' | 'leaf';
export type EntityType = CelestialType | NeuralType | ForestType;

interface ThemeEntityProps {
    size: number;
    index?: number;
    seed?: string;
    type?: EntityType;
}

const NEURAL_TYPES: NeuralType[] = ['neuron', 'node', 'synapse', 'brain'];
const FOREST_TYPES: ForestType[] = ['oak', 'pine', 'willow', 'bonsai', 'leaf'];

// Get entity type based on theme and index
function getEntityType(themeId: string, index: number): EntityType {
    switch (themeId) {
        case 'brain':
            return NEURAL_TYPES[index % NEURAL_TYPES.length];
        case 'tree':
            return FOREST_TYPES[index % FOREST_TYPES.length];
        default: {
            const celestialTypes: CelestialType[] = ['planet', 'moon', 'icePlanet'];
            return celestialTypes[index % celestialTypes.length];
        }
    }
}

// Neural Entity - Neurons, nodes, synapses, brains
const NeuralEntity: React.FC<{ size: number; type: NeuralType; index: number; colors: { primary: string; accent: string; glow: string } }> = ({
    size, type, index, colors
}) => {

    // Different neural shapes based on type
    const renderShape = () => {
        switch (type) {
            case 'neuron':
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Dendrites */}
                        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                            <motion.line
                                key={i}
                                x1="24" y1="24"
                                x2={24 + Math.cos(angle * Math.PI / 180) * 20}
                                y2={24 + Math.sin(angle * Math.PI / 180) * 20}
                                stroke={colors.accent}
                                strokeWidth="2"
                                strokeLinecap="round"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                        {/* Cell body */}
                        <motion.circle
                            cx="24" cy="24" r="10"
                            fill={colors.primary}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Nucleus */}
                        <circle cx="24" cy="24" r="4" fill={colors.accent} />
                    </svg>
                );

            case 'node':
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Outer ring pulse */}
                        <motion.circle
                            cx="24" cy="24" r="18"
                            fill="none"
                            stroke={colors.accent}
                            strokeWidth="1"
                            animate={{ r: [18, 22, 18], opacity: [0.8, 0.2, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Main node */}
                        <motion.circle
                            cx="24" cy="24" r="14"
                            fill={`url(#nodeGradient-${index})`}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        {/* Inner glow */}
                        <circle cx="24" cy="24" r="6" fill={colors.accent} opacity="0.6" />
                        <defs>
                            <radialGradient id={`nodeGradient-${index}`} cx="30%" cy="30%">
                                <stop offset="0%" stopColor={colors.accent} />
                                <stop offset="100%" stopColor={colors.primary} />
                            </radialGradient>
                        </defs>
                    </svg>
                );

            case 'synapse':
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Two connected nodes */}
                        <circle cx="14" cy="24" r="8" fill={colors.primary} />
                        <circle cx="34" cy="24" r="8" fill={colors.primary} />
                        {/* Electric spark between */}
                        <motion.path
                            d="M 22 24 Q 28 18 34 24 Q 28 30 22 24"
                            fill="none"
                            stroke={colors.accent}
                            strokeWidth="2"
                            animate={{ pathLength: [0, 1, 0], opacity: [1, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        {/* Spark particles */}
                        {[0, 1, 2].map(i => (
                            <motion.circle
                                key={i}
                                cx={24 + (i - 1) * 4}
                                cy={24}
                                r="2"
                                fill={colors.accent}
                                animate={{ opacity: [0, 1, 0], y: [(i - 1) * 2, 0, (i - 1) * 2] }}
                                transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                );

            case 'brain':
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Brain shape using bezier curves */}
                        <motion.path
                            d="M 24 8 
                               Q 38 10 40 24 
                               Q 42 36 28 42 
                               Q 24 44 20 42 
                               Q 6 36 8 24 
                               Q 10 10 24 8"
                            fill={colors.primary}
                            stroke={colors.accent}
                            strokeWidth="1"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        {/* Brain folds */}
                        <path d="M 18 16 Q 24 20 30 16" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
                        <path d="M 16 24 Q 24 28 32 24" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
                        <path d="M 18 32 Q 24 36 30 32" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
                        {/* Neural activity pulses */}
                        {[{ x: 20, y: 18 }, { x: 28, y: 26 }, { x: 22, y: 34 }].map((pos, i) => (
                            <motion.circle
                                key={i}
                                cx={pos.x} cy={pos.y} r="2"
                                fill={colors.accent}
                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                transition={{ duration: 1.5, delay: i * 0.5, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                );
        }
    };

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Glow effect */}
            <div
                className="absolute inset-0 rounded-full blur-md pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    transform: 'scale(1.3)',
                }}
            />
            {renderShape()}
        </div>
    );
};

// Forest Entity - Floating Islands with different tree types
const ForestEntity: React.FC<{ size: number; type: ForestType; index: number; colors: { primary: string; secondary: string; accent: string; glow: string } }> = ({
    size, type, index, colors
}) => {
    // Generate random seed for organic variation based on index
    const randomSeed = (index * 1337) % 100;
    const islandShapeVariance = [
        "M 10 34 Q 24 38 38 34 Q 36 42 24 46 Q 12 42 10 34", // Standard
        "M 12 34 Q 24 36 36 34 Q 38 40 30 46 Q 18 48 10 40 Q 8 36 12 34", // lopsided
        "M 8 34 Q 24 40 40 34 Q 36 44 24 48 Q 12 44 8 34" // Deep
    ][index % 3];

    const renderTree = () => {
        switch (type) {
            case 'oak':
                return (
                    <g transform="translate(0, -4)">
                        <defs>
                            <radialGradient id={`oakGrad-${index}`} cx="30%" cy="30%">
                                <stop offset="0%" stopColor={colors.primary} />
                                <stop offset="100%" stopColor={colors.secondary} />
                            </radialGradient>
                        </defs>
                        {/* Trunk */}
                        <path d="M 22 36 L 22 28 Q 20 24 18 20 M 26 36 L 26 28 Q 28 24 30 20" stroke={colors.secondary} strokeWidth="2" fill="none" />
                        <rect x="22" y="28" width="4" height="10" fill={colors.secondary} />

                        {/* Canopy Layers */}
                        <motion.circle cx="24" cy="18" r="14" fill={`url(#oakGrad-${index})`}
                            animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, delay: index * 0.2 }} />
                        <circle cx="16" cy="14" r="5" fill={colors.primary} opacity="0.6" />
                        <circle cx="30" cy="16" r="6" fill={colors.secondary} opacity="0.4" />
                        <circle cx="24" cy="24" r="8" fill={colors.secondary} opacity="0.3" />
                    </g>
                );

            case 'pine':
                return (
                    <g transform="translate(0, -2)">
                        <defs>
                            <linearGradient id={`pineGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={colors.primary} />
                                <stop offset="100%" stopColor={colors.secondary} />
                            </linearGradient>
                        </defs>
                        <rect x="22" y="32" width="4" height="6" fill={colors.secondary} />
                        {/* Layers */}
                        <motion.path d="M 24 4 L 38 24 L 10 24 Z" fill={`url(#pineGrad-${index})`}
                            animate={{ d: ["M 24 4 L 38 24 L 10 24 Z", "M 24 3 L 39 25 L 9 25 Z", "M 24 4 L 38 24 L 10 24 Z"] }}
                            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }} />
                        <path d="M 24 12 L 36 32 L 12 32 Z" fill={colors.primary} opacity="0.8" />
                        <path d="M 24 20 L 34 36 L 14 36 Z" fill={colors.secondary} opacity="0.6" />
                    </g>
                );

            case 'willow':
                return (
                    <g transform="translate(0, -2)">
                        <path d="M 22 38 Q 20 30 18 26 M 26 38 Q 28 30 30 26" stroke={colors.secondary} strokeWidth="2" fill="none" />
                        <rect x="22" y="24" width="4" height="14" fill={colors.secondary} />
                        <change>
                            <ellipse cx="24" cy="18" rx="12" ry="10" fill={colors.primary} opacity="0.4" />
                            {[-3, -1, 1, 3].map((offset, i) => (
                                <motion.path
                                    key={i}
                                    d={`M ${24 + offset * 3} 14 Q ${24 + offset * 6} 28 ${24 + offset * 8} 44`}
                                    stroke={colors.primary}
                                    strokeWidth="1.5"
                                    fill="none"
                                    animate={{
                                        d: [
                                            `M ${24 + offset * 3} 14 Q ${24 + offset * 6} 28 ${24 + offset * 8} 44`,
                                            `M ${24 + offset * 3} 14 Q ${24 + offset * 6 + 2} 28 ${24 + offset * 8 + 1} 44`,
                                            `M ${24 + offset * 3} 14 Q ${24 + offset * 6} 28 ${24 + offset * 8} 44`
                                        ]
                                    }}
                                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                                />
                            ))}
                        </change>
                    </g>
                );

            case 'bonsai':
                return (
                    <g transform="translate(0, -4)">
                        {/* Twisted Trunk */}
                        <motion.path
                            d="M 24 38 C 20 32, 28 28, 22 22 C 18 18, 26 14, 24 10"
                            stroke={colors.secondary}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                        />
                        {/* Foliage Pads */}
                        {[
                            { cx: 18, cy: 18, rx: 6, ry: 4 }, { cx: 28, cy: 14, rx: 5, ry: 3 }, { cx: 24, cy: 6, rx: 4, ry: 3 }
                        ].map((pad, i) => (
                            <motion.ellipse
                                key={i}
                                cx={pad.cx} cy={pad.cy} rx={pad.rx} ry={pad.ry}
                                fill={colors.primary}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, delay: i, repeat: Infinity }}
                            />
                        ))}
                    </g>
                );

            case 'leaf':
            default:
                return (
                    <g transform="translate(0, -6)">
                        <motion.path
                            d="M 24 12 Q 36 24 24 36 Q 12 24 24 12 Z"
                            fill={colors.primary}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        />
                        <path d="M 24 36 L 24 40" stroke={colors.secondary} strokeWidth="1" />
                    </g>
                );
        }
    };

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Island Base */}
            <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
                <g transform="translate(0, 2)">
                    {/* Floating Animation for whole island */}
                    <motion.g
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 4 + (index % 3), repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Roots hanging down */}
                        {[0, 1, 2, 3].map(i => (
                            <motion.path
                                key={`root-${i}`}
                                d={`M ${18 + i * 4} 40 Q ${16 + i * 5} 44 ${18 + i * 4} 48`}
                                stroke={colors.secondary}
                                strokeWidth="1"
                                opacity="0.7"
                                fill="none"
                                animate={{
                                    d: [
                                        `M ${18 + i * 4} 40 Q ${16 + i * 5} 44 ${18 + i * 4} 48`,
                                        `M ${18 + i * 4} 40 Q ${20 + i * 5} 45 ${14 + i * 4} 47`,
                                        `M ${18 + i * 4} 40 Q ${16 + i * 5} 44 ${18 + i * 4} 48`
                                    ]
                                }}
                                transition={{ duration: 3 + i, repeat: Infinity }}
                            />
                        ))}

                        {/* Earthy Base */}
                        <path d={islandShapeVariance} fill="#5d4037" /> {/* Darker earth tone */}
                        <path d={islandShapeVariance} fill={colors.secondary} opacity="0.3" transform="scale(0.9) translate(2.4, 2)" />

                        {/* Grassy Top */}
                        <path d="M 10 34 Q 24 30 38 34 L 38 35 Q 24 40 10 35 Z" fill={colors.secondary} />

                        {/* The Tree itself */}
                        {renderTree()}
                    </motion.g>
                </g>

                {/* Fireflies / Magic Particles */}
                {[0, 1, 2].map(i => (
                    <motion.circle
                        key={`particle-${i}`}
                        cx={10 + i * 14}
                        cy={20}
                        r={1}
                        fill={colors.accent}
                        animate={{
                            y: [0, -20, 0],
                            x: [0, (i % 2 === 0 ? 5 : -5), 0],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.7 }}
                    />
                ))}
            </svg>
        </div>
    );
};

// Main theme-aware entity component
export const ThemeEntity: React.FC<ThemeEntityProps> = ({ size, index = 0, seed, type: explicitType }) => {
    const { currentTheme } = useTheme();
    const themeId = currentTheme.id;
    const { colors } = currentTheme;

    // Determine entity type based on theme
    const entityType = explicitType || getEntityType(themeId, index);

    // Check if it's a neural type
    if (themeId === 'brain' && NEURAL_TYPES.includes(entityType as NeuralType)) {
        return (
            <NeuralEntity
                size={size}
                type={entityType as NeuralType}
                index={index}
                colors={{
                    primary: colors.primary,
                    accent: colors.accent,
                    glow: colors.glow,
                }}
            />
        );
    }

    // Check if it's a forest type
    if (themeId === 'tree' && FOREST_TYPES.includes(entityType as ForestType)) {
        return (
            <ForestEntity
                size={size}
                type={entityType as ForestType}
                index={index}
                colors={{
                    primary: colors.primary,
                    secondary: colors.secondary,
                    accent: colors.accent,
                    glow: colors.glow,
                }}
            />
        );
    }

    // Default to celestial body for space theme
    return <CelestialBody size={size} index={index} seed={seed} type={entityType as CelestialType} />;
};

// Theme-aware central entity (sun/brain/tree)
export const ThemeCentralEntity: React.FC<{ size: number }> = ({ size }) => {
    const { currentTheme } = useTheme();
    const { colors } = currentTheme;

    switch (currentTheme.id) {
        case 'brain':
            return (
                <div className="relative" style={{ width: size, height: size }}>
                    {/* Pulsing glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
                        animate={{ scale: [1.2, 1.5, 1.2], opacity: [0.6, 0.3, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    {/* Central brain */}
                    <svg viewBox="0 0 48 48" className="w-full h-full relative z-10">
                        <motion.path
                            d="M 24 6 Q 42 10 44 24 Q 46 40 28 46 Q 24 48 20 46 Q 2 40 4 24 Q 6 10 24 6"
                            fill={colors.primary}
                            stroke={colors.accent}
                            strokeWidth="1.5"
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        {/* Brain folds */}
                        <path d="M 14 18 Q 24 24 34 18" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.7" />
                        <path d="M 12 26 Q 24 32 36 26" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.7" />
                        <path d="M 14 34 Q 24 40 34 34" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.7" />
                        {/* Synaptic flashes */}
                        {[{ x: 18, y: 20 }, { x: 30, y: 28 }, { x: 20, y: 36 }, { x: 28, y: 14 }].map((pos, i) => (
                            <motion.circle
                                key={i}
                                cx={pos.x} cy={pos.y} r="3"
                                fill={colors.accent}
                                animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.4, 0.6] }}
                                transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                </div>
            );

        case 'tree':
            return (
                <div className="relative" style={{ width: size, height: size }}>
                    {/* Organic glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
                        animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.5, 0.3, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    {/* Central tree */}
                    <svg viewBox="0 0 48 48" className="w-full h-full relative z-10">
                        {/* Trunk */}
                        <rect x="20" y="34" width="8" height="12" fill={colors.secondary} rx="2" />
                        {/* Roots */}
                        <path d="M 18 44 Q 14 48 10 46" stroke={colors.secondary} strokeWidth="2" fill="none" />
                        <path d="M 30 44 Q 34 48 38 46" stroke={colors.secondary} strokeWidth="2" fill="none" />
                        {/* Canopy */}
                        <motion.ellipse
                            cx="24" cy="22" rx="20" ry="18"
                            fill={colors.primary}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        />
                        <ellipse cx="24" cy="16" rx="16" ry="12" fill={colors.secondary} opacity="0.4" />
                        <ellipse cx="24" cy="12" rx="12" ry="8" fill={colors.primary} opacity="0.7" />
                        {/* Light rays */}
                        {[0, 1, 2, 3].map(i => (
                            <motion.line
                                key={i}
                                x1="24" y1="22"
                                x2={24 + Math.cos((i * 90 + 45) * Math.PI / 180) * 24}
                                y2={22 + Math.sin((i * 90 + 45) * Math.PI / 180) * 24}
                                stroke={colors.accent}
                                strokeWidth="1"
                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                </div>
            );

        default:
            // Space theme - use sun
            return <CelestialBody type="star" size={size} />;
    }
};

export default ThemeEntity;
