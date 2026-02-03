import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface TooltipContextType {
    activeTooltip: string | null;
    setActiveTooltip: (id: string | null) => void;
    registerTooltip: (id: string) => void;
    markAsSeen: (id: string) => void;
    isSeen: (id: string) => boolean;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTooltip = () => {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error('useTooltip must be used within a TooltipProvider');
    }
    return context;
};

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // const { user } = useAuth(); // Unused
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    // Load seen tooltips from local storage lazily
    const [seenTooltips, setSeenTooltips] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('invision_seen_tooltips');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // const [registeredTooltips, setRegisteredTooltips] = useState<Set<string>>(new Set()); // Unused

    // Save seen tooltips to local storage
    useEffect(() => {
        localStorage.setItem('invision_seen_tooltips', JSON.stringify(Array.from(seenTooltips)));
    }, [seenTooltips]);

    const registerTooltip = (_id: string) => {
        // setRegisteredTooltips(prev => new Set(prev).add(id));
        void _id;
    };

    const markAsSeen = (id: string) => {
        setSeenTooltips(prev => new Set(prev).add(id));
        if (activeTooltip === id) {
            setActiveTooltip(null);
        }
    };

    const isSeen = (id: string) => seenTooltips.has(id);

    return (
        <TooltipContext.Provider value={{ activeTooltip, setActiveTooltip, registerTooltip, markAsSeen, isSeen }}>
            {children}
            {/* Global Overlay for active tooltip if needed, though we'll likely position them relatively */}
        </TooltipContext.Provider>
    );
};

interface TooltipProps {
    id: string;
    content: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    forceVisible?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    id,
    content,
    children,
    position = 'top',
    delay = 500,
    forceVisible = false
}) => {
    const { activeTooltip, setActiveTooltip, markAsSeen, isSeen } = useTooltip();
    const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const isVisible = (activeTooltip === id || forceVisible) && !isSeen(id);

    const handleMouseEnter = () => {
        if (!isSeen(id)) {
            const timeout = setTimeout(() => {
                setActiveTooltip(id);
            }, delay);
            setHoverTimeout(timeout);
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (activeTooltip === id) {
            setActiveTooltip(null);
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAsSeen(id);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3',
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0, x: position === 'left' ? 10 : position === 'right' ? -10 : 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute z-50 w-max max-w-xs ${positionClasses[position]}`}
                    >
                        <div className="relative bg-slate-900 border border-white/20 rounded-xl shadow-xl p-4 text-sm text-white backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    {content}
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    ×
                                </button>
                            </div>

                            {/* Arrow */}
                            <div
                                className={`absolute w-3 h-3 bg-slate-900 border-white/20 transform rotate-45 ${position === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' :
                                    position === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l' :
                                        position === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r' :
                                            'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l'
                                    }`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
