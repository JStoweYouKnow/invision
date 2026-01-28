import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const Fireworks: React.FC<{ show: boolean }> = ({ show }) => {
    // Pre-generate stable particle data
    const particleData = useMemo(() => {
        const colors = ['#818cf8', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#f472b6', '#34d399'];

        const fireworkBursts = [
            { x: '25%', y: '40%', delay: 0 },
            { x: '75%', y: '35%', delay: 0.3 },
            { x: '50%', y: '30%', delay: 0.6 },
        ];

        return fireworkBursts.map((burst, burstIndex) => ({
            ...burst,
            particles: Array.from({ length: 24 }, (_, i) => {
                const angle = (i / 24) * 360;
                const distance = 80 + ((i * 17) % 120);
                const radians = (angle * Math.PI) / 180;
                return {
                    id: i,
                    endX: Math.cos(radians) * distance,
                    endY: Math.sin(radians) * distance,
                    color: colors[(i + burstIndex) % colors.length],
                };
            }),
            sparks: Array.from({ length: 12 }, (_, i) => {
                const angle = (i / 12) * 360 + (i * 7) % 30;
                const distance = 40 + ((i * 13) % 60);
                const radians = (angle * Math.PI) / 180;
                return {
                    id: i,
                    endX: Math.cos(radians) * distance,
                    endY: Math.sin(radians) * distance,
                };
            }),
        }));
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {particleData.map((burst, burstIndex) => (
                <div key={burstIndex} className="absolute" style={{ left: burst.x, top: burst.y }}>
                    {/* Central flash */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                        transition={{ duration: 0.4, delay: burst.delay }}
                        className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                        style={{ boxShadow: '0 0 40px 20px rgba(255,255,255,0.8)' }}
                    />

                    {/* Exploding particles */}
                    {burst.particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                x: [0, particle.endX * 0.3, particle.endX],
                                y: [0, particle.endY * 0.3, particle.endY + 50],
                                scale: [0.5, 1, 0.3],
                            }}
                            transition={{
                                duration: 1.2,
                                delay: burst.delay + 0.1,
                                ease: "easeOut",
                            }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: particle.color,
                                boxShadow: `0 0 6px 2px ${particle.color}`,
                            }}
                        />
                    ))}

                    {/* Trailing sparks */}
                    {burst.sparks.map((spark) => (
                        <motion.div
                            key={`spark-${spark.id}`}
                            initial={{ opacity: 0, x: 0, y: 0 }}
                            animate={{
                                opacity: [0, 1, 0],
                                x: [0, spark.endX],
                                y: [0, spark.endY + 30],
                            }}
                            transition={{
                                duration: 0.8,
                                delay: burst.delay + 0.2,
                                ease: "easeOut",
                            }}
                            className="absolute w-1 h-1 rounded-full bg-yellow-300"
                            style={{ boxShadow: '0 0 4px 1px #fde047' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};
