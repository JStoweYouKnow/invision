import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sparkles, Brain, TreeDeciduous, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomThemeCreator } from './CustomThemeCreator';

const themeIcons: Record<string, React.ReactNode> = {
    space: <Sparkles className="w-4 h-4" />,
    brain: <Brain className="w-4 h-4" />,
    tree: <TreeDeciduous className="w-4 h-4" />,
    custom: <Palette className="w-4 h-4" />,
};

export const ThemeQuickToggle: React.FC = () => {
    const { availableThemes, customThemes, themeId, setTheme, currentTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-full transition-all flex items-center gap-2 bg-transparent hover:bg-white/5"
                title="Change theme"
            >
                <div style={{ color: currentTheme.colors.primary }}>
                    {themeIcons[currentTheme.id] || <Palette className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium text-white/80 hidden sm:inline">
                    {currentTheme.name}
                </span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 py-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50"
                    >
                        <div className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider">
                            Themes
                        </div>

                        {/* Built-in themes */}
                        {availableThemes.map(theme => {
                            const isSelected = themeId === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        setTheme(theme.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors ${isSelected ? 'bg-brand-purple/20' : ''
                                        }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: theme.colors.background }}
                                    >
                                        <div style={{ color: theme.colors.primary }}>
                                            {themeIcons[theme.id]}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-white">{theme.name}</div>
                                    </div>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-brand-purple" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Custom themes */}
                        {customThemes.length > 0 && (
                            <>
                                <div className="my-1 border-t border-white/10" />
                                <div className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                    Custom
                                </div>
                                {customThemes.map(theme => {
                                    const isSelected = themeId === theme.customId;
                                    return (
                                        <button
                                            key={theme.customId}
                                            onClick={() => {
                                                setTheme(theme.customId);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors ${isSelected ? 'bg-brand-purple/20' : ''
                                                }`}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-cover bg-center"
                                                style={{
                                                    backgroundColor: theme.colors.background,
                                                    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined
                                                }}
                                            >
                                                <div style={{ color: theme.colors.primary }}>
                                                    <Palette className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-medium text-white truncate">{theme.name}</div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-brand-purple" />
                                            )}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                        <div className="my-1 border-t border-white/10" />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsCreatorOpen(true);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors text-left group"
                        >
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 group-hover:bg-white/5 transition-all">
                                <Plus className="w-4 h-4 text-white/50 group-hover:text-white/80" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white/70 group-hover:text-white">Create Custom</div>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CustomThemeCreator isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} />
        </div>
    );
};
