import React from 'react';
import { motion } from 'framer-motion';

export type CelestialType = 'planet' | 'moon' | 'icePlanet' | 'star' | 'blackHole';

interface CelestialBodyProps {
    size: number;
    index?: number;
    seed?: string;
    type?: CelestialType;
}

// Map celestial types to their images and glow colors
// Map celestial types to their images and glow colors
const CELESTIAL_CONFIG: Record<CelestialType, { image: string; glow: string; rotationDuration: number; animationType: 'wobble' | 'spin' }> = {
    planet: {
        image: '/images/celestial/planet.png',
        glow: 'rgba(124, 58, 237, 0.5)',
        rotationDuration: 8, // seconds for one wobble cycle
        animationType: 'wobble',
    },
    moon: {
        image: '/images/celestial/moon.png',
        glow: 'rgba(156, 163, 175, 0.4)',
        rotationDuration: 10,
        animationType: 'wobble',
    },

    icePlanet: {
        image: '/images/celestial/ice-planet.png',
        glow: 'rgba(103, 232, 249, 0.6)',
        rotationDuration: 9,
        animationType: 'wobble',
    },
    star: {
        image: '/images/celestial/star.png',
        glow: 'rgba(254, 240, 138, 0.8)',
        rotationDuration: 12,
        animationType: 'spin',
    },
    blackHole: {
        image: '/images/celestial/black-hole.png',
        glow: 'rgba(147, 51, 234, 0.8)', // Deep purple glow
        rotationDuration: 20, // Slower, majestic spin
        animationType: 'spin',
    },
};

const getCelestialType = (index: number): CelestialType => {
    const types: CelestialType[] = ['planet', 'moon', 'icePlanet', 'star'];
    return types[index % types.length];
};

export const CelestialBody: React.FC<CelestialBodyProps> = ({ size, index = 0, type: explicitType }) => {
    const type = explicitType || getCelestialType(index);
    const config = CELESTIAL_CONFIG[type];

    // Vary the wobble amount slightly based on index for variety
    const wobbleAmount = 15 + (index % 3) * 5; // 15-25 degrees side to side

    // Randomize starting phase offset based on index
    const phaseOffset = (index * 1.5); // Offset animation timing for variety

    // Generate a consistent hue rotation based on the index to ensure every body looks distinct
    // We use a large prime multiplier to scatter the colors around the spectrum
    const hueRotate = (index * 137) % 360;

    const animations = {
        wobble: {
            rotateY: [-wobbleAmount, wobbleAmount, -wobbleAmount],
            scale: [1.2, 1.2, 1.2], // Scaled up to prevent gaps during rotation
        },
        spin: {
            rotate: [0, 360],
            scale: [1.2, 1.2, 1.2], // Consistent scale with wobble
        }
    };

    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: size,
                height: size,
                perspective: '600px',
                perspectiveOrigin: 'center',
                filter: `hue-rotate(${hueRotate}deg)`,
            }}
        >
            {/* Outer glow effect */}
            <div
                className="absolute inset-0 rounded-full blur-md pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
                    transform: 'scale(1)', // Reverted scale since ringed planet is removed
                }}
            />

            {/* Main celestial body */}
            <motion.div
                className="relative w-full h-full rounded-full overflow-hidden"
                style={{
                    boxShadow: `
                        0 0 ${size * 0.3}px ${size * 0.1}px ${config.glow},
                        0 0 ${size * 0.5}px ${size * 0.2}px ${config.glow.replace('0.', '0.3')}
                    `,
                    transformStyle: 'preserve-3d',
                }}
                animate={animations[config.animationType]}
                transition={{
                    duration: config.rotationDuration,
                    ease: config.animationType === 'spin' ? 'linear' : 'easeInOut',
                    repeat: Infinity,
                    delay: phaseOffset,
                }}
            >
                <img
                    src={config.image}
                    alt={type}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scale(1.15)' }} // Extra safety scale for the image itself
                />

                {/* Subtle lighting overlay to enhance 3D effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                    }}
                />
            </motion.div>

            {/* Additional pulse glow for stars */}
            {type === 'star' && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${config.glow} 0%, transparent 60%)`,
                    }}
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1.3, 1.5, 1.3],
                    }}
                    transition={{
                        duration: 3,
                        ease: 'easeInOut',
                        repeat: Infinity,
                    }}
                />
            )}
        </div>
    );
};

export default CelestialBody;
