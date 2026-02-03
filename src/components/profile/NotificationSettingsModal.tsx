import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, AlertCircle, Target, Flame, Users, Mail, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';
import { type NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: NotificationPreferences;
    onUpdate: (prefs: NotificationPreferences) => Promise<void>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
    isOpen,
    onClose,
    preferences,
    onUpdate
}) => {
    const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...preferences
    });

    useEffect(() => {
        if (isOpen) {
            setLocalPrefs({
                ...DEFAULT_NOTIFICATION_PREFERENCES,
                ...preferences
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
            setError("Failed to update notification settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePref = (key: keyof NotificationPreferences) => {
        if (typeof localPrefs[key] === 'boolean') {
            setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const togglePrefs: Array<{
        key: keyof NotificationPreferences;
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        description: string;
        activeColor: string;
    }> = [
            {
                key: 'enabled',
                icon: Bell,
                label: 'Enable Notifications',
                description: 'Master switch for all notifications',
                activeColor: 'blue'
            },
            {
                key: 'milestoneReminders',
                icon: Target,
                label: 'Milestone Reminders',
                description: 'Get notified before milestone deadlines',
                activeColor: 'purple'
            },
            {
                key: 'dailyStepReminders',
                icon: Clock,
                label: 'Daily Motivation',
                description: 'Receive daily encouragement to make progress',
                activeColor: 'green'
            },
            {
                key: 'streakAlerts',
                icon: Flame,
                label: 'Streak Alerts',
                description: 'Know when your streak is at risk',
                activeColor: 'orange'
            },
            {
                key: 'socialNotifications',
                icon: Users,
                label: 'Social Updates',
                description: 'Friend activity and community updates',
                activeColor: 'pink'
            }
        ];

    const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        blue: { bg: 'bg-blue-100/80', border: 'border-blue-500', text: 'text-blue-900', iconBg: 'bg-blue-500' },
        purple: { bg: 'bg-purple-100/80', border: 'border-purple-500', text: 'text-purple-900', iconBg: 'bg-purple-500' },
        green: { bg: 'bg-green-100/80', border: 'border-green-500', text: 'text-green-900', iconBg: 'bg-green-500' },
        orange: { bg: 'bg-orange-100/80', border: 'border-orange-500', text: 'text-orange-900', iconBg: 'bg-orange-500' },
        pink: { bg: 'bg-pink-100/80', border: 'border-pink-500', text: 'text-pink-900', iconBg: 'bg-pink-500' }
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[85vh] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="modal-macos rounded-2xl overflow-hidden flex flex-col h-full pointer-events-auto text-slate-900"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#000000' }}
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 flex-shrink-0 flex items-center justify-between border-b border-slate-200/50">
                                <div className="flex-1" />
                                <h2 className="text-xl font-display font-bold flex items-center gap-2 text-slate-900">
                                    <Bell className="w-5 h-5 text-orange-500" />
                                    Notification Settings
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

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                                {/* Toggle Switches */}
                                <div className="space-y-3 mt-4">
                                    {togglePrefs.map(({ key, icon: Icon, label, description, activeColor }) => {
                                        const isActive = localPrefs[key] as boolean;
                                        const colors = colorClasses[activeColor];
                                        const isDisabled = key !== 'enabled' && !localPrefs.enabled;

                                        return (
                                            <div
                                                key={key}
                                                role="button"
                                                onClick={() => !isDisabled && togglePref(key)}
                                                className={`w-full flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all group select-none gap-4 ${isDisabled
                                                    ? 'opacity-50 cursor-not-allowed bg-slate-100 border-transparent'
                                                    : isActive
                                                        ? `${colors.bg} ${colors.border} shadow-md`
                                                        : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                                    } ${!isDisabled ? 'active:scale-[0.98]' : ''}`}
                                            >
                                                <div className={`p-2.5 rounded-xl shrink-0 transition-transform ${isActive && !isDisabled ? `${colors.iconBg} scale-110` : 'bg-slate-200 group-hover:scale-105'
                                                    }`}>
                                                    <Icon className={`w-5 h-5 ${isActive && !isDisabled ? 'text-white' : 'text-slate-500'}`} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className={`font-bold ${isActive && !isDisabled ? colors.text : 'text-slate-900'}`}>
                                                        {label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                                                </div>
                                                {/* Toggle indicator */}
                                                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isActive && !isDisabled ? colors.iconBg : 'bg-slate-300'
                                                    }`}>
                                                    <motion.div
                                                        className="w-5 h-5 rounded-full bg-white shadow-md"
                                                        animate={{ x: isActive ? 20 : 0 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Email Digest */}
                                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-slate-200">
                                            <Mail className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Email Digest</p>
                                            <p className="text-xs text-slate-500">Summary of your progress</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['none', 'daily', 'weekly'] as const).map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setLocalPrefs(prev => ({ ...prev, emailDigest: option }))}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${localPrefs.emailDigest === option
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                    }`}
                                            >
                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reminder Days */}
                                <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">Reminder Lead Time</p>
                                            <p className="text-xs text-slate-500">Days before milestone to remind you</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLocalPrefs(prev => ({
                                                    ...prev,
                                                    reminderDaysBefore: Math.max(1, prev.reminderDaysBefore - 1)
                                                }))}
                                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors font-bold text-slate-600"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-slate-900">
                                                {localPrefs.reminderDaysBefore}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setLocalPrefs(prev => ({
                                                    ...prev,
                                                    reminderDaysBefore: Math.min(14, prev.reminderDaysBefore + 1)
                                                }))}
                                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors font-bold text-slate-600"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                {/* Action Buttons */}
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
                                                Save Settings
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
