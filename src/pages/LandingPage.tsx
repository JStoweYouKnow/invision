import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { GoalInput } from '@/components/GoalInput';
import { PlanViewer } from '@/components/PlanViewer';
import { geminiService, type GeneratedPlan } from '@/lib/gemini';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { firestoreService, type UserProfile } from '@/lib/firestore';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
import { ThemeBackground } from '@/components/backgrounds';
import { useTheme } from '@/contexts/ThemeContext';
import { notificationService, DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications';
import { WarpAnimation } from '@/components/WarpAnimation';
import { OnboardingTour } from '@/components/OnboardingTour';



export const LandingPage: React.FC = () => {
    const { user, signInWithGoogle, signInAsGuest, signOut, authError, clearAuthError } = useAuth();
    const { showError, showSuccess } = useToast();
    const { currentTheme } = useTheme(); // Get theme
    const [hasStarted, setHasStarted] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Fetch user profile to check preferences
    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const profile = await firestoreService.getUserProfile(user.uid);
                    setUserProfile(profile);
                } catch (err) {
                    console.warn('Failed to fetch user profile for vision preferences:', err);
                }
            } else {
                setUserProfile(null);
            }
        };
        fetchProfile();
    }, [user]);

    // Dynamic Tagline
    const getTagline = () => {
        switch (currentTheme.id) {
            case 'brain': return "Grow a new neural pathway.";
            case 'tree': return "Seed a new interest.";
            default: return "Shoot for the moon and hit the stars.";
        }
    };


    const [isLoading, setIsLoading] = useState(false);
    const [isWormholeActive, setIsWormholeActive] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
    const [visionImage, setVisionImage] = useState<string>('');
    const [planSaved, setPlanSaved] = useState(false);

    // Helper: Schedule milestone reminders for a goal
    const scheduleMilestoneReminders = async (userId: string, goalId: string, plan: GeneratedPlan) => {
        try {
            // Get user's notification preferences
            const storedPrefs = localStorage.getItem('invision_notification_prefs');
            const prefs = storedPrefs ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(storedPrefs) } : DEFAULT_NOTIFICATION_PREFERENCES;

            if (prefs.enabled && prefs.milestoneReminders) {
                await notificationService.scheduleMilestoneReminders(
                    userId,
                    goalId,
                    plan.title,
                    plan.timeline.map(m => ({ date: m.date, milestone: m.milestone })),
                    prefs.reminderDaysBefore
                );
            }
        } catch (err) {
            console.warn('Failed to schedule milestone reminders:', err);
        }
    };

    // Helper: Retry wrapper for API calls
    const withRetry = async <T,>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        delayMs: number = 1000
    ): Promise<T> => {
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                console.warn(`Attempt ${attempt + 1} failed:`, error);
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
                }
            }
        }
        throw lastError;
    };



    const handleGoalSubmit = async (goal: string, timeline: string, image?: File) => {
        console.log("🚀 handleGoalSubmit started", { goal, timeline });
        setIsLoading(true);
        setPlanSaved(false); // Reset saved state for new goal
        try {
            // Step 1: Generate plan (must complete before showing UI)
            const generatedPlanResult = await withRetry(
                () => geminiService.generatePlan(goal, timeline, image),
                3,
                500
            );

            // Show plan immediately — don't wait for image
            setGeneratedPlan(generatedPlanResult);
            setIsLoading(false);

            // Step 2: Generate image in background (non-blocking)
            const includeProfilePhoto = userProfile?.preferences?.includeProfileInVisions && userProfile?.photoURL;
            const profilePhotoForVision = includeProfilePhoto ? userProfile.photoURL : undefined;

            const imagePromise = withRetry(
                () => geminiService.generateVisionImage(
                    goal,
                    generatedPlanResult.visionaryDescription,
                    profilePhotoForVision
                ),
                2,
                500
            ).catch((imgError) => {
                console.warn('Image generation failed:', imgError);
                return '';
            });

            // Step 3: Save to Firestore in parallel with image generation
            const savePromise = user
                ? firestoreService.saveGoal(
                    user.uid,
                    generatedPlanResult,
                    '', // Image not ready yet — will update after
                    user.displayName || 'Anonymous',
                    user.photoURL || undefined
                )
                : Promise.resolve(null);

            // Wait for both image and save to complete
            const [generatedImgUrl, goalId] = await Promise.all([imagePromise, savePromise]);

            setVisionImage(generatedImgUrl);

            if (user && goalId) {
                // Update the saved goal with the generated image
                try {
                    await firestoreService.updateGoalImage(goalId, generatedImgUrl);
                } catch { /* non-critical */ }

                setPlanSaved(true);

                // Schedule reminders (non-blocking)
                scheduleMilestoneReminders(user.uid, goalId, generatedPlanResult).catch(() => { });
                showSuccess("Vision created! Reminders scheduled for your milestones.");
            }
        } catch (error) {
            setIsLoading(false);
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
                showError("API rate limit reached. Please wait a moment and try again.");
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                showError("Network error. Please check your connection and try again.");
            } else {
                showError(`Failed to generate plan: ${errorMessage}`);
            }
        }
    };

    // Auto-save effect when user logs in with an unsaved plan
    React.useEffect(() => {
        const autoSave = async () => {
            if (user && generatedPlan && !planSaved && !isLoading) {
                try {
                    await firestoreService.saveGoal(
                        user.uid,
                        generatedPlan,
                        visionImage,
                        user.displayName || 'Anonymous',
                        user.photoURL || undefined
                    );
                    setPlanSaved(true);
                    showSuccess("Vision saved to your profile!");
                } catch (error) {
                    console.error("Auto-save failed:", error);
                }
            }
        };
        autoSave();
    }, [user, generatedPlan, planSaved, isLoading, visionImage, showSuccess]);

    const handleWormhole = async () => {
        setIsLoading(true);
        setIsWormholeActive(true);
        setPlanSaved(false);

        try {
            // Step 1: Generate random plan (must complete before showing UI)
            const generatedPlanResult = await withRetry(
                () => geminiService.generatePlan("", "flexible", undefined, true),
                3,
                500
            );

            // Show plan immediately — don't wait for image
            setGeneratedPlan(generatedPlanResult);
            setIsLoading(false);
            setIsWormholeActive(false);

            // Step 2: Generate image in background (non-blocking)
            const includeProfilePhoto = userProfile?.preferences?.includeProfileInVisions && userProfile?.photoURL;
            const profilePhotoForVision = includeProfilePhoto ? userProfile.photoURL : undefined;

            const imagePromise = withRetry(
                () => geminiService.generateVisionImage(
                    generatedPlanResult.title,
                    generatedPlanResult.visionaryDescription,
                    profilePhotoForVision
                ),
                2,
                500
            ).catch((imgError) => {
                console.warn('Wormhole image generation failed:', imgError);
                return '';
            });

            // Step 3: Save to Firestore in parallel with image generation
            const savePromise = user
                ? firestoreService.saveGoal(
                    user.uid,
                    generatedPlanResult,
                    '',
                    user.displayName || 'Anonymous',
                    user.photoURL || undefined
                )
                : Promise.resolve(null);

            const [generatedImgUrl, goalId] = await Promise.all([imagePromise, savePromise]);

            setVisionImage(generatedImgUrl);

            if (user && goalId) {
                try {
                    await firestoreService.updateGoalImage(goalId, generatedImgUrl);
                } catch { /* non-critical */ }

                setPlanSaved(true);
                scheduleMilestoneReminders(user.uid, goalId, generatedPlanResult).catch(() => { });
                showSuccess("Wormhole vision created! Your cosmic journey awaits.");
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
                showError("The wormhole is overloaded. Please wait a moment and try again.");
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                showError("Lost connection to the cosmos. Please check your network.");
            } else {
                showError(`Wormhole malfunction: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
            setIsWormholeActive(false);
        }
    };

    const handleLogin = async () => {
        clearAuthError();
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login widget error:", error);
            // authError is already set by the context, no need to show toast
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                bounce: 0.4
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Onboarding Tour for first-time users */}
            <OnboardingTour />

            {/* Wormhole Animation Overlay — only for "Surprise Me" */}
            <WarpAnimation
                isActive={isWormholeActive}
                type="wormhole"
            />

            {/* Theme Background - Persistent */}
            <ThemeBackground className="z-0" />

            {generatedPlan ? (
                /* Plan Viewer View */
                <PlanViewer
                    plan={generatedPlan}
                    visionImage={visionImage}
                    onGoHome={() => setGeneratedPlan(null)}
                    onUpdatePlan={(newPlan) => setGeneratedPlan(newPlan)}
                    onUpdateVisionImage={(newUrl) => setVisionImage(newUrl)}
                />
            ) : (
                /* Landing Page Content */
                <>
                    {/* Header / Auth */}
                    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center bg-transparent">
                        <button
                            onClick={() => {
                                setHasStarted(false);
                                setGeneratedPlan(null);
                            }}
                            className="flex items-center gap-2 md:gap-3 group transition-all duration-300 !bg-transparent !border-none !p-0 !outline-none hover:opacity-80"
                        >
                            <img src="/images/galaxy-bubble-v2.png" alt="InVision logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            <span className="font-display tracking-tight leading-[0.9] italic text-white text-2xl md:text-[32px] font-black">InVision</span>
                        </button>

                        <div className="flex items-center gap-3 md:gap-14">
                            <ThemeQuickToggle />
                            {user ? (
                                <div className="flex items-center">
                                    {/* Nav links hidden on mobile */}
                                    <Link to="/dashboard" className="hidden md:inline text-sm font-semibold tracking-wide text-white hover:text-white/80 transition-colors whitespace-nowrap mr-7">
                                        My Visions
                                    </Link>
                                    <Link to="/community" className="hidden md:inline text-sm font-semibold tracking-wide text-white hover:text-white/80 transition-colors whitespace-nowrap mr-7">
                                        Community
                                    </Link>

                                    <div className="flex items-center gap-2 md:gap-3 md:pl-4 md:border-l border-white/10 md:ml-4">
                                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName || "User"}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`;
                                                    }}
                                                    className="w-9 h-9 md:w-8 md:h-8 rounded-full border border-white/10 ring-2 ring-brand-purple/20 object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-secondary flex items-center justify-center border border-white/10">
                                                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </Link>
                                        <button onClick={() => signOut()} className="btn btn--icon btn--ghost text-muted-foreground min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0" title="Sign Out">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-2 md:gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await signInAsGuest();
                                            } catch {
                                                showError("Demo access failed.");
                                            }
                                        }}
                                        className="btn btn--tertiary btn--sm min-h-[44px] md:min-h-0"
                                    >
                                        Try Demo
                                    </button>
                                    <button
                                        onClick={handleLogin}
                                        className="btn btn--secondary btn--sm md:btn--md min-h-[44px] md:min-h-0"
                                    >
                                        <span>Sign In</span>
                                    </button>
                                    {authError && (
                                        <div className="absolute top-full right-0 mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm min-w-[280px] z-50">
                                            <p className="text-red-200 text-sm mb-2">{authError}</p>
                                            <button
                                                onClick={async () => {
                                                    clearAuthError();
                                                    await signInAsGuest();
                                                }}
                                                className="text-sm text-white underline hover:text-red-200"
                                            >
                                                Continue with Demo Mode →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10">
                        <AnimatePresence mode="wait">
                            {!hasStarted ? (
                                <motion.div
                                    key="landing"
                                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="text-center max-w-4xl space-y-6 md:space-y-12 px-2"
                                >
                                    <div className="space-y-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-flex items-center gap-2"
                                        >
                                            <span className="relative flex h-2 w-2">
                                                <span
                                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                                    style={{ backgroundColor: currentTheme.colors.accent }}
                                                ></span>
                                                <span
                                                    className="relative inline-flex rounded-full h-2 w-2"
                                                    style={{ backgroundColor: currentTheme.colors.accent }}
                                                ></span>
                                            </span>
                                            <span className="text-xs font-medium tracking-wide uppercase text-white/80">Gemini 3 Powered</span>
                                        </motion.div>

                                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-display font-bold tracking-tight leading-[0.9]">
                                            <span className="block text-white">Bring your</span>
                                            <span
                                                className="block bg-clip-text text-transparent bg-gradient-to-r"
                                                style={{
                                                    backgroundImage: `linear-gradient(to right, ${currentTheme.colors.accent}, ${currentTheme.colors.primary})`
                                                }}
                                            >
                                                vision to life
                                            </span>
                                        </h1>
                                    </div>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light px-2"
                                    >
                                        Turn vague aspirations into <span className="text-white font-medium">crystal-clear plans</span>.
                                        Visualize your success with AI.
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <button
                                            onClick={() => setHasStarted(true)}
                                            className="btn btn--lg group relative overflow-hidden transition-all duration-300"
                                            style={{
                                                backgroundColor: currentTheme.colors.primary,
                                                color: '#ffffff',
                                                boxShadow: `0 0 20px -5px ${currentTheme.colors.primary}80`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = currentTheme.colors.accent;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
                                            }}
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]"></span>
                                            <span className="mr-2">Ready to Craft Your Vision?</span>
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="input"
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                    className="w-full max-w-3xl"
                                >
                                    <div className="relative w-full">
                                        <GoalInput onSubmit={handleGoalSubmit} onWormhole={handleWormhole} isLoading={isLoading}>
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                                className="space-y-4 mb-6"
                                            >
                                                <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-[1.1] text-white drop-shadow-lg">
                                                    {getTagline()}
                                                </motion.h2>
                                            </motion.div>
                                        </GoalInput>

                                        {/* Personalized Visions Indicator */}
                                        {userProfile?.preferences?.includeProfileInVisions && userProfile?.photoURL && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="flex items-center justify-center gap-2 mt-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">Personalized visions active</span>
                                                    <img
                                                        src={userProfile.photoURL}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full border border-white/10 ring-2 ring-brand-purple/20 object-cover shrink-0"
                                                        style={{ width: '32px', height: '32px' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </>
            )}
        </div>
    );
};
