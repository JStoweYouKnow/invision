import React, { useState } from 'react';
// import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { SavedGoal } from '@/lib/firestore';
import { Scene3D } from './Scene3D';
import { useTheme } from '@/contexts/ThemeContext';

interface CosmosMap3DProps {
    goals: SavedGoal[];
    className?: string;
}

/**
 * 3D Cosmos Map - True 3D interactive visualization
 * Powered by React Three Fiber
 */
export const CosmosMap3D: React.FC<CosmosMap3DProps> = ({
    goals,
    className = '',
}) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleGoalSelect = (goalId: string) => {
        navigate(`/plan/${goalId}`);
    };

    return (
        <div
            className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'} rounded-3xl overflow-hidden ${className} transition-all duration-500 ease-in-out border border-white/10 shadow-2xl`}
            style={{
                // Fallback gradient while 3D loads or behind transparent canvas
                background: currentTheme.id === 'brain'
                    ? 'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)'
                    : currentTheme.id === 'tree'
                        ? 'radial-gradient(circle at center, #14532d 0%, #020617 100%)'
                        : 'radial-gradient(circle at center, #1e1b4b 0%, #000000 100%)',
            }}
        >
            <Scene3D goals={goals} onGoalSelect={handleGoalSelect} />

            {/* Overlay UI Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Legend / Instructions */}
            <div className="absolute bottom-6 left-6 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl">
                    <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                        {currentTheme.id === 'brain' ? '🧠 Neural Network' : currentTheme.id === 'tree' ? '🌱 Growth Forest' : '🌌 Solar System'}
                    </h3>
                    <p className="text-white/60 text-xs">
                        Drag to rotate • Scroll to zoom • Click to visit
                    </p>
                </div>
            </div>

            {/* Goal Count Badge */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-white/80 text-xs font-bold tracking-wider">
                        {goals.length} VISIONS ACTIVE
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CosmosMap3D;
