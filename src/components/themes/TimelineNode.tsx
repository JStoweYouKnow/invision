import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Zap, Sprout, Flower } from 'lucide-react'; // Using standard icons for now, can enhance with SVGs later
import { useTheme } from '@/contexts/ThemeContext';

interface TimelineNodeProps {
    status: 'completed' | 'active' | 'future';
    index: number;
    totalSteps: number;
    delay?: number;
}

export const TimelineNode: React.FC<TimelineNodeProps> = ({ status, index, totalSteps }) => {
    const { currentTheme } = useTheme();
    const { colors } = currentTheme;

    const isCompleted = status === 'completed';
    const isActive = status === 'active';

    // Space Theme (Default)
    if (currentTheme.id === 'space') {
        return (
            <div className={`p-1.5 bg-white border-2 rounded-full transition-all duration-500 ${isCompleted
                ? 'border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : isActive
                    ? 'border-brand-purple shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110'
                    : 'border-brand-indigo/20 group-hover:border-brand-pink/50 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                }`}>
                <div className={`w-4 h-4 rounded-full transition-colors duration-500 flex items-center justify-center ${isCompleted
                    ? 'bg-green-500'
                    : isActive
                        ? 'bg-brand-purple'
                        : 'bg-brand-indigo group-hover:bg-brand-pink'
                    }`}>
                    {isCompleted && <Check className="w-3 h-3 text-white" />}
                    {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
            </div>
        );
    }

    // Brain Theme
    if (currentTheme.id === 'brain') {
        return (
            <div className={`relative flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-125' : ''
                }`}>
                {/* Connection glow */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-brand-pink rounded-full blur-md"
                    />
                )}

                <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 ${isCompleted
                    ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                    : isActive
                        ? 'border-brand-pink shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                        : `border-[${colors.primary}] border-opacity-40`
                    }`} style={{ borderColor: isCompleted ? '#22c55e' : isActive ? colors.accent : colors.primary }}>

                    {isCompleted ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Zap className={`w-4 h-4 ${isActive ? 'text-brand-pink animate-pulse' : 'text-slate-500'}`} style={{ color: isActive ? colors.accent : undefined }} />
                    )}
                </div>
            </div>
        );
    }

    // Tree Theme (Growth Stages)
    if (currentTheme.id === 'tree') {
        // Calculate growth stage based on index relative to total
        // 0-33%: Sprout
        // 33-66%: Sapling
        // 66-100%: Tree/Flower
        const progress = index / Math.max(1, totalSteps - 1);

        return (
            <div className={`relative flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-125' : ''
                }`}>
                {/* Nature glow */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-400 rounded-full blur-md"
                    />
                )}

                <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center bg-stone-900 border-2 ${isCompleted
                    ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : isActive
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                        : 'border-stone-600'
                    }`}>
                    {isCompleted ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                        <>
                            {progress < 0.33 && <Circle className={`w-3 h-3 ${isActive ? 'text-emerald-400 fill-emerald-400' : 'text-stone-500 fill-stone-700'}`} />}
                            {progress >= 0.33 && progress < 0.66 && <Sprout className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />}
                            {progress >= 0.66 && <Flower className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Fallback
    return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
};
