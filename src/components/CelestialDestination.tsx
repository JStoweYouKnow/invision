import React from 'react';
import { motion } from 'framer-motion';
import type { CelestialType, DestinationStatus } from '@/types';
import { CelestialBody } from './CelestialBody';

interface CelestialDestinationProps {
    id: string;
    name: string;
    celestialType: CelestialType;
    status: DestinationStatus;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    progress?: number; // 0-100 for progress ring
    distanceFromOrigin?: number; // Visual depth indicator
    onClick?: () => void;
    onHover?: () => void;
}

// Size configurations in pixels
const SIZE_CONFIG = {
    sm: 48,
    md: 80,
    lg: 120,
    xl: 180,
};

// Status-based visual configurations
const STATUS_CONFIG: Record<DestinationStatus, {
    opacity: number;
    filter: string;
    labelSuffix: string;
    glowIntensity: number;
    showProgress: boolean;
}> = {
    undiscovered: {
        opacity: 0.4,
        filter: 'grayscale(80%) brightness(0.6)',
        labelSuffix: '(Unknown World)',
        glowIntensity: 0.3,
        showProgress: false,
    },
    charted: {
        opacity: 0.9,
        filter: 'none',
        labelSuffix: '',
        glowIntensity: 0.6,
        showProgress: false,
    },
    enRoute: {
        opacity: 1,
        filter: 'none',
        labelSuffix: '',
        glowIntensity: 1,
        showProgress: true,
    },
    arrived: {
        opacity: 1,
        filter: 'none',
        labelSuffix: '✓ Discovered',
        glowIntensity: 0.8,
        showProgress: false,
    },
    archived: {
        opacity: 0.5,
        filter: 'grayscale(30%)',
        labelSuffix: '(Archived)',
        glowIntensity: 0.3,
        showProgress: false,
    },
};

// Celestial type to index mapping for CelestialBody
const TYPE_TO_INDEX: Record<CelestialType, number> = {
    planet: 0,
    moon: 1,
    gasGiant: 2,
    icePlanet: 3,
    star: 4,
    galaxy: 4, // Fallback to star for now
};

// Glow colors per celestial type
const GLOW_COLORS: Record<CelestialType, string> = {
    planet: '#7c3aed',
    moon: '#9ca3af',
    gasGiant: '#fb923c',
    icePlanet: '#67e8f9',
    star: '#fef08a',
    galaxy: '#a855f7',
};

export const CelestialDestination: React.FC<CelestialDestinationProps> = ({
    id,
    name,
    celestialType,
    status,
    size = 'md',
    progress = 0,
    distanceFromOrigin = 50,
    onClick,
    onHover,
}) => {
    const pixelSize = SIZE_CONFIG[size];
    const statusConfig = STATUS_CONFIG[status];
    const glowColor = GLOW_COLORS[celestialType];
    const typeIndex = TYPE_TO_INDEX[celestialType];

    // Calculate progress ring parameters
    const ringRadius = pixelSize / 2 + 8;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const progressOffset = ringCircumference - (progress / 100) * ringCircumference;

    return (
        <motion.div
            className="relative group cursor-pointer"
            style={{
                width: pixelSize + 40,
                height: pixelSize + 40,
            }}
            onClick={onClick}
            onHoverStart={onHover}
            whileHover={{ scale: status !== 'archived' ? 1.08 : 1 }}
            whileTap={{ scale: 0.95 }}
            role="button"
            aria-label={`${name} - ${celestialType} - ${status}`}
            tabIndex={0}
            data-destination-id={id}
        >
            {/* Distance indicator (depth/perspective) */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: `scale(${0.7 + (distanceFromOrigin / 100) * 0.5})`,
                }}
            >
                {/* Outer discovery glow for arrived status */}
                {status === 'arrived' && (
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: pixelSize + 60,
                            height: pixelSize + 60,
                            background: `radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)`,
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}

                {/* Progress ring */}
                {statusConfig.showProgress && progress > 0 && (
                    <svg
                        className="absolute"
                        width={pixelSize + 20}
                        height={pixelSize + 20}
                        style={{
                            transform: 'rotate(-90deg)',
                        }}
                    >
                        {/* Background ring */}
                        <circle
                            cx={(pixelSize + 20) / 2}
                            cy={(pixelSize + 20) / 2}
                            r={ringRadius}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth={4}
                        />
                        {/* Progress ring */}
                        <motion.circle
                            cx={(pixelSize + 20) / 2}
                            cy={(pixelSize + 20) / 2}
                            r={ringRadius}
                            fill="none"
                            stroke={glowColor}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={ringCircumference}
                            initial={{ strokeDashoffset: ringCircumference }}
                            animate={{ strokeDashoffset: progressOffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                filter: `drop-shadow(0 0 6px ${glowColor})`,
                            }}
                        />
                        {/* Progress percentage */}
                        <text
                            x={(pixelSize + 20) / 2}
                            y={(pixelSize + 20) / 2 - ringRadius - 10}
                            fill="white"
                            fontSize={10}
                            textAnchor="middle"
                            style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                        >
                            {progress}%
                        </text>
                    </svg>
                )}

                {/* The celestial body */}
                <motion.div
                    style={{
                        opacity: statusConfig.opacity,
                        filter: statusConfig.filter,
                    }}
                    animate={
                        status === 'enRoute'
                            ? {
                                boxShadow: [
                                    `0 0 20px ${glowColor}66`,
                                    `0 0 40px ${glowColor}99`,
                                    `0 0 20px ${glowColor}66`,
                                ],
                            }
                            : undefined
                    }
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="rounded-full"
                >
                    <CelestialBody size={pixelSize} index={typeIndex} />
                </motion.div>

                {/* Charted sparkle effect */}
                {status === 'charted' && (
                    <motion.div
                        className="absolute pointer-events-none"
                        style={{
                            width: pixelSize,
                            height: pixelSize,
                        }}
                    >
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{
                                    left: `${25 + (i % 2) * 50}%`,
                                    top: `${25 + Math.floor(i / 2) * 50}%`,
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.5,
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Name label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <motion.div
                    className="font-outfit font-semibold text-sm text-starlight"
                    style={{
                        textShadow: `0 0 10px ${glowColor}`,
                        opacity: statusConfig.opacity,
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: statusConfig.opacity, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {status === 'undiscovered' ? 'Unknown World' : name}
                </motion.div>
                {statusConfig.labelSuffix && (
                    <div
                        className="text-xs mt-0.5"
                        style={{
                            color:
                                status === 'arrived'
                                    ? '#fbbf24'
                                    : 'rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        {statusConfig.labelSuffix}
                    </div>
                )}
                {status === 'enRoute' && (
                    <div className="text-xs text-blue-400 mt-0.5">
                        Voyage in progress...
                    </div>
                )}
            </div>

            {/* Hover tooltip with details */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-black/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-white/10 whitespace-nowrap">
                    <div className="font-semibold">{name}</div>
                    <div className="text-white/60 capitalize">{celestialType}</div>
                    {progress > 0 && (
                        <div className="text-purple-400">{progress}% explored</div>
                    )}
                </div>
            </div>

            {/* Orbit indicator for charted destinations */}
            {(status === 'charted' || status === 'enRoute') && (
                <motion.div
                    className="absolute rounded-full border border-white/10 pointer-events-none"
                    style={{
                        width: pixelSize + 60,
                        height: pixelSize + 60,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <div
                        className="absolute w-2 h-2 bg-purple-400 rounded-full"
                        style={{
                            top: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
                        }}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

export default CelestialDestination;
