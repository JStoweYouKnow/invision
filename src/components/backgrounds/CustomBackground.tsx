import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import type { CustomTheme } from '@/lib/themes';

interface CustomBackgroundProps {
    className?: string;
}

export const CustomBackground: React.FC<CustomBackgroundProps> = ({ className = '' }) => {
    const { currentTheme } = useTheme();
    const customTheme = currentTheme as CustomTheme;
    const { colors, particles } = currentTheme;

    return (
        <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
            style={{ backgroundColor: colors.background }}>

            {/* User's custom background image */}
            {customTheme.backgroundImage && (
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center opacity-60"
                    style={{
                        backgroundImage: `url(${customTheme.backgroundImage})`,
                    }}
                />
            )}

            {/* Dark overlay for readability */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    background: `linear-gradient(to bottom, ${colors.background}90 0%, ${colors.background}70 50%, ${colors.background}90 100%)`
                }}
            />

            {/* Particle overlay with custom colors */}
            {[...Array(particles.count)].map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${(i * 13) % 100}%`,
                        top: `${(i * 17) % 100}%`,
                        width: `${particles.sizes[i % 3]}px`,
                        height: `${particles.sizes[i % 3]}px`,
                        backgroundColor: particles.color,
                        boxShadow: `0 0 ${particles.sizes[i % 3] * 2}px ${particles.glowColor}`
                    }}
                    animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 3 + (i % 4),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (i % 6) * 0.4
                    }}
                />
            ))}

            {/* Glow effects with custom colors */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
                style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }} />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-25"
                style={{ background: `radial-gradient(circle, ${colors.accent}50 0%, transparent 70%)` }} />
        </div>
    );
};
