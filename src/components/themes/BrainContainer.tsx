import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ThemeContainerProps } from './types';


export const BrainContainer: React.FC<ThemeContainerProps> = ({ children, className }) => {
    return (
        <motion.div
            className={cn(
                "relative z-20 transition-all duration-500 mx-auto",
                className
            )}
            style={{
                minHeight: 'min(90vw, 550px)',
                width: 'min(90vw, 550px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                // Organic "Neuron" shape
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                // Deep, dark bio-luminescent base
                background: `
                    radial-gradient(circle at 35% 35%, 
                        rgba(255, 255, 255, 0.9) 0%, 
                        rgba(200, 200, 255, 0.2) 5%, 
                        transparent 20%
                    ),
                    radial-gradient(circle at 65% 65%, 
                        rgba(60, 20, 100, 0.6) 0%, 
                        transparent 60%
                    ),
                    radial-gradient(circle at center, 
                        #2e1065 0%,    /* Core (Violet 950) */
                        #1e1b4b 60%,   /* Mid (Indigo 950) */
                        #020617 100%   /* Void (Slate 950) */
                    )
                `,
                // "Wet" Membrane Look - Sharp highlights + Deep shadows
                boxShadow: `
                    inset 5px 5px 20px rgba(255, 255, 255, 0.3), /* Specular Shine */
                    inset -10px -10px 40px rgba(0, 0, 0, 0.8),   /* Deep Inner Shadow */
                    0 0 30px rgba(139, 92, 246, 0.3),            /* Outer Glow */
                    0 20px 50px rgba(0,0,0,0.9)                  /* Drop Shadow */
                `,
            }}
            animate={{
                // Breathing animation
                borderRadius: [
                    '60% 40% 30% 70% / 60% 30% 70% 40%',
                    '50% 50% 50% 50% / 50% 50% 50% 50%',
                    '70% 30% 50% 50% / 30% 70% 60% 40%',
                    '60% 40% 30% 70% / 60% 30% 70% 40%'
                ],
                scale: [1, 1.02, 1],
            }}
            transition={{
                duration: 12, // Slower, more organic
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* Cytoplasm Texture - Fractal Noise for Organic Tissue Look */}
            <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none opacity-40 mix-blend-overlay">
                <svg className="w-full h-full">
                    <filter id="cytoplasmNoise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                    </filter>
                    <rect width="100%" height="100%" filter="url(#cytoplasmNoise)" />
                </svg>
            </div>

            {/* Internal Organelles / Depth Layers */}
            <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
                {/* Deep background drift */}
                <motion.div
                    className="absolute inset-[-50%] bg-gradient-to-br from-indigo-900/20 to-purple-900/20 blur-3xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                />

                {/* Synaptic Web (Dendrites) - Refined for realism */}
                <svg className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <pattern id="dendrites" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                            <path d="M10 10 Q 60 60 110 10 T 210 60" fill="none" stroke="rgba(167, 139, 250, 0.2)" strokeWidth="0.8" />
                            <path d="M0 60 Q 60 10 120 60 T 210 10" fill="none" stroke="rgba(100, 200, 255, 0.15)" strokeWidth="0.8" />
                            <circle cx="60" cy="60" r="1" fill="rgba(255, 255, 255, 0.8)" filter="url(#glow)" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dendrites)" />
                </svg>
            </div>

            {/* Bio-luminescent Nodes (Glowing Nuclei) */}
            <motion.div
                className="absolute top-[30%] left-[30%] w-3 h-3 bg-cyan-400 rounded-full blur-[3px]"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[35%] right-[25%] w-4 h-4 bg-fuchsia-500 rounded-full blur-[4px]"
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
                className="absolute top-[60%] right-[35%] w-2 h-2 bg-amber-300 rounded-full blur-[2px]"
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* Specular Highlight Overlay (Glass/Wet Effect) */}
            <div className="absolute top-[10%] left-[15%] w-[40%] h-[20%] bg-gradient-to-br from-white/20 to-transparent rounded-[100%] blur-xl transform -rotate-12 pointer-events-none mix-blend-overlay" />

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-12">
                {/* Text legibility backdrop - slight blur for depth */}
                <div className="absolute inset-0 bg-black/30 blur-xl -z-10 rounded-[40%]" />
                {children}
            </div>
        </motion.div>
    );
};
