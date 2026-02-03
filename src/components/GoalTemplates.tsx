import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Hash } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { GOAL_TEMPLATES } from '@/data/goalTemplates';

interface GoalTemplatesProps {
    onSelect: (goal: string) => void;
    className?: string;
}

export const GoalTemplates: React.FC<GoalTemplatesProps> = ({ onSelect, className = '' }) => {
    const { currentTheme } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<string>(GOAL_TEMPLATES[0].category);
    const [isOpen, setIsOpen] = useState(false);

    const activeCategory = GOAL_TEMPLATES.find(c => c.category === selectedCategory) || GOAL_TEMPLATES[0];

    return (
        <div className={`w-full ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-4 mx-auto"
                style={{ color: currentTheme.colors.foreground }}
            >
                <Sparkles className="w-4 h-4 text-brand-purple" />
                <span>Need inspiration? Try a template</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mb-6">
                            {/* Categories */}
                            <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide">
                                {GOAL_TEMPLATES.map((template) => (
                                    <button
                                        key={template.category}
                                        type="button"
                                        onClick={() => setSelectedCategory(template.category)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${selectedCategory === template.category
                                            ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/25'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <span>{template.icon}</span>
                                        <span>{template.category}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Templates Grid */}
                            <motion.div
                                key={selectedCategory}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                            >
                                {activeCategory.goals.map((goal, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            onSelect(goal);
                                            setIsOpen(false);
                                        }}
                                        className="group flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-white/10 border border-transparent hover:border-white/5"
                                    >
                                        <div
                                            className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 group-hover:bg-brand-purple/20 transition-colors"
                                            style={{ color: currentTheme.colors.accent }}
                                        >
                                            <Hash className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white/90 group-hover:text-white line-clamp-2">
                                                {goal}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
