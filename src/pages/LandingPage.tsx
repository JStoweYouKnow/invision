import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { GoalInput } from '@/components/GoalInput';
import { PlanViewer } from '@/components/PlanViewer';
import { geminiService, type GeneratedPlan } from '@/lib/gemini';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { firestoreService } from '@/lib/firestore';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
import { ThemeBackground } from '@/components/backgrounds';
import { useTheme } from '@/contexts/ThemeContext';



export const LandingPage: React.FC = () => {
    const { user, signInWithGoogle, signInAsGuest, signOut } = useAuth();
    const { showError, showSuccess } = useToast();
    const { currentTheme } = useTheme(); // Get theme
    const [hasStarted, setHasStarted] = useState(false);

    // ... (rest of state)

    // Dynamic Tagline
    const getTagline = () => {
        switch (currentTheme.id) {
            case 'brain': return "Grow a new neural pathway.";
            case 'tree': return "Seed a new interest.";
            default: return "Shoot for the moon and hit the stars.";
        }
    };


    const [isLoading, setIsLoading] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
    const [visionImage, setVisionImage] = useState<string>('');
    const [planSaved, setPlanSaved] = useState(false);



    const handleGoalSubmit = async (goal: string, timeline: string, image?: File) => {
        setIsLoading(true);
        setPlanSaved(false); // Reset saved state for new goal
        try {
            // Generate plan first, then use the visionary description for better image quality
            const generatedPlanResult = await geminiService.generatePlan(goal, timeline, image);
            const generatedImgUrl = await geminiService.generateVisionImage(goal, generatedPlanResult.visionaryDescription);

            setGeneratedPlan(generatedPlanResult);
            setVisionImage(generatedImgUrl);

            // Auto-save if logged in
            if (user) {
                await firestoreService.saveGoal(
                    user.uid,
                    generatedPlanResult,
                    generatedImgUrl,
                    user.displayName || 'Anonymous',
                    user.photoURL || undefined
                );
                setPlanSaved(true);
            }
        } catch (error) {
            showError(`Failed to generate plan: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
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
        setPlanSaved(false);

        try {
            // Generate random plan (empty string + random=true)
            const generatedPlanResult = await geminiService.generatePlan("", "flexible", undefined, true);
            const generatedImgUrl = await geminiService.generateVisionImage(generatedPlanResult.title, generatedPlanResult.visionaryDescription);

            setGeneratedPlan(generatedPlanResult);
            setVisionImage(generatedImgUrl);

            // Auto-save if logged in
            if (user) {
                await firestoreService.saveGoal(
                    user.uid,
                    generatedPlanResult,
                    generatedImgUrl,
                    user.displayName || 'Anonymous',
                    user.photoURL || undefined
                );
                setPlanSaved(true);
            }
        } catch (error) {
            showError(`Failed to generate random vision: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login widget error:", error);
            showError(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
            {/* Theme Background - Persistent */}
            <ThemeBackground className="z-0" />

            {generatedPlan ? (
                /* Plan Viewer View */
                <PlanViewer
                    plan={generatedPlan}
                    visionImage={visionImage}
                    onGoHome={() => setGeneratedPlan(null)}
                    onUpdatePlan={(newPlan) => setGeneratedPlan(newPlan)}
                />
            ) : (
                /* Landing Page Content */
                <>
                    {/* Header / Auth */}
                    <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-transparent">
                        <button
                            onClick={() => {
                                setHasStarted(false);
                                setGeneratedPlan(null);
                            }}
                            className="flex items-center gap-3 group transition-all duration-300 !bg-transparent !border-none !p-0 !outline-none hover:opacity-80"
                        >
                            <div className="relative flex items-center justify-center">
                                <img src="/images/galaxy-bubble-v2.png" alt="InVision logo" className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ width: '48px', height: '48px' }} />
                            </div>
                            <span className="font-display tracking-tight leading-[0.9] italic" style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>InVision</span>
                        </button>

                        <div className="flex items-center gap-14">
                            <ThemeQuickToggle />
                            {user ? (
                                <div className="flex items-center">
                                    <Link to="/dashboard" className="text-sm font-semibold tracking-wide text-white hover:text-white/80 transition-colors whitespace-nowrap" style={{ color: '#ffffff', marginRight: '28px' }}>
                                        My Visions
                                    </Link>
                                    <Link to="/community" className="text-sm font-semibold tracking-wide text-white hover:text-white/80 transition-colors whitespace-nowrap" style={{ color: '#ffffff', marginRight: '28px' }}>
                                        Community
                                    </Link>

                                    <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-4">
                                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName || "User"}
                                                    className="w-8 h-8 rounded-full border border-white/10 ring-2 ring-brand-purple/20 object-cover shrink-0"
                                                    style={{ width: '32px', height: '32px' }}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-white/10">
                                                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </Link>
                                        <button onClick={() => signOut()} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white" title="Sign Out">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await signInAsGuest();
                                            } catch {
                                                showError("Demo access failed.");
                                            }
                                        }}
                                        className="text-white/70 hover:text-white font-medium text-sm transition-colors px-4 py-2 hover:bg-white/5 rounded-full"
                                    >
                                        Try Demo
                                    </button>
                                    <button
                                        onClick={handleLogin}
                                        className="flex items-center justify-center rounded-full font-bold transition-all duration-300 hover:opacity-90 border-2 border-white/30 hover:border-white/50 hover:shadow-lg hover:shadow-brand-purple/30"
                                        style={{ color: '#ffffff', backgroundColor: 'transparent', padding: '10px 24px', fontSize: '18px' }}
                                    >
                                        <span>Sign In</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                        <AnimatePresence mode="wait">
                            {!hasStarted ? (
                                <motion.div
                                    key="landing"
                                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="text-center max-w-4xl space-y-12"
                                >
                                    <div className="space-y-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
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

                                        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight leading-[0.9]">
                                            <span className="block text-white">Welcome to your</span>
                                            <span
                                                className="block bg-clip-text text-transparent bg-gradient-to-r"
                                                style={{
                                                    backgroundImage: `linear-gradient(to right, ${currentTheme.colors.accent}, ${currentTheme.colors.primary})`
                                                }}
                                            >
                                                AI-powered vision board
                                            </span>
                                        </h1>
                                    </div>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
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
                                            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium transition-all rounded-full hover:opacity-90 shadow-lg overflow-hidden"
                                            style={{
                                                backgroundColor: currentTheme.colors.primary,
                                                color: '#ffffff',
                                                boxShadow: `0 10px 30px -10px ${currentTheme.colors.primary}66`
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
