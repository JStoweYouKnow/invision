import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VoyageStatus, Waypoint } from '@/types';
import { WaypointMarker } from './WaypointMarker';

interface VoyageTrajectoryProps {
    id: string;
    origin: { x: number; y: number };
    destination: { x: number; y: number };
    status: VoyageStatus;
    progress: number; // 0-100
    waypoints: Waypoint[];
    showLabels?: boolean;
    onWaypointClick?: (waypoint: Waypoint) => void;
    onWaypointComplete?: (waypoint: Waypoint) => void;
}

// Status-based styling configuration
const STATUS_CONFIG: Record<VoyageStatus, {
    strokeColor: string;
    strokeDasharray: string;
    glowColor: string;
    strokeWidth: number;
}> = {
    planning: {
        strokeColor: 'rgba(156, 163, 175, 0.5)',
        strokeDasharray: '8 8',
        glowColor: 'rgba(156, 163, 175, 0.2)',
        strokeWidth: 2,
    },
    launched: {
        strokeColor: 'rgba(168, 85, 247, 0.8)',
        strokeDasharray: 'none',
        glowColor: 'rgba(168, 85, 247, 0.4)',
        strokeWidth: 3,
    },
    cruising: {
        strokeColor: 'rgba(59, 130, 246, 0.8)',
        strokeDasharray: 'none',
        glowColor: 'rgba(59, 130, 246, 0.4)',
        strokeWidth: 3,
    },
    approaching: {
        strokeColor: 'rgba(251, 191, 36, 0.9)',
        strokeDasharray: 'none',
        glowColor: 'rgba(251, 191, 36, 0.5)',
        strokeWidth: 4,
    },
    landed: {
        strokeColor: 'rgba(34, 197, 94, 0.8)',
        strokeDasharray: 'none',
        glowColor: 'rgba(34, 197, 94, 0.3)',
        strokeWidth: 3,
    },
};

// Calculate point on a curved path (quadratic bezier)
const getPointOnCurve = (
    t: number,
    start: { x: number; y: number },
    control: { x: number; y: number },
    end: { x: number; y: number }
) => {
    const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * control.x + Math.pow(t, 2) * end.x;
    const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * control.y + Math.pow(t, 2) * end.y;
    return { x, y };
};

