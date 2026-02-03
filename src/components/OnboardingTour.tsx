import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Target, Palette, Users, Bell, Rocket } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: string; // CSS selector for element to highlight
    position: 'center' | 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to InVision!',
        description: 'Transform your dreams into actionable plans with the power of AI. Let us show you around.',
        icon: Sparkles,
        position: 'center'
    },
    {
        id: 'create',
        title: 'Create Your Vision',
        description: 'Describe any goal - from learning a new skill to starting a business. Our AI will create a detailed roadmap for you.',
        icon: Target,
        position: 'center'
    },
    {
        id: 'wormhole',
        title: 'The Wormhole',
        description: 'Not sure what to pursue? Click the Wormhole button and let AI invent an exciting life goal for you!',
        icon: Rocket,
        position: 'center'
    },
    {
        id: 'themes',
        title: 'Choose Your Theme',
        description: 'Switch between Cosmos, Brain, and Forest themes. Each one transforms how your goals are visualized.',
        icon: Palette,
        position: 'center'
    },
    {
        id: 'community',
        title: 'Join the Community',
        description: 'Share your visions publicly, discover what others are working on, and find inspiration from fellow dreamers.',
        icon: Users,
        position: 'center'
    },
    {
        id: 'notifications',
        title: 'Stay on Track',
        description: 'Get milestone reminders and daily motivation. We\'ll help you maintain momentum on your journey.',
        icon: Bell,
        position: 'center'
    }
];

const STORAGE_KEY = 'invision_onboarding_complete';

interface OnboardingTourProps {
    forceShow?: boolean;
    onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ forceShow = false, onComplete }) => {
    const { currentTheme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has completed onboarding
        const hasCompleted = localStorage.getItem(STORAGE_KEY);
        if (!hasCompleted || forceShow) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [forceShow]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const step = TOUR_STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === TOUR_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    if (!isVisible) return null;

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                        onClick={handleSkip}
                    />

                    {/* Tour Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[9999] p-4"
                    >
                        <div
                            className="relative rounded-3xl overflow-hidden shadow-2xl"
                            style={{
                                background: `linear-gradient(135deg, ${currentTheme.colors.primary}20 0%, ${currentTheme.colors.background || '#0a0515'}95 50%, ${currentTheme.colors.accent}10 100%)`,
                                border: `1px solid ${currentTheme.colors.primary}30`
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleSkip}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Progress Dots */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {TOUR_STEPS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentStep(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentStep
                                            ? 'w-6'
                                            : 'hover:opacity-80'
                                            }`}
                                        style={{
                                            backgroundColor: idx === currentStep
                                                ? currentTheme.colors.primary
                                                : idx < currentStep
                                                    ? currentTheme.colors.accent + '80'
                                                    : 'rgba(255,255,255,0.3)'
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="px-8 pt-16 pb-8 text-center">
                                {/* Icon */}
                                <motion.div
                                    key={step.id}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
                                        boxShadow: `0 10px 40px ${currentTheme.colors.primary}40`
                                    }}
                                >
                                    <Icon className="w-10 h-10 text-white" />
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    key={`title-${step.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-2xl font-display font-bold text-white mb-3"
                                >
                                    {step.title}
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    key={`desc-${step.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-white/70 text-base leading-relaxed mb-8"
                                >
                                    {step.description}
                                </motion.p>

                                {/* Navigation */}
                                <div className="flex items-center justify-between gap-4">
                                    <button
                                        onClick={handlePrev}
                                        disabled={isFirstStep}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${isFirstStep
                                            ? 'opacity-0 pointer-events-none'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </button>

                                    <button
                                        onClick={handleSkip}
                                        className="text-white/40 hover:text-white/60 text-sm transition-colors"
                                    >
                                        Skip tour
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                                        style={{
                                            background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
                                            boxShadow: `0 4px 20px ${currentTheme.colors.primary}40`
                                        }}
                                    >
                                        {isLastStep ? (
                                            <>
                                                Get Started
                                                <Sparkles className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <>
                                                Next
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div
                                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
                                style={{ backgroundColor: currentTheme.colors.accent }}
                            />
                            <div
                                className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                                style={{ backgroundColor: currentTheme.colors.primary }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Hook to trigger onboarding tour
// eslint-disable-next-line react-refresh/only-export-components
export const useOnboardingTour = () => {
    const resetTour = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    const hasCompletedTour = () => {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    };

    return { resetTour, hasCompletedTour };
};

export default OnboardingTour;
