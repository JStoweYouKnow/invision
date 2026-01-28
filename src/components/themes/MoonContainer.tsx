import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ThemeContainerProps } from './types';

export const MoonContainer: React.FC<ThemeContainerProps> = ({ children, isFocused, className }) => {
    return (
        <motion.div
            className={cn(
                "relative z-20 transition-all duration-500 mx-auto",
                isFocused ? "filter drop-shadow-[0_0_80px_rgba(255,255,255,0.4)]" : "",
                className
            )}
            style={{
                minHeight: '400px',
                width: '400px', // Fixed width for sphere
                backgroundColor: '#d1d5db',
                // Photorealistic 3D Moon Surface with Craters:
                backgroundImage: `
                    /* Main shading (Light to Dark) */
                    radial-gradient(circle at 35% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%),
                    /* Crater 1 (Large, top right) */
                    radial-gradient(circle at 70% 20%, rgba(100,100,100,0.8) 0%, rgba(150,150,150,0) 15%),
                    /* Crater 2 (Medium, bottom left) */
                    radial-gradient(circle at 30% 70%, rgba(90,90,90,0.7) 0%, rgba(140,140,140,0) 10%),
                    /* Crater 3 (Small, center right) */
                    radial-gradient(circle at 80% 60%, rgba(110,110,110,0.6) 0%, rgba(160,160,160,0) 6%),
                    /* Texture Noise (Simulated via multiple small gradients) */
                    radial-gradient(circle at 50% 50%, #f3f4f6 0%, #9ca3af 100%)
                `,
                borderRadius: '50%', // Perfect Sphere
                // 3D Lighting & Atmosphere
                boxShadow: `
                    inset -30px -30px 80px rgba(0,0,0,1), /* Deep dark side shadow */
                    inset 10px 10px 40px rgba(255,255,255,0.9), /* Bright sunlit rim */
                    inset 40px 40px 80px rgba(255,255,255,0.1), /* Subtle surface fill */
                    0 0 60px rgba(200, 220, 255, 0.1), /* Atmospheric Glow */
                    0 30px 60px rgba(0,0,0,0.8) /* Deep Space Drop Shadow */
                `,
                border: 'none', // Border replaced by light rim shadow
                // Ensure it stacks correctly
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            animate={{
                y: [0, -8, 0],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* Overlays (Shadows/Craters) */}
            <div className="absolute inset-0 rounded-[50%] overflow-hidden pointer-events-none">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 100%, rgba(0,0,0,0.8), transparent 70%)', opacity: 0.6 }} />

                {/* Enhanced Texture Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-70 mix-blend-overlay pointer-events-none">
                    <filter id="moonTextureComplex" x="0%" y="0%" width="100%" height="100%">
                        {/* Micro-noise (Dust/Sand) */}
                        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="microNoise" />

                        {/* Macro-noise (Terrain/Mountains) */}
                        <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="5" seed="5" result="macroNoise" />
                        <feDisplacementMap in="macroNoise" in2="microNoise" scale="20" xChannelSelector="R" yChannelSelector="G" result="terrain" />

                        <feColorMatrix type="saturate" values="0" result="grayTerrain" />
                        <feComposite operator="in" in="grayTerrain" in2="SourceGraphic" result="finalTexture" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#moonTextureComplex)" opacity="0.8" />
                </svg>

                {/* Additional Crater Texture Layer */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        radial-gradient(1px 1px at 10% 10%, rgba(255,255,255,0.1) 100%, transparent),
                        radial-gradient(1px 1px at 20% 20%, rgba(0,0,0,0.1) 100%, transparent),
                        radial-gradient(2px 2px at 30% 30%, rgba(255,255,255,0.05) 100%, transparent),
                        radial-gradient(2px 2px at 40% 40%, rgba(0,0,0,0.05) 100%, transparent),
                        radial-gradient(circle at 60% 70%, rgba(0,0,0,0.2) 0%, transparent 10%)
                    `,
                    backgroundSize: '100% 100%',
                    opacity: 0.5,
                    filter: 'contrast(150%)'
                }} />
            </div>

            {/* Moonlight Glow Behind */}
            <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl -z-10" />
            <div className="absolute -inset-1 bg-white/10 rounded-full blur-lg -z-10" />

            {/* Content Area - Fits within card */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-8 md:p-10">
                {children}
            </div>
        </motion.div>
    );
};
