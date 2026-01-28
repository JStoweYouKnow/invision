import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, type UserProfile } from '@/lib/firestore';
import { MOCK_USER } from '@/lib/mockData';
import { Camera, Mail, User, Bell, Save, Palette, LogOut, Trash2, ChevronRight, Sliders } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ThemeBackground } from '@/components/backgrounds';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { EmailSettingsModal } from '@/components/profile/EmailSettingsModal';
import { PreferencesModal } from '@/components/profile/PreferencesModal';

interface ProfilePageProps {
    demoMode?: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ demoMode = false }) => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPreferencesModal, setShowPreferencesModal] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (demoMode) {
                // Simulate delay
                setTimeout(() => {
                    setProfile(MOCK_USER);
                    setLoading(false);
                }, 600);
            } else if (user) {
                try {
                    const savedProfile = await firestoreService.getUserProfile(user.uid);

                    if (savedProfile) {
                        setProfile(savedProfile);
                    } else {
                        // Initialize with Auth data if no profile exists
                        const newProfile = {
                            uid: user.uid,
                            displayName: user.displayName || 'Visionary',
                            email: user.email || '',
                            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                            bio: '',
                            preferences: {
                                emailNotifications: true,
                                publicProfile: false
                            }
                        };
                        setProfile(newProfile);
                        // Auto-save immediately to ensure document exists
                        await firestoreService.updateUserProfile(user.uid, newProfile);
                    }
                } catch (err) {
                    console.error("Failed to load profile", err);
                    setMessage({ type: 'error', text: `Failed to load profile: ${(err as Error).message}` });
                } finally {
                    setLoading(false);
                }
            }
        };

        loadProfile();
    }, [user, demoMode]);

    const handleSave = async () => {
        if (!profile || !user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            await firestoreService.updateUserProfile(user.uid, profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Failed to save profile", error);
            setMessage({ type: 'error', text: 'Failed to save changes' });
        } finally {
            setIsSaving(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleEmailUpdate = async (email: string, notifications: boolean) => {
        if (!user || !profile) return;
        const updatedProfile = {
            ...profile,
            email,
            preferences: {
                ...profile.preferences,
                emailNotifications: notifications
            }
        };
        setProfile(updatedProfile);
        await firestoreService.updateUserProfile(user.uid, updatedProfile);
        setMessage({ type: 'success', text: 'Email settings updated' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handlePreferencesUpdate = async (newPrefs: Partial<UserProfile['preferences']>) => {
        if (!user || !profile) return;
        const updatedProfile = {
            ...profile,
            preferences: {
                ...profile.preferences,
                ...newPrefs
            }
        };
        setProfile(updatedProfile);
        await firestoreService.updateUserProfile(user.uid, updatedProfile);
        setMessage({ type: 'success', text: 'Preferences updated' });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center flex-col gap-4">
                <ThemeBackground className="z-0" />
                <div className="z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-md">
                    <h2 className="text-xl font-display font-bold mb-2 text-white">Profile Not Found</h2>
                    <p className="text-slate-300 mb-6">We couldn't load your profile information.</p>
                    {message && (
                        <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            {message.text}
                        </div>
                    )}
                    <Link
                        to="/"
                        className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold hover:scale-105 active:scale-95 transition-all inline-block"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Theme Background */}
            <ThemeBackground className="z-0" />

            {/* Fixed Logo Top Left */}
            <div className="fixed top-6 left-6 z-50">
                <HomeButton />
            </div>

            <div className="max-w-xl mx-auto px-6 py-12 relative z-10" style={{ maxWidth: '576px' }}>
                {/* Header */}
                <div className="flex justify-center items-center mb-8 relative">
                    <h1 className="text-3xl font-display font-bold text-center">Profile</h1>
                </div>

                <div className="flex justify-center mb-10">
                    <NavigationMenu demoMode={demoMode} />
                </div>

                <div className="flex flex-col gap-10">
                    {/* Top Section: Avatar & Quick Stats */}
                    <div className="px-6 md:px-20 py-12 text-center">
                        <div className="relative w-96 h-96 mx-auto mb-12 group" style={{ width: '384px', height: '384px' }}>
                            <img
                                src={profile.photoURL}
                                alt={profile.displayName}
                                className="w-full h-full rounded-full object-cover border-2 border-brand-purple/20 shadow-xl"
                            />
                            <button className="absolute bottom-10 right-10 p-2 bg-brand-purple rounded-full text-white hover:bg-brand-purple/80 transition-colors shadow-lg group-hover:scale-105" style={{ bottom: '40px', right: '40px' }}>
                                <Camera className="w-6 h-6" />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 mt-8" style={{ marginTop: '32px' }}>{profile.displayName}</h2>
                        <p className="text-muted-foreground mb-4">{profile.email}</p>

                        <div className="flex items-center justify-center gap-2 text-xs font-medium bg-brand-indigo/10 text-brand-indigo py-1.5 px-3 rounded-full mx-auto w-fit mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-indigo opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-indigo"></span>
                            </span>
                            Visionary
                        </div>

                        {/* Inline Stats */}
                        <div className="grid grid-cols-3 gap-4 px-4">
                            <div>
                                <div className="text-2xl font-bold">4</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Active</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-brand-purple">12</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Done</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">1</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Shared</div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-8">
                        <div className="px-6 md:px-20 py-12">
                            <h3 className="text-xl font-bold mb-8 flex items-center justify-center gap-2">
                                <User className="w-5 h-5 text-brand-purple" />
                                Personal Info
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="displayName" className="block text-sm font-medium text-muted-foreground mb-2 text-center">Display Name</label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-brand-purple transition-colors text-center"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-2 text-center">Bio</label>
                                    <textarea
                                        id="bio"
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-3xl px-6 py-4 h-32 focus:outline-none focus:border-brand-purple transition-colors resize-none text-center"
                                        placeholder="Tell us about your dreams..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 md:px-20 py-12">
                            <h3 className="text-xl font-bold mb-8 flex items-center justify-center gap-2">
                                <Bell className="w-5 h-5 text-brand-purple" />
                                Preferences
                            </h3>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowEmailModal(true)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5 hover:border-white/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-purple/20 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                                            <Mail className="w-4 h-4 text-brand-purple" />
                                        </div>
                                        <div className="text-left flex items-baseline gap-2">
                                            <span className="font-medium">Emails</span>
                                            <span className="text-xs text-muted-foreground hidden sm:inline">Manage address & notifications</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>

                                <button
                                    onClick={() => setShowPreferencesModal(true)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5 hover:border-white/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                                            <Sliders className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="text-left flex items-baseline gap-2">
                                            <span className="font-medium">General</span>
                                            <span className="text-xs text-muted-foreground hidden sm:inline">App settings & visibility</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="px-6 md:px-20 py-12">
                            <h3 className="text-xl font-bold mb-8 flex items-center justify-center gap-2">
                                <Palette className="w-5 h-5 text-brand-purple" />
                                Theme
                            </h3>
                            <ThemeSelector />
                        </div>

                        <div className="flex flex-col items-center gap-6 pt-8 pb-12">
                            {message && (
                                <span className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {message.text}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-white text-black px-12 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.4)] text-lg"
                                style={{
                                    backgroundColor: 'white',
                                    color: 'black'
                                }}
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Save Changes
                            </button>

                            {/* Account Actions */}
                            <div className="flex items-center gap-6 mt-8 border-t border-white/10 pt-8 w-full max-w-xs justify-center">
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </button>
                                <div className="h-4 w-px bg-white/10" />
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                                            try {
                                                await user?.delete();
                                                // Force reload or redirect handled by AuthContext state change usually, 
                                                // but let's ensure cleanup
                                                window.location.href = '/';
                                            } catch (error) {
                                                console.error("Delete failed", error);
                                                alert("Failed to delete account. You may need to re-login first.");
                                            }
                                        }
                                    }}
                                    className="flex items-center gap-2 text-sm text-red-400/60 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EmailSettingsModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                currentEmail={profile.email}
                emailNotifications={profile.preferences.emailNotifications}
                onUpdate={handleEmailUpdate}
            />

            <PreferencesModal
                isOpen={showPreferencesModal}
                onClose={() => setShowPreferencesModal(false)}
                preferences={profile.preferences}
                onUpdate={handlePreferencesUpdate}
            />
        </div>

    );
};
