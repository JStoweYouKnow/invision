import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { CelestialBody, type CelestialType } from './CelestialBody';

export type NeuralType = 'neuron' | 'node' | 'synapse' | 'brain';
export type ForestType = 'oak' | 'pine' | 'willow' | 'bonsai';
export type EntityType = CelestialType | NeuralType | ForestType;

interface ThemeEntityProps {
    size: number;
    index?: number;
    seed?: string;
    type?: EntityType;
}

const NEURAL_TYPES: NeuralType[] = ['neuron', 'node', 'synapse', 'brain'];
const FOREST_TYPES: ForestType[] = ['oak', 'pine', 'willow', 'bonsai'];

// Get entity type based on theme and index
function getEntityType(themeId: string, index: number): EntityType {
    switch (themeId) {
        case 'brain':
            return NEURAL_TYPES[index % NEURAL_TYPES.length];
        case 'tree':
            return FOREST_TYPES[index % FOREST_TYPES.length];
        default: {
            const celestialTypes: CelestialType[] = ['planet', 'moon', 'gasGiant', 'icePlanet'];
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

// Forest Entity - Different tree types
const ForestEntity: React.FC<{ size: number; type: ForestType; index: number; colors: { primary: string; secondary: string; accent: string; glow: string } }> = ({
    size, type, index, colors
}) => {
    const renderShape = () => {
        switch (type) {
            case 'oak':
                // Classic round oak tree
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        <defs>
                            <radialGradient id={`oakGrad-${index}`} cx="30%" cy="30%">
                                <stop offset="0%" stopColor={colors.primary} />
                                <stop offset="100%" stopColor={colors.secondary} />
                            </radialGradient>
                        </defs>
                        {/* Trunk */}
                        <rect x="20" y="32" width="8" height="14" fill={colors.secondary} rx="2" />
                        {/* Round canopy */}
                        <motion.circle
                            cx="24" cy="20" r="16"
                            fill={`url(#oakGrad-${index})`}
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        {/* Canopy highlights */}
                        <circle cx="18" cy="16" r="6" fill={colors.primary} opacity="0.5" />
                        <circle cx="28" cy="22" r="5" fill={colors.secondary} opacity="0.3" />
                        {/* Falling leaves */}
                        {[0, 1].map(i => (
                            <motion.circle
                                key={i}
                                cx={16 + i * 16} cy={28}
                                r="2"
                                fill={colors.accent}
                                animate={{ y: [0, 18], x: [(i - 0.5) * 8, 0], opacity: [1, 0] }}
                                transition={{ duration: 3, delay: i * 1.2, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                );

            case 'pine':
                // Triangular pine/evergreen tree
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        <defs>
                            <linearGradient id={`pineGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={colors.primary} />
                                <stop offset="100%" stopColor={colors.secondary} />
                            </linearGradient>
                        </defs>
                        {/* Trunk */}
                        <rect x="21" y="38" width="6" height="8" fill={colors.secondary} rx="1" />
                        {/* Stacked triangles for pine shape */}
                        <motion.polygon
                            points="24,4 38,22 10,22"
                            fill={`url(#pineGrad-${index})`}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <polygon points="24,14 40,32 8,32" fill={colors.primary} opacity="0.8" />
                        <polygon points="24,24 42,40 6,40" fill={colors.secondary} opacity="0.6" />
                        {/* Snow/highlight on tips */}
                        <circle cx="24" cy="6" r="2" fill="white" opacity="0.3" />
                        {/* Sparkle particles */}
                        {[0, 1, 2].map(i => (
                            <motion.circle
                                key={i}
                                cx={14 + i * 10} cy={18 + i * 6}
                                r="1.5"
                                fill={colors.accent}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                );

            case 'willow':
                // Weeping willow with drooping branches
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Trunk */}
                        <path d="M 22 46 Q 24 36 26 46" fill={colors.secondary} />
                        <rect x="22" y="24" width="4" height="22" fill={colors.secondary} rx="1" />
                        {/* Main canopy dome */}
                        <ellipse cx="24" cy="18" rx="14" ry="12" fill={colors.primary} opacity="0.4" />
                        {/* Drooping branches */}
                        {[-3, -1, 1, 3].map((offset, i) => (
                            <motion.path
                                key={i}
                                d={`M ${24 + offset * 3} 14 Q ${24 + offset * 6} 28 ${24 + offset * 8} 42`}
                                stroke={colors.primary}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                animate={{ x: [0, offset * 0.5, 0] }}
                                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                            />
                        ))}
                        {/* Additional drooping strands */}
                        {[-2, 0, 2].map((offset, i) => (
                            <motion.path
                                key={`strand-${i}`}
                                d={`M ${24 + offset * 4} 16 Q ${24 + offset * 5} 30 ${24 + offset * 6} 38`}
                                stroke={colors.secondary}
                                strokeWidth="2"
                                fill="none"
                                animate={{ x: [0, offset * 0.3, 0] }}
                                transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </svg>
                );

            case 'bonsai':
                // Stylized bonsai tree
                return (
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                        {/* Pot */}
                        <rect x="14" y="40" width="20" height="6" fill={colors.secondary} rx="2" />
                        <rect x="16" y="38" width="16" height="4" fill={colors.accent} opacity="0.6" rx="1" />
                        {/* Curved trunk */}
                        <motion.path
                            d="M 24 38 Q 20 32 22 26 Q 18 22 20 16"
                            stroke={colors.secondary}
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            animate={{ pathLength: [0.95, 1, 0.95] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        {/* Cloud-like foliage clusters */}
                        <motion.ellipse
                            cx="18" cy="14" rx="8" ry="6"
                            fill={colors.primary}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <ellipse cx="28" cy="18" rx="7" ry="5" fill={colors.primary} opacity="0.8" />
                        <ellipse cx="22" cy="8" rx="6" ry="4" fill={colors.secondary} opacity="0.6" />
                        {/* Zen particles */}
                        {[0, 1].map(i => (
                            <motion.circle
                                key={i}
                                cx={16 + i * 14} cy={10 + i * 6}
                                r="1.5"
                                fill={colors.accent}
                                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                                transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity }}
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
