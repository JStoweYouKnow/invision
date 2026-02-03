import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'default' | 'circular' | 'text' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'shimmer' | 'pulse' | 'none';
}

/**
 * Base Skeleton component with cosmic-themed loading animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'default',
    width,
    height,
    animation = 'shimmer',
}) => {
    const baseClasses = 'bg-white/5 rounded-lg overflow-hidden';

    const variantClasses = {
        default: 'rounded-lg',
        circular: 'rounded-full',
        text: 'rounded h-4',
        rectangular: 'rounded-none',
    };

    const animationClasses = {
        shimmer: 'skeleton-shimmer',
        pulse: 'animate-pulse',
        none: '',
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
            aria-hidden="true"
            role="presentation"
        />
    );
};

/**
 * Skeleton text line with random width variation
 */
export const SkeletonText: React.FC<{
    lines?: number;
    className?: string;
    lastLineWidth?: string;
}> = ({ lines = 1, className = '', lastLineWidth = '60%' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    height={16}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
};

/**
 * Skeleton card for dashboard goal cards
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`glass-card rounded-3xl p-6 ${className}`}
        >
            {/* Image placeholder */}
            <Skeleton
                variant="rectangular"
                className="rounded-2xl mb-4"
                height={160}
                width="100%"
            />

            {/* Title */}
            <Skeleton height={24} width="80%" className="mb-3" />

            {/* Description lines */}
            <SkeletonText lines={2} className="mb-4" />

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <Skeleton height={8} className="flex-1 rounded-full" />
                <Skeleton variant="circular" width={32} height={32} />
            </div>
        </motion.div>
    );
};

/**
 * Skeleton for plan viewer / vision board
 */
export const SkeletonPlanViewer: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Vision Image */}
            <div className="relative">
                <Skeleton
                    className="w-full rounded-3xl"
                    height={400}
                />
                {/* Floating title skeleton */}
                <div className="absolute bottom-6 left-6 right-6">
                    <Skeleton height={48} width="60%" className="mb-3" />
                    <SkeletonText lines={2} lastLineWidth="80%" />
                </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-center gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="circular" width={48} height={48} />
                ))}
            </div>

            {/* Timeline milestones */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <Skeleton variant="circular" width={40} height={40} />
                            <div className="flex-1">
                                <Skeleton height={24} width="50%" className="mb-2" />
                                <SkeletonText lines={3} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

/**
 * Dashboard skeleton with multiple cards
 */
export const SkeletonDashboard: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="text-center space-y-4">
                <Skeleton height={48} width={300} className="mx-auto" />
                <Skeleton height={24} width={200} className="mx-auto" />
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass p-4 rounded-2xl text-center">
                        <Skeleton height={32} width={48} className="mx-auto mb-2" />
                        <Skeleton height={16} width={80} className="mx-auto" />
                    </div>
                ))}
            </div>

            {/* Goal cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </motion.div>
    );
};

export default Skeleton;
