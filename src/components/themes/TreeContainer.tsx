import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ThemeContainerProps } from './types';


export const TreeContainer: React.FC<ThemeContainerProps> = ({ children, className }) => {
    // const { currentTheme } = useTheme(); // Removed unused hook
    // const { colors } = currentTheme;

    return (
        <motion.div
            className={cn(
                "relative z-20 transition-all duration-500 mx-auto",
                className
            )}
            style={{
                width: 'min(90vw, 550px)',
                minHeight: 'min(90vw, 550px)',
                // Organic Seed Shape (Teardrop/Egg)
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',

                // Deep Wood/Amber Base
                backgroundColor: '#451a03',
                backgroundImage: `
                    radial-gradient(circle at 35% 25%, 
                        rgba(245, 158, 11, 0.8) 0%,    /* Highlight (Amber 500) */
                        rgba(180, 83, 9, 0.6) 20%,     /* Haze (Amber 700) */
                        transparent 50%
                    ),
                    radial-gradient(circle at center, 
                        #78350f 0%,    /* Mid (Amber 900) */
                        #451a03 100%   /* Deep Shadow */
                    )
                `,

                // Glossy Hard Shell Feel
                boxShadow: `
                    inset 10px 10px 20px rgba(255,255,255,0.2), /* Specular Top-Left */
                    inset -10px -20px 40px rgba(0,0,0,0.8), /* Deep Bottom-Right Shadow */
                    0 20px 40px rgba(0,0,0,0.6), /* Drop Shadow */
                    0 0 60px rgba(16, 185, 129, 0.15) /* Subtle Life Glow (Emerald) */
                `,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            animate={{
                y: [0, -6, 0],
                rotate: [0, 1, -1, 0]
            }}
            transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* Seed Texture Overlay */}
            <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
                {/* Wood Grain / Shell Texture */}
                <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
                    <filter id="woodGrain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#woodGrain)" opacity="0.6" />
                </svg>

                {/* Life Pulse Center - Inner Embryo Glow */}
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
            </div>

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-12">
                {children}
            </div>
        </motion.div>
    );
};