export const VoyageTrajectory: React.FC<VoyageTrajectoryProps> = ({
    id,
    origin,
    destination,
    status,
    progress,
    waypoints,
    showLabels = true,
    onWaypointClick,
    onWaypointComplete,
}) => {
    const config = STATUS_CONFIG[status];

    // Calculate control point for curved path (perpendicular offset)
    const controlPoint = useMemo(() => {
        const midX = (origin.x + destination.x) / 2;
        const midY = (origin.y + destination.y) / 2;
        const dx = destination.x - origin.x;
        const dy = destination.y - origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Offset perpendicular to the line, scaled by distance
        const offsetAmount = distance * 0.2;
        return {
            x: midX - (dy / distance) * offsetAmount,
            y: midY + (dx / distance) * offsetAmount,
        };
    }, [origin, destination]);

    // Generate SVG path
    const pathD = useMemo(() => {
        return `M ${origin.x} ${origin.y} Q ${controlPoint.x} ${controlPoint.y} ${destination.x} ${destination.y}`;
    }, [origin, destination, controlPoint]);

    // Ship position along the path based on progress
    const shipPosition = useMemo(() => {
        const t = progress / 100;
        return getPointOnCurve(t, origin, controlPoint, destination);
    }, [progress, origin, controlPoint, destination]);

    // Waypoint positions along the curve
    const waypointPositions = useMemo(() => {
        return waypoints.map((wp) => {
            const t = wp.position / 100;
            const pos = getPointOnCurve(t, origin, controlPoint, destination);
            return { ...wp, pos };
        });
    }, [waypoints, origin, controlPoint, destination]);

    return (
        <g className="voyage-trajectory" data-voyage-id={id}>
            {/* Glow effect for the path */}
            <defs>
                <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={config.glowColor} />
                    <stop offset={`${progress}%`} stopColor={config.strokeColor} />
                    <stop offset={`${progress}%`} stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
            </defs>

            {/* Background path (full trajectory) */}
            <path
                d={pathD}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={config.strokeWidth}
                strokeDasharray={config.strokeDasharray}
                strokeLinecap="round"
            />

            {/* Completed portion glow */}
            <motion.path
                d={pathD}
                fill="none"
                stroke={config.glowColor}
                strokeWidth={config.strokeWidth + 4}
                strokeLinecap="round"
                filter={`url(#glow-${id})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Completed portion main stroke */}
            <motion.path
                d={pathD}
                fill="none"
                stroke={config.strokeColor}
                strokeWidth={config.strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Stardust trail (completed portion particles) */}
            {status !== 'planning' && progress > 0 && (
                <g className="stardust-trail">
                    {[...Array(Math.floor(progress / 10))].map((_, i) => {
                        const t = (i * 10) / 100;
                        const pos = getPointOnCurve(t, origin, controlPoint, destination);
                        return (
                            <motion.circle
                                key={i}
                                cx={pos.x}
                                cy={pos.y}
                                r={1.5}
                                fill="#fef08a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                }}
                            />
                        );
                    })}
                </g>
            )}

            {/* Waypoints */}
            {waypointPositions.map((wp) => (
                <foreignObject
                    key={wp.id}
                    x={wp.pos.x - 22}
                    y={wp.pos.y - 22}
                    width={44}
                    height={44}
                    overflow="visible"
                >
                    <WaypointMarker
                        id={wp.id}
                        title={wp.title}
                        type={wp.type}
                        status={wp.status}
                        size="md"
                        isUrgent={wp.isUrgent}
                        onClick={() => onWaypointClick?.(wp)}
                        onComplete={() => onWaypointComplete?.(wp)}
                    />
                </foreignObject>
            ))}

            {/* Ship indicator (current position) */}
            {status !== 'planning' && status !== 'landed' && (
                <motion.g
                    initial={{ x: origin.x, y: origin.y }}
                    animate={{ x: shipPosition.x, y: shipPosition.y }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {/* Ship glow */}
                    <motion.circle
                        cx={0}
                        cy={0}
                        r={12}
                        fill="url(#ship-glow)"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 0.8, 0.6],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <defs>
                        <radialGradient id="ship-glow">
                            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
                            <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                        </radialGradient>
                    </defs>
                    {/* Ship icon */}
                    <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fontSize={16}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                    >
                        🚀
                    </text>
                </motion.g>
            )}

            {/* Origin marker */}
            <circle
                cx={origin.x}
                cy={origin.y}
                r={6}
                fill="rgba(168, 85, 247, 0.5)"
                stroke="rgba(168, 85, 247, 0.8)"
                strokeWidth={2}
            />

            {/* Destination marker glow (pulsing when approaching) */}
            {status === 'approaching' && (
                <motion.circle
                    cx={destination.x}
                    cy={destination.y}
                    r={25}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.5)"
                    strokeWidth={2}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Labels */}
            {showLabels && (
                <>
                    <text
                        x={origin.x}
                        y={origin.y + 20}
                        textAnchor="middle"
                        fill="rgba(255, 255, 255, 0.6)"
                        fontSize={10}
                        fontFamily="Inter, sans-serif"
                    >
                        Origin
                    </text>
                    <text
                        x={destination.x}
                        y={destination.y + 30}
                        textAnchor="middle"
                        fill="rgba(255, 255, 255, 0.8)"
                        fontSize={12}
                        fontFamily="Outfit, sans-serif"
                        fontWeight={600}
                    >
                        🎯 Destination
                    </text>
                    {/* Progress label */}
                    <text
                        x={shipPosition.x}
                        y={shipPosition.y - 20}
                        textAnchor="middle"
                        fill="rgba(255, 255, 255, 0.9)"
                        fontSize={11}
                        fontFamily="Inter, sans-serif"
                    >
                        {progress}% complete
                    </text>
                </>
            )}
        </g>
    );
};

export default VoyageTrajectory;
