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
                title={`Change theme (Current: ${currentTheme.name})`}
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
                        className="absolute right-0 top-full mt-2 w-56 py-2 bg-white backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50"
                    >
                        <div className="px-3 py-1.5 text-xs font-bold text-black uppercase tracking-wider bg-white">
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
                                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 transition-colors ${isSelected ? 'bg-brand-purple/10' : ''
                                        }`}
                                    title={`Switch to ${theme.name} theme`}
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
                                        <div className="text-sm font-medium text-slate-900">{theme.name}</div>
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
                                <div className="my-1 border-t border-slate-200" />
                                <div className="px-3 py-1.5 text-xs font-bold text-black uppercase tracking-wider bg-white">
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
                                            className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 transition-colors ${isSelected ? 'bg-brand-purple/10' : ''
                                                }`}
                                            title={`Switch to ${theme.name} theme`}
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
                                                <div className="text-sm font-medium text-slate-900 truncate">{theme.name}</div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-brand-purple" />
                                            )}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                        <div className="my-1 border-t border-slate-200" />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsCreatorOpen(true);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 transition-colors text-left group"
                        >
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center group-hover:border-slate-500 group-hover:bg-slate-50 transition-all">
                                <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Create Custom</div>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CustomThemeCreator isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} />
        </div>
    );
};
