import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SpaceBackgroundProps {
    className?: string;
}

// Detect if we're on a mobile device or low-power mode
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ className = '' }) => {
    const { currentTheme } = useTheme();
    const { colors, particles } = currentTheme;

    // Reduce particle count on mobile for better performance
    const particleCount = isMobile ? Math.min(particles.count, 25) : Math.min(particles.count, 40);

    // Pre-calculate star positions (memoized to prevent recalculation)
    const stars = useMemo(() => {
        const small = Array.from({ length: particleCount }, (_, i) => ({
            id: `small-${i}`,
            left: (i * 13) % 100,
            top: (i * 17) % 100,
            delay: (i % 5) * 0.5,
            duration: 2 + (i % 3),
        }));

        const medium = Array.from({ length: Math.floor(particleCount * 0.4) }, (_, i) => ({
            id: `med-${i}`,
            left: (i * 29) % 100,
            top: (i * 23) % 100,
            delay: (i % 6) * 0.7,
            duration: 3 + (i % 4),
        }));

        const large = Array.from({ length: Math.floor(particleCount * 0.15) }, (_, i) => ({
            id: `large-${i}`,
            left: (i * 37) % 100,
            top: (i * 41) % 100,
            delay: (i % 4) * 0.8,
            duration: 4 + (i % 3),
        }));

        return { small, medium, large };
    }, [particleCount]);

    return (
        <div
            className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
            style={{ backgroundColor: colors.background }}
        >
            {/* CSS Keyframes - injected once */}
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes twinkle-bright {
                    0%, 100% { opacity: 0.5; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.3); }
                }
                .star {
                    animation: twinkle var(--duration) ease-in-out infinite;
                    animation-delay: var(--delay);
                    will-change: opacity, transform;
                }
                .star-bright {
                    animation: twinkle-bright var(--duration) ease-in-out infinite;
                    animation-delay: var(--delay);
                    will-change: opacity, transform;
                }
                ${prefersReducedMotion ? '.star, .star-bright { animation: none; opacity: 0.7; }' : ''}
            `}</style>

            {/* Small twinkling stars - CSS animated */}
            {stars.small.map((star) => (
                <div
                    key={star.id}
                    className="absolute rounded-full star"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${particles.sizes[0]}px`,
                        height: `${particles.sizes[0]}px`,
                        backgroundColor: particles.color,
                        '--duration': `${star.duration}s`,
                        '--delay': `${star.delay}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Medium bright stars */}
            {stars.medium.map((star) => (
                <div
                    key={star.id}
                    className="absolute rounded-full star-bright"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${particles.sizes[1]}px`,
                        height: `${particles.sizes[1]}px`,
                        backgroundColor: particles.color,
                        boxShadow: `0 0 6px 2px ${particles.glowColor}`,
                        '--duration': `${star.duration}s`,
                        '--delay': `${star.delay}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Large bright stars with glow */}
            {stars.large.map((star) => (
                <div
                    key={star.id}
                    className="absolute rounded-full star-bright"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${particles.sizes[2]}px`,
                        height: `${particles.sizes[2]}px`,
                        backgroundColor: particles.color,
                        boxShadow: `0 0 12px 4px ${particles.glowColor}, 0 0 24px 8px ${colors.glow}`,
                        '--duration': `${star.duration}s`,
                        '--delay': `${star.delay}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Nebula gradients - reduced blur for better performance */}
            <div
                className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[80px] opacity-35"
                style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
            />
            <div
                className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[60px] opacity-30"
                style={{ background: `radial-gradient(circle, ${colors.accent}60 0%, transparent 70%)` }}
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
                style={{ background: `radial-gradient(circle, ${colors.secondary}40 0%, transparent 70%)` }}
            />
        </div>
    );
};
