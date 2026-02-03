import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Sliders, Check, AlertCircle, Volume2, Shield, Sparkles } from 'lucide-react';

import { createPortal } from 'react-dom';

interface UserPreferences {
    publicProfile: boolean;
    soundEnabled?: boolean;
    analyticsEnabled?: boolean;
    includeProfileInVisions?: boolean;
}

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: UserPreferences;
    onUpdate: (prefs: UserPreferences) => Promise<void>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
    isOpen,
    onClose,
    preferences,
    onUpdate
}) => {
    const [localPrefs, setLocalPrefs] = useState({
        publicProfile: preferences.publicProfile,
        soundEnabled: preferences.soundEnabled ?? true,
        analyticsEnabled: preferences.analyticsEnabled ?? true,
        includeProfileInVisions: preferences.includeProfileInVisions ?? false,
    });

    useEffect(() => {
        if (isOpen) {
            setLocalPrefs({
                publicProfile: preferences.publicProfile,
                soundEnabled: preferences.soundEnabled ?? true,
                analyticsEnabled: preferences.analyticsEnabled ?? true,
                includeProfileInVisions: preferences.includeProfileInVisions ?? false,
            });
        }
    }, [isOpen, preferences]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onUpdate(localPrefs);
            onClose();
        } catch {
            setError("Failed to update preferences.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePref = (key: keyof typeof localPrefs) => {
        console.log(`Toggling preference: ${key}`);
        setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 modal-backdrop-macos z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[700px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="modal-macos rounded-2xl overflow-hidden flex flex-col h-full pointer-events-auto text-slate-900"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000000' }}
                        >
                            <div className="p-8 pb-4 flex-shrink-0 flex items-center justify-between">
                                <div className="flex-1" />
                                <h2 className="text-xl font-display font-bold flex items-center gap-2 text-slate-900">
                                    <Sliders className="w-5 h-5 text-brand-purple" />
                                    Preferences
                                </h2>
                                <div className="flex-1 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-4">
                                {/* Public Profile */}
                                <div
                                    role="button"
                                    onClick={() => togglePref('publicProfile')}
                                    className={`w-full flex items-center justify-center p-4 rounded-xl border-2 mt-4 cursor-pointer transition-all group select-none gap-3 active:scale-95 ${localPrefs.publicProfile ? 'bg-blue-100/80 border-blue-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 transition-transform ${localPrefs.publicProfile ? 'bg-blue-500 scale-110' : 'bg-slate-200 group-hover:scale-110'}`}>
                                        <Globe className={`w-4 h-4 ${localPrefs.publicProfile ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${localPrefs.publicProfile ? 'text-blue-900' : 'text-slate-900'}`}>Public Profile</p>
                                </div>

                                {/* Sound Effects */}
                                <div
                                    role="button"
                                    onClick={() => togglePref('soundEnabled')}
                                    className={`w-full flex items-center justify-center p-4 rounded-xl border-2 mt-4 cursor-pointer transition-all group select-none gap-3 active:scale-95 ${localPrefs.soundEnabled ? 'bg-pink-100/80 border-pink-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 transition-transform ${localPrefs.soundEnabled ? 'bg-pink-500 scale-110' : 'bg-slate-200 group-hover:scale-110'}`}>
                                        <Volume2 className={`w-4 h-4 ${localPrefs.soundEnabled ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${localPrefs.soundEnabled ? 'text-pink-900' : 'text-slate-900'}`}>Sound Effects</p>
                                </div>

                                {/* Analytics */}
                                <div
                                    role="button"
                                    onClick={() => togglePref('analyticsEnabled')}
                                    className={`w-full flex items-center justify-center p-4 rounded-xl border-2 mt-4 cursor-pointer transition-all group select-none gap-3 active:scale-95 ${localPrefs.analyticsEnabled ? 'bg-green-100/80 border-green-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 transition-transform ${localPrefs.analyticsEnabled ? 'bg-green-500 scale-110' : 'bg-slate-200 group-hover:scale-110'}`}>
                                        <Shield className={`w-4 h-4 ${localPrefs.analyticsEnabled ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${localPrefs.analyticsEnabled ? 'text-green-900' : 'text-slate-900'}`}>Analytics</p>
                                </div>

                                {/* Include Profile in Visions */}
                                <div
                                    role="button"
                                    onClick={() => togglePref('includeProfileInVisions')}
                                    className={`w-full flex items-center justify-center p-4 rounded-xl border-2 mt-4 cursor-pointer transition-all group select-none gap-3 active:scale-95 ${localPrefs.includeProfileInVisions ? 'bg-purple-100/80 border-purple-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 transition-transform ${localPrefs.includeProfileInVisions ? 'bg-purple-500 scale-110' : 'bg-slate-200 group-hover:scale-110'}`}>
                                        <Sparkles className={`w-4 h-4 ${localPrefs.includeProfileInVisions ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${localPrefs.includeProfileInVisions ? 'text-purple-900' : 'text-slate-900'}`}>Personalized Visions</p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="mt-auto pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors text-slate-500 border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null;
};
