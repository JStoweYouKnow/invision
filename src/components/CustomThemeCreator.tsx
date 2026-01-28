import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Check, Wand2, Sliders, Palette as PaletteIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAI } from '@/hooks/useThemeAI';
import type { CustomTheme } from '@/lib/themes';

interface CustomThemeCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    initialTheme?: CustomTheme;
}

const COLOR_PRESETS = [
    { name: 'Purple Dream', primary: '#a855f7', accent: '#ec4899', glow: 'rgba(168, 85, 247, 0.5)' },
    { name: 'Ocean Blue', primary: '#3b82f6', accent: '#06b6d4', glow: 'rgba(59, 130, 246, 0.5)' },
    { name: 'Forest Green', primary: '#22c55e', accent: '#84cc16', glow: 'rgba(34, 197, 94, 0.5)' },
    { name: 'Sunset Orange', primary: '#f97316', accent: '#eab308', glow: 'rgba(249, 115, 22, 0.5)' },
    { name: 'Rose Pink', primary: '#ec4899', accent: '#f43f5e', glow: 'rgba(236, 72, 153, 0.5)' },
    { name: 'Midnight', primary: '#6366f1', accent: '#8b5cf6', glow: 'rgba(99, 102, 241, 0.5)' },
];

type CreatorTab = 'simple' | 'advanced' | 'ai';

