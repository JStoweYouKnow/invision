import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ThemeContainerProps } from './types';
import { useTheme } from '@/contexts/ThemeContext';

export const BrainContainer: React.FC<ThemeContainerProps> = ({ children, isFocused, className }) => {
    const { currentTheme } = useTheme();
    const { colors } = currentTheme;

    return (
        <motion.div
            className={cn(
                "relative z-20 transition-all duration-500 mx-auto",
                isFocused ? "" : "",
                className
            )}
            style={{
                minHeight: '500px',
                width: '500px',
                backgroundColor: '#020205',
                // Photorealistic 3D Neural Core:
                background: `
                    radial-gradient(circle at center, 
                        #4c1d95 0%,    /* Core Glow (Violet 900) */
                        #2e1065 40%,   /* Mid (Violet 950) */
                        #0f0529 70%,   /* Deep (Dark Purple) */
                        #000000 100%   /* Void Edge */
                    )
                `,
                borderRadius: '50%', // Perfect Sphere
                border: '1px solid rgba(139, 92, 246, 0.3)', // Subtle violet rim
                // Electric Glow & Depth
                boxShadow: `
                    inset 0 0 60px rgba(139, 92, 246, 0.3), /* Inner Core Glow */
                    0 0 80px rgba(139, 92, 246, 0.25), /* Outer Atmosphere */
                    0 20px 50px rgba(0,0,0,0.8) /* Depth Shadow */
                `,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            animate={{
                scale: [1, 1.02, 1],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* Neural CSS Background for flexible shape */}
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-slate-900 border border-white/20">
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f0720 60%, #020205 100%)' }}
                />

                {/* Synaptic Field Pattern Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1" fill={colors.primary} fillOpacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Glowing Nodes around edges */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-sm opacity-50" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm opacity-50" />
            </div>

            {/* Electric Impulse Effects around the container */}
            <div
                className="absolute -inset-1 rounded-[3.1rem] opacity-20 blur-md -z-10 animate-pulse"
                style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent}, ${colors.primary})`
                }}
            />

            {/* Electric Impulse Effects around the container */}
            <div className="absolute -inset-8 -z-10 bg-gradient-radial from-brand-indigo/30 via-transparent to-transparent opacity-50 blur-xl animate-pulse" />

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-8 md:p-10">
                {children}
            </div>
        </motion.div>
    );
};
