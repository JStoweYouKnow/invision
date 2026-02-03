import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Bell, Check, AlertCircle } from 'lucide-react';

import { createPortal } from 'react-dom';

interface EmailSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail: string;
    emailNotifications: boolean;
    onUpdate: (email: string, notifications: boolean) => Promise<void>;
}

export const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({
    isOpen,
    onClose,
    currentEmail,
    emailNotifications,
    onUpdate
}) => {
    const [email, setEmail] = useState(currentEmail);
    const [notifications, setNotifications] = useState(emailNotifications);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onUpdate(email, notifications);
            onClose();
        } catch {
            setError("Failed to update settings. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
                                    <Mail className="w-5 h-5 text-brand-purple" />
                                    Email Settings
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

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
                                <div className="space-y-2 pt-4">
                                    <label className="text-sm font-medium text-slate-600">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-colors text-slate-900 placeholder:text-slate-400"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <div className="p-2 bg-brand-purple/10 rounded-lg shrink-0">
                                            <Bell className="w-4 h-4 text-brand-purple" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">Notifications</p>
                                            <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Receive updates regarding your goals</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifications(!notifications)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${notifications ? 'bg-brand-purple' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${notifications ? 'left-7' : 'left-1'}`} />
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
