import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Brain, TreeDeciduous, Plus, Trash2, Pencil } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomThemeCreator } from './CustomThemeCreator';
import { ConfirmationModal } from './ConfirmationModal';
import type { ThemeConfig, CustomTheme } from '@/lib/themes';

interface ThemeSelectorProps {
    onCreateCustom?: () => void;
}

const themeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    space: Sparkles,
    brain: Brain,
    tree: TreeDeciduous,
};

const themePreviewColors: Record<string, { bg: string; particles: string[] }> = {
    space: {
        bg: 'bg-gradient-to-br from-[#0f0529] to-[#1a0a3e]',
        particles: ['bg-white', 'bg-purple-400', 'bg-blue-400'],
    },
    brain: {
        bg: 'bg-gradient-to-br from-[#1a0a2e] to-[#2d1b4e]',
        particles: ['bg-pink-400', 'bg-cyan-400', 'bg-purple-400'],
    },
    tree: {
        bg: 'bg-gradient-to-br from-[#0a1f0a] to-[#1a3a1a]',
        particles: ['bg-green-400', 'bg-yellow-400', 'bg-emerald-400'],
    },
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onCreateCustom }) => {
    const { availableThemes, customThemes, themeId, setTheme, removeCustomTheme } = useTheme();
    const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
    const [showCreator, setShowCreator] = useState(false);
    const [editingTheme, setEditingTheme] = useState<CustomTheme | undefined>(undefined);
    const [themeToDelete, setThemeToDelete] = useState<CustomTheme | null>(null);

    const handleCreateCustom = () => {
        if (onCreateCustom) {
            onCreateCustom();
        } else {
            setShowCreator(true);
        }
    };

    const renderThemeCard = (theme: ThemeConfig | CustomTheme, isCustom: boolean = false) => {
        const id = isCustom ? (theme as CustomTheme).customId : theme.id;
        const isSelected = themeId === id;
        const previewColors = isCustom ? null : themePreviewColors[theme.id];

        return (
            <motion.div
                key={id}
                onClick={() => setTheme(id)}
                onMouseEnter={() => setHoveredTheme(id)}
                onMouseLeave={() => setHoveredTheme(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex flex-col p-4 rounded-2xl border-2 transition-all text-left group cursor-pointer ${isSelected
                    ? 'border-brand-purple bg-brand-purple/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
            >
                {/* Preview area */}
                <div className={`relative w-full shrink-0 rounded-xl overflow-hidden mb-3 ${previewColors?.bg || ''}`}
                    style={{
                        height: '6rem',
                        ...(isCustom && (theme as CustomTheme).backgroundImage ? {
                            backgroundImage: `url(${(theme as CustomTheme).backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } : !previewColors ? {
                            backgroundColor: theme.colors.background
                        } : {})
                    }}
                >
                    {/* Animated particles preview */}
                    {previewColors && (theme.particles.enabled !== false) && (
                        <div className="absolute inset-0">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute w-1.5 h-1.5 rounded-full ${previewColors?.particles[i % 3]}`}
                                    style={{
                                        left: `${15 + (i * 12) % 70}%`,
                                        top: `${20 + (i * 17) % 60}%`,
                                    }}
                                    animate={{
                                        opacity: [0.4, 1, 0.4],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 2 + (i % 2),
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Overlay for custom themes */}
                    {isCustom && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-purple flex items-center justify-center"
                        >
                            <Check className="w-4 h-4 text-white" />
                        </motion.div>
                    )}

                    {/* Delete button for custom themes */}
                    {/* Action buttons for custom themes */}
                    {isCustom && (
                        <div className="absolute top-2 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTheme(theme as CustomTheme);
                                    setShowCreator(true);
                                }}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg"
                                title="Edit Theme"
                            >
                                <Pencil className="w-3.5 h-3.5 text-white" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setThemeToDelete(theme as CustomTheme);
                                }}
                                className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/30 flex items-center justify-center shadow-lg"
                                title="Delete Theme"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Theme info - centered under preview */}
                <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/10 shrink-0" style={{ color: theme.colors.primary }}>
                        {(() => {
                            const Icon = isCustom || !themeIcons[theme.id] ? Sparkles : themeIcons[theme.id];
                            return <Icon className="w-4 h-4" />;
                        })()}
                    </div>
                    <span className="font-semibold text-white">{theme.name}</span>
                </div>

                {/* Hover glow effect */}
                {hoveredTheme === id && !isSelected && (
                    <motion.div
                        layoutId="theme-hover"
                        className="absolute inset-0 rounded-2xl border-2 border-brand-purple/50 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Built-in themes */}
            <div>
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 text-center">
                    Built-in Themes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableThemes.map(theme => renderThemeCard(theme))}
                </div>
            </div>

            {/* Custom themes */}
            <div>
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 text-center">
                    Your Custom Themes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customThemes.map(theme => renderThemeCard(theme, true))}

                    {/* Create new custom theme button */}
                    <motion.button
                        onClick={handleCreateCustom}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-brand-purple/50 bg-white/5 hover:bg-brand-purple/10 transition-all flex flex-col items-center justify-center min-h-[180px] group"
                    >
                        <div className="p-3 rounded-full bg-white/10 group-hover:bg-brand-purple/20 transition-colors mb-3">
                            <Plus className="w-6 h-6 text-white/60 group-hover:text-brand-purple" />
                        </div>
                        <span className="text-sm font-medium text-white/60 group-hover:text-white">
                            Create Custom Theme
                        </span>
                    </motion.button>
                </div>

                {/* Custom Theme Creator Modal */}
                <CustomThemeCreator
                    isOpen={showCreator}

                    onClose={() => {
                        setShowCreator(false);
                        setTimeout(() => setEditingTheme(undefined), 300); // Clear after animation
                    }}
                    initialTheme={editingTheme}
                />

                <ConfirmationModal
                    isOpen={!!themeToDelete}
                    onClose={() => setThemeToDelete(null)}
                    onConfirm={() => {
                        if (themeToDelete) {
                            removeCustomTheme(themeToDelete.customId);
                            setThemeToDelete(null);
                        }
                    }}
                    title="Delete Custom Theme"
                    message={`Are you sure you want to delete "${themeToDelete?.name || 'this theme'}"? This action cannot be undone.`}
                    confirmText="Delete Theme"
                    isDestructive={true}
                />
            </div>
        </div>
    );
};
