import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ThemeContainerProps } from './types';
import { useTheme } from '@/contexts/ThemeContext';

export const TreeContainer: React.FC<ThemeContainerProps> = ({ children, isFocused, className }) => {
    const { currentTheme } = useTheme();
    const { colors } = currentTheme;

    return (
        <motion.div
            className={cn(
                "relative z-20 transition-all duration-500 mx-auto",
                isFocused ? "drop-shadow-[0_10px_30px_rgba(20,184,166,0.4)]" : "", // emerald shadow
                className
            )}
            style={{
                width: '500px',
                minHeight: '500px',
                backgroundColor: '#451a03',
                // Photorealistic 3D Seed Surface:
                backgroundImage: `
                    radial-gradient(circle at 30% 30%, 
                        #d97706 0%,    /* Highlight (Amber 600) */
                        #b45309 30%,   /* Mid (Amber 700) */
                        #78350f 70%,   /* Shadow (Amber 900) */
                        #451a03 100%   /* Deep Shadow */
                    )
                `,
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', // Organic seed shape
                border: `1px solid ${colors.primary}`,
                // Organic Gloss & Depth
                boxShadow: `
                    inset 10px 10px 30px rgba(255,255,255,0.15), /* Specular Highlight */
                    inset -10px -10px 40px rgba(0,0,0,0.6), /* Deep Shadow */
                    0 15px 40px rgba(0,0,0,0.5), /* Drop Shadow */
                    0 0 30px ${colors.primary}33 /* Life Glow */
                `,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            animate={{
                y: [0, -5, 0],
                rotate: [0, 1, -1, 0]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* Organic Seed/Pod CSS Background */}
            <div
                className="absolute inset-0 rounded-[3rem] overflow-hidden"
                style={{
                    border: `2px solid ${colors.primary}`,
                    backgroundColor: '#451a03', // Dark amber/brown base
                    zIndex: 0
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#d97706] via-[#92400e] to-[#451a03]" />

                {/* Texture Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay pointer-events-none">
                    <filter id="seedTexture2" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                        <feComposite in="noise" in2="SourceGraphic" operator="in" />
                        <feBlend in="SourceGraphic" mode="multiply" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#seedTexture2)" />
                </svg>

                {/* Life Pulse Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            </div>

            {/* Background Glow */}
            <div className="absolute -inset-10 -z-10 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-60 blur-2xl" />

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-8 md:p-10">
                {children}
            </div>
        </motion.div>
    );
};
