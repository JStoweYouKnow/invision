import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Sliders, Check, AlertCircle, Volume2, Shield } from 'lucide-react';

import { createPortal } from 'react-dom';

interface UserPreferences {
    publicProfile: boolean;
    soundEnabled?: boolean;
    analyticsEnabled?: boolean;
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
    });
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[700px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full pointer-events-auto text-slate-900"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
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
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                            <Globe className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">Public Profile</p>
                                            <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Allow others to see your vision board</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePref('publicProfile')}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${localPrefs.publicProfile ? 'bg-blue-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${localPrefs.publicProfile ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Sound Effects */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <div className="p-2 bg-pink-100 rounded-lg shrink-0">
                                            <Volume2 className="w-4 h-4 text-pink-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">Sound Effects</p>
                                            <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Play interaction sounds</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePref('soundEnabled')}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${localPrefs.soundEnabled ? 'bg-pink-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${localPrefs.soundEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Analytics */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <div className="p-2 bg-green-100 rounded-lg shrink-0">
                                            <Shield className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">Analytics</p>
                                            <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Share anonymous usage data</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePref('analyticsEnabled')}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${localPrefs.analyticsEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${localPrefs.analyticsEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
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