export const CustomThemeCreator: React.FC<CustomThemeCreatorProps> = ({ isOpen, onClose, initialTheme }) => {
    const { addCustomTheme, updateCustomTheme, setTheme } = useTheme();
    const { generateTheme, isGenerating } = useThemeAI();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<CreatorTab>('simple');

    // Theme State
    const [themeName, setThemeName] = useState(initialTheme?.name || 'My Custom Theme');
    const [description, setDescription] = useState(initialTheme?.description || 'A personalized vision experience');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Advanced State
    const [colors, setColors] = useState({
        background: initialTheme?.colors.background || '#0a0a0a',
        foreground: initialTheme?.colors.foreground || '#ffffff',
        primary: initialTheme?.colors.primary || COLOR_PRESETS[0].primary,
        secondary: initialTheme?.colors.secondary || COLOR_PRESETS[0].primary,
        accent: initialTheme?.colors.accent || COLOR_PRESETS[0].accent,
        glow: initialTheme?.colors.glow || COLOR_PRESETS[0].glow,
    });

    const [particles, setParticles] = useState({
        count: initialTheme?.particles.count ?? 60,
        color: initialTheme?.particles.color || COLOR_PRESETS[0].primary,
        glowColor: initialTheme?.particles.glowColor || COLOR_PRESETS[0].glow,
        sizes: initialTheme?.particles.sizes || ([3, 6, 10] as [number, number, number]),
        enabled: initialTheme?.particles.enabled ?? true,
    });

    // AI State
    const [aiPrompt, setAiPrompt] = useState('');

    // Update state when preset changes (Simple mode)
    const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
        console.log('Selecting preset:', preset);
        setColors(prev => ({
            ...prev,
            primary: preset.primary,
            secondary: preset.primary,
            accent: preset.accent,
            glow: preset.glow,
        }));
        setParticles(prev => ({
            ...prev,
            color: preset.primary,
            glowColor: preset.glow,
        }));
    };

    // AI Generation Handler
    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return;

        const generated = await generateTheme(aiPrompt);
        if (generated) {
            setThemeName(generated.name || 'AI Generated Theme');
            setDescription(generated.description || 'A custom AI-generated theme');

            // Validate and apply colors with defaults
            setColors(prev => ({
                background: generated.colors?.background || prev.background,
                foreground: generated.colors?.foreground || prev.foreground,
                primary: generated.colors?.primary || prev.primary,
                secondary: generated.colors?.secondary || prev.secondary,
                accent: generated.colors?.accent || prev.accent,
                glow: generated.colors?.glow || prev.glow,
            }));

            // Validate and apply particles with defaults
            const generatedSizes = generated.particles?.sizes;
            const validSizes: [number, number, number] = Array.isArray(generatedSizes) && generatedSizes.length >= 3
                ? [Number(generatedSizes[0]) || 3, Number(generatedSizes[1]) || 6, Number(generatedSizes[2]) || 10]
                : [3, 6, 10];

            setParticles(prev => ({
                count: typeof generated.particles?.count === 'number' ? generated.particles.count : (parseInt(String(generated.particles?.count)) || prev.count),
                color: generated.particles?.color || prev.color,
                glowColor: generated.particles?.glowColor || prev.glowColor,
                sizes: validSizes,
                enabled: true,
            }));
        }
    };

    // Create object URL for preview
    const imagePreviewUrl = useMemo(() => {
        if (!selectedImage) return null;
        return URL.createObjectURL(selectedImage);
    }, [selectedImage]);

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);

        try {
            // Convert image to base64 if selected
            let backgroundImage: string | undefined = initialTheme?.backgroundImage;
            if (selectedImage) {
                backgroundImage = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedImage);
                });
            }

            if (initialTheme) {
                // Update existing theme
                updateCustomTheme(initialTheme.customId, {
                    name: themeName,
                    description,
                    preview: backgroundImage || '',
                    backgroundImage,
                    colors,
                    particles,
                });
                onClose();
            } else {
                // Create new theme
                const newTheme = addCustomTheme({
                    id: 'custom',
                    name: themeName,
                    description,
                    preview: backgroundImage || '',
                    backgroundImage,
                    userId: 'local',
                    colors,
                    particles,
                });

                // Apply the new theme
                setTheme(newTheme.customId);
                onClose();

                // Reset form
                setThemeName('My Custom Theme');
                setDescription('A personalized vision experience');
                setSelectedImage(null);
                handlePresetSelect(COLOR_PRESETS[0]);
            }
        } catch (error) {
            console.error('Failed to create/update theme:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[700px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            style={{ backgroundColor: '#ffffff' }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full isolate pointer-events-auto relative"
                        >

                            <div className="flex items-center justify-center px-12 py-10 border-b border-slate-100 bg-white sticky top-0 z-10">
                                <div className="text-center">
                                    <h2 style={{ color: '#0f172a' }} className="text-2xl font-display font-bold text-slate-900">{initialTheme ? 'Edit Theme' : 'Create Custom Theme'}</h2>
                                    <p style={{ color: '#64748b' }} className="text-sm font-medium text-slate-500">{initialTheme ? 'Modify your personalized vision experience' : 'Design your own vision background'}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-3 mx-6 mt-2 bg-slate-50 rounded-2xl">
                                <button
                                    onClick={() => setActiveTab('simple')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'simple' ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <PaletteIcon className="w-4 h-4" />
                                    Simple
                                </button>
                                <button
                                    onClick={() => setActiveTab('advanced')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'advanced' ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Sliders className="w-4 h-4" />
                                    Advanced
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Wand2 className="w-4 h-4" />
                                    AI Generate
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8 pb-32">
                                {/* Theme Name & Description (Always Visible) */}
                                <div className="space-y-4">
                                    <div>
                                        <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-2 text-center">Theme Name</label>
                                        <input
                                            type="text"
                                            value={themeName}
                                            onChange={(e) => setThemeName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 text-center"
                                            style={{ color: '#000000' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-2 text-center">Description</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 text-center"
                                            style={{ color: '#000000' }}
                                        />
                                    </div>
                                </div>

                                {activeTab === 'simple' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                        {/* Background Image Upload */}
                                        <div>
                                            <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-2.5 text-center">
                                                Background Image
                                            </label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                onDrop={handleDrop}
                                                onDragOver={(e) => e.preventDefault()}
                                                className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all group ${selectedImage || initialTheme?.backgroundImage
                                                    ? 'border-brand-purple bg-purple-50/50'
                                                    : 'border-slate-200 hover:border-brand-purple/50 bg-slate-50 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {imagePreviewUrl || initialTheme?.backgroundImage ? (
                                                    <div className="relative h-48">
                                                        <img
                                                            src={imagePreviewUrl || initialTheme?.backgroundImage}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm font-medium">
                                                            <div className="p-1 bg-green-500 rounded-full">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                            {selectedImage?.name || 'Current Background'}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedImage(null);
                                                            }}
                                                            className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-red-500 backdrop-blur-md rounded-full transition-colors group/btn"
                                                        >
                                                            <X className="w-4 h-4 text-white group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-12">
                                                        <div className="p-4 rounded-full bg-white shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                                                            <Upload className="w-6 h-6 text-brand-purple" />
                                                        </div>
                                                        <p className="text-black font-bold" style={{ color: '#000000' }}>Click to upload image</p>
                                                        <p className="text-sm text-slate-500 mt-1">or drag and drop (PNG, JPG)</p>
                                                    </div>
                                                )}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Color Presets */}
                                        <div>
                                            <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-3 text-center">Color Presets</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {COLOR_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        onClick={() => handlePresetSelect(preset)}
                                                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${colors.primary === preset.primary ? 'bg-slate-50 border-slate-900' : 'border-slate-100 hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                                                        <span className={`text-sm font-bold ${colors.primary === preset.primary ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {preset.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Particle Toggle */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <label style={{ color: '#334155' }} className="text-sm font-bold text-slate-700">Enable Particles</label>
                                            <button
                                                onClick={() => setParticles(prev => ({ ...prev, enabled: !prev.enabled }))}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${particles.enabled ? 'bg-brand-purple' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${particles.enabled ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'advanced' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div>
                                            <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-3 text-center">Colors</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(colors).map(([key, value]) => {
                                                    // Convert rgba/rgb to hex for input[type="color"]
                                                    // Simple regex to extract r,g,b from rgba/rgb string and convert to hex
                                                    let displayValue = value;
                                                    if (value.startsWith('rgb')) {
                                                        const match = value.match(/\d+/g);
                                                        if (match && match.length >= 3) {
                                                            const [r, g, b] = match.map(Number);
                                                            displayValue = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                                                        } else {
                                                            displayValue = '#000000'; // Default fallback
                                                        }
                                                    }

                                                    return (
                                                        <div key={key}>
                                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block text-center">{key}</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={displayValue}
                                                                    onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    className="h-10 w-10 rounded-lg cursor-pointer border-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={value}
                                                                    onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-mono text-center"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-3 text-center">Particles ({particles.count})</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={particles.count}
                                                onChange={(e) => setParticles(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700">Enable Particles</label>
                                            <button
                                                onClick={() => setParticles(prev => ({ ...prev, enabled: !prev.enabled }))}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${particles.enabled ? 'bg-brand-purple' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${particles.enabled ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'ai' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                                            <div className="flex items-center gap-3 mb-4 justify-center">
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-brand-purple">
                                                    <Wand2 className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-bold text-brand-purple">AI Theme Generator</h3>
                                            </div>
                                            <textarea
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                placeholder="Describe your dream theme (e.g., 'Cyberpunk Neon City with glowing pink rain' or 'Tranquil Japanese Garden')"
                                                className="w-full h-32 bg-white border border-purple-200 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 resize-none mb-4 text-center"
                                            />
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiPrompt.trim()}
                                                className="w-full py-3 bg-brand-purple text-white rounded-xl font-bold hover:bg-brand-purple/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Generating Magic...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Generate Theme
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Preview */}
                                <div>
                                    <label style={{ color: '#334155' }} className="block text-sm font-bold text-slate-700 mb-2.5 text-center">Preview</label>
                                    <div
                                        className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm group shrink-0"
                                        style={{ height: '12rem', minHeight: '12rem' }}
                                    >
                                        <div
                                            className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                                            style={{
                                                backgroundColor: colors.background,
                                                backgroundImage: imagePreviewUrl ? `url(${imagePreviewUrl})` : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: imagePreviewUrl
                                                    ? `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)`
                                                    : `linear-gradient(to bottom, ${colors.background}00 0%, ${colors.background}80 100%)`
                                            }}
                                        />
                                        {/* Sample particles */}
                                        {particles.enabled && [...Array(Math.min(50, particles.count))].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute rounded-full"
                                                style={{
                                                    left: `${10 + (i * 8) % 80}%`,
                                                    top: `${20 + (i * 13) % 60}%`,
                                                    width: `${particles.sizes[i % 3]}px`,
                                                    height: `${particles.sizes[i % 3]}px`,
                                                    backgroundColor: particles.color,
                                                    boxShadow: `0 0 8px ${particles.glowColor}`,
                                                }}
                                                animate={{
                                                    opacity: [0.4, 1, 0.4],
                                                    scale: [0.8, 1.2, 0.8],
                                                }}
                                                transition={{
                                                    duration: 2 + (i % 2),
                                                    repeat: Infinity,
                                                    delay: i * 0.15,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-center gap-3 px-12 py-8 border-t border-slate-100 bg-slate-50/50 sticky bottom-0 z-10">
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !themeName.trim()}
                                    className="w-48 px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {initialTheme ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            {initialTheme ? 'Update Theme' : 'Create Custom Theme'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    style={{ color: '#64748b' }}
                                    className="w-48 px-6 py-2.5 rounded-full font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null;
};
