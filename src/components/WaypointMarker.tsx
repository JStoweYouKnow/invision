import React from 'react';
import { motion } from 'framer-motion';
import type { WaypointType, WaypointStatus } from '@/types';

interface WaypointMarkerProps {
    id: string;
    title: string;
    type: WaypointType;
    status: WaypointStatus;
    size?: 'sm' | 'md' | 'lg';
    isUrgent?: boolean;
    onClick?: () => void;
    onComplete?: () => void;
}

// Configuration for each waypoint type
const WAYPOINT_CONFIG: Record<WaypointType, {
    icon: string;
    glowColor: string;
    baseColor: string;
    description: string;
}> = {
    asteroid: {
        icon: '🪨',
        glowColor: 'rgba(156, 163, 175, 0.5)',
        baseColor: '#6b7280',
        description: 'Quick task',
    },
    moon: {
        icon: '🌙',
        glowColor: 'rgba(203, 213, 225, 0.6)',
        baseColor: '#94a3b8',
        description: 'Standard task',
    },
    nebula: {
        icon: '🌌',
        glowColor: 'rgba(168, 85, 247, 0.5)',
        baseColor: '#a855f7',
        description: 'Complex task',
    },
    comet: {
        icon: '☄️',
        glowColor: 'rgba(59, 130, 246, 0.6)',
        baseColor: '#3b82f6',
        description: 'Recurring task',
    },
    meteor: {
        icon: '🔥',
        glowColor: 'rgba(239, 68, 68, 0.7)',
        baseColor: '#ef4444',
        description: 'Urgent task',
    },
};

// Size configurations
const SIZE_CONFIG = {
    sm: { container: 32, icon: 14, ring: 3 },
    md: { container: 44, icon: 18, ring: 4 },
    lg: { container: 60, icon: 24, ring: 5 },
};

export const WaypointMarker: React.FC<WaypointMarkerProps> = ({
    title,
    type,
    status,
    size = 'md',
    isUrgent = false,
    onClick,
    onComplete,
}) => {
    const config = WAYPOINT_CONFIG[isUrgent ? 'meteor' : type];
    const sizeConfig = SIZE_CONFIG[size];

    // Status-based styling
    const getStatusStyles = () => {
        switch (status) {
            case 'locked':
                return {
                    opacity: 0.4,
                    filter: 'grayscale(80%)',
                    cursor: 'not-allowed',
                };
            case 'available':
                return {
                    opacity: 1,
                    filter: 'none',
                    cursor: 'pointer',
                };
            case 'inProgress':
                return {
                    opacity: 1,
                    filter: 'none',
                    cursor: 'pointer',
                };
            case 'completed':
                return {
                    opacity: 0.8,
                    filter: 'none',
                    cursor: 'default',
                };
            default:
                return {};
        }
    };

    const statusStyles = getStatusStyles();

    // Animation variants
    const pulseVariants = {
        available: {
            scale: [1, 1.1, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            },
        },
        inProgress: {
            rotate: 360,
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear' as const,
            },
        },
    };

    const completionBurst = {
        initial: { scale: 1, opacity: 1 },
        completed: {
            scale: [1, 1.5, 1],
            opacity: [1, 0.8, 1],
            transition: { duration: 0.6 },
        },
    };

    const handleClick = () => {
        if (status === 'locked') return;
        onClick?.();
    };

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status !== 'inProgress' && status !== 'available') return;
        onComplete?.();
    };

    return (
        <motion.div
            className="relative group"
            style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                ...statusStyles,
            }}
            onClick={handleClick}
            whileHover={status !== 'locked' ? { scale: 1.15 } : undefined}
            whileTap={status !== 'locked' ? { scale: 0.95 } : undefined}
            role="button"
            aria-label={`${title} - ${config.description} - ${status}`}
            tabIndex={status !== 'locked' ? 0 : -1}
        >
            {/* Outer glow */}
            <motion.div
                className="absolute inset-0 rounded-full blur-md"
                style={{
                    background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                }}
                animate={status === 'available' ? pulseVariants.available : undefined}
            />

            {/* Progress ring for in-progress status */}
            {status === 'inProgress' && (
                <motion.div
                    className="absolute inset-0"
                    animate={pulseVariants.inProgress}
                >
                    <svg
                        width={sizeConfig.container}
                        height={sizeConfig.container}
                        className="absolute inset-0"
                    >
                        <circle
                            cx={sizeConfig.container / 2}
                            cy={sizeConfig.container / 2}
                            r={sizeConfig.container / 2 - sizeConfig.ring}
                            fill="none"
                            stroke={config.baseColor}
                            strokeWidth={sizeConfig.ring}
                            strokeDasharray="8 4"
                            opacity={0.6}
                        />
                    </svg>
                </motion.div>
            )}

            {/* Main marker body */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-full"
                style={{
                    background: status === 'completed'
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : `linear-gradient(135deg, ${config.baseColor}33 0%, ${config.baseColor}66 100%)`,
                    border: `2px solid ${status === 'completed' ? '#fbbf24' : config.baseColor}`,
                    boxShadow: `0 0 ${sizeConfig.ring * 3}px ${config.glowColor}`,
                }}
                variants={completionBurst}
                animate={status === 'completed' ? 'completed' : 'initial'}
            >
                <span
                    style={{ fontSize: sizeConfig.icon }}
                    className="select-none"
                >
                    {status === 'completed' ? '✦' : config.icon}
                </span>
            </motion.div>

            {/* Completion checkmark overlay for available/inProgress */}
            {(status === 'available' || status === 'inProgress') && (
                <motion.button
                    className="absolute -right-1 -top-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={handleComplete}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Mark as complete"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M2 6L5 9L10 3" />
                    </svg>
                </motion.button>
            )}

            {/* Tooltip on hover */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                    {title}
                </div>
            </div>

            {/* Stardust particles on completion */}
            {status === 'completed' && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                                x: Math.cos((i * 60 * Math.PI) / 180) * 30,
                                y: Math.sin((i * 60 * Math.PI) / 180) * 30,
                                opacity: 0,
                            }}
                            transition={{
                                duration: 0.8,
                                ease: 'easeOut',
                                delay: i * 0.05,
                            }}
                        />
                    ))}
                </motion.div>
            )}

            {/* Urgent indicator */}
            {isUrgent && status !== 'completed' && (
                <motion.div
                    className="absolute -left-1 -top-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </motion.div>
    );
};

export default WaypointMarker;
