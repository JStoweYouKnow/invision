import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Compass, Volume2, VolumeX } from 'lucide-react';
import { geminiService, type GeneratedPlan } from '@/lib/gemini';
import {
    getGuideGreeting,
    getGuideErrorResponse,
    type GuidePersonality,
} from '@/lib/guidePrompts';
import type { ChatSession } from '@google/generative-ai';
import type { GuideContext } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { firestoreService } from '@/lib/firestore';

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface TheGuideProps {
    goal?: string;
    plan?: GeneratedPlan;
    context?: GuideContext;
    personality?: GuidePersonality;
    onUpdatePlan?: (newPlan: GeneratedPlan) => void;
}

export const TheGuide: React.FC<TheGuideProps> = ({
    goal,
    plan,
    context,
    personality = 'encouraging',
    onUpdatePlan,
}) => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'guide'; text: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingPhrase] = useState('Consulting the stars...');

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Initial Greeting
    useEffect(() => {
        setMessages([{ role: 'guide', text: getGuideGreeting(personality, context) }]);
    }, [personality, context]);

    // Initialize Gemini Chat Session
    useEffect(() => {
        const initChat = async () => {
            if (goal || plan) {
                try {
                    const defaultPlan: GeneratedPlan = { title: '', description: '', timeline: [], sources: [] };
                    const session = await geminiService.startChat(goal || '', plan || defaultPlan);
                    setChatSession(session);
                } catch (err) {
                    console.error("Failed to start chat session", err);
                }
            }
        };
        initChat();
    }, [goal, plan]);


    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const speak = (text: string) => {
        if (!isVoiceEnabled) return;
        // Simple speech synthesis
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setInputValue('');

        // Optimistic update
        setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const planId = plan ? ((plan as GeneratedPlan & { id?: string }).id || plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()) : 'general';

        // Persist User Message
        if (user) {
            firestoreService.saveChatMessage(user.uid, planId, {
                senderId: user.uid,
                text: userMsg,
                createdAt: new Date(),
                role: 'user'
            }).catch(console.error);
        }

        try {
            if (chatSession) {
                const result = await chatSession.sendMessage(userMsg);
                let response = result.response.text();

                // Check for Plan Update Protocol
                if (response.includes('::PLAN_JSON_START::')) {
                    try {
                        const startMarker = '::PLAN_JSON_START::';
                        const endMarker = '::PLAN_JSON_END::';
                        const startIndex = response.indexOf(startMarker);
                        const endIndex = response.indexOf(endMarker);

                        if (endIndex > startIndex) {
                            const jsonStr = response.substring(startIndex + startMarker.length, endIndex).trim();
                            const newPlan = JSON.parse(jsonStr);

                            // Call the update callback
                            if (onUpdatePlan) {
                                onUpdatePlan(newPlan);
                                console.log("Plan updated via Guide:", newPlan);
                            }

                            // Clean the response for display
                            // We remove the JSON block but keep the text before (and after if any)
                            response = (response.substring(0, startIndex) + response.substring(endIndex + endMarker.length)).trim();
                        }
                    } catch (err) {
                        console.error("Failed to parse plan update from Guide:", err);
                    }
                }

                setMessages((prev) => [...prev, { role: 'guide', text: response }]);
                speak(response);

                // Persist Guide Message
                if (user) {
                    firestoreService.saveChatMessage(user.uid, planId, {
                        senderId: 'ai_guide',
                        text: response,
                        createdAt: new Date(),
                        role: 'model'
                    }).catch(console.error);
                }

            } else {
                // Fallback if session not ready
                setTimeout(() => {
                    const fallback = "I'm still aligning my star charts. Please try again in a moment.";
                    setMessages(prev => [...prev, { role: 'guide', text: fallback }]);
                    speak(fallback);
                }, 1000);
            }
        } catch (error) {
            console.error('Guide communication error', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'guide',
                    text: getGuideErrorResponse(personality),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Render using portal to avoid transform ancestor issues with fixed positioning
    return typeof document !== 'undefined' ? createPortal(
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                pointerEvents: 'none', // Allow clicks to pass through wrapper
            }}
        >
            <div style={{ pointerEvents: 'auto' }}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="mb-4 w-[360px] md:w-[420px] h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${hexToRgba(currentTheme.colors.background, 0.98)} 0%, ${hexToRgba(currentTheme.colors.background, 0.95)} 100%)`,
                                border: `1px solid ${hexToRgba(currentTheme.colors.primary, 0.3)}`,
                                boxShadow: `
                                0 0 40px ${hexToRgba(currentTheme.colors.primary, 0.2)},
                                0 20px 60px ${hexToRgba(currentTheme.colors.background, 0.8)}
                            `,
                            }}
                        >
                            {/* Header with aurora effect */}
                            <div
                                className="relative p-4 border-b border-white/10 flex justify-between items-center"
                                style={{
                                    background: `linear-gradient(90deg, ${hexToRgba(currentTheme.colors.primary, 0.15)} 0%, ${hexToRgba(currentTheme.colors.accent, 0.15)} 50%, ${hexToRgba(currentTheme.colors.primary, 0.15)} 100%)`,
                                }}
                            >
                                {/* Aurora animation */}
                                <motion.div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${hexToRgba(currentTheme.colors.primary, 0.3)}, ${hexToRgba(currentTheme.colors.accent, 0.3)}, transparent)`,
                                    }}
                                    animate={{ x: [-200, 200] }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        repeatType: 'reverse',
                                        ease: 'easeInOut',
                                    }}
                                />

                                <div className="flex items-center gap-3 relative z-10">
                                    {/* Guide avatar */}
                                    <motion.div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{
                                            background: `radial-gradient(circle, ${hexToRgba(currentTheme.colors.primary, 0.5)} 0%, ${hexToRgba(currentTheme.colors.secondary, 0.3)} 100%)`,
                                            boxShadow: `0 0 20px ${hexToRgba(currentTheme.colors.primary, 0.5)}`,
                                        }}
                                        animate={{
                                            boxShadow: [
                                                `0 0 20px ${hexToRgba(currentTheme.colors.primary, 0.5)}`,
                                                `0 0 30px ${hexToRgba(currentTheme.colors.primary, 0.7)}`,
                                                `0 0 20px ${hexToRgba(currentTheme.colors.primary, 0.5)}`,
                                            ],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <span className="text-lg">🌟</span>
                                    </motion.div>
                                    <div>
                                        <h3 className="font-outfit font-semibold text-white">
                                            Vision Guide
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 z-20">
                                    <button
                                        onClick={() => {
                                            if (isVoiceEnabled) window.speechSynthesis.cancel();
                                            setIsVoiceEnabled(!isVoiceEnabled);
                                        }}
                                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                        title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                                    >
                                        {isVoiceEnabled ? (
                                            <Volume2 className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
                                        ) : (
                                            <VolumeX className="w-5 h-5 text-white/50" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleToggle}
                                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white/80" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        {msg.role === 'guide' && (
                                            <div
                                                className="w-6 h-6 mr-2 flex-shrink-0 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: hexToRgba(currentTheme.colors.primary, 0.3) }}
                                            >
                                                <span className="text-xs">✦</span>
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                                ? 'bg-white/10 text-white rounded-br-sm'
                                                : 'guide-message rounded-bl-sm'
                                                }`}
                                            style={
                                                msg.role === 'guide'
                                                    ? {
                                                        background: `linear-gradient(135deg, ${hexToRgba(currentTheme.colors.secondary, 0.2)}, ${hexToRgba(currentTheme.colors.primary, 0.15)})`,
                                                        borderLeft: `3px solid ${currentTheme.colors.primary}`,
                                                        fontFamily: "'Outfit', sans-serif",
                                                        fontStyle: 'italic',
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Loading indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="w-6 h-6 mr-2 flex-shrink-0 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: hexToRgba(currentTheme.colors.primary, 0.3) }}>
                                            <motion.span
                                                className="text-xs"
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: 'linear',
                                                }}
                                            >
                                                ✦
                                            </motion.span>
                                        </div>
                                        <div
                                            className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${hexToRgba(currentTheme.colors.secondary, 0.2)}, ${hexToRgba(currentTheme.colors.primary, 0.15)})`,
                                                borderLeft: `3px solid ${currentTheme.colors.primary}`,
                                            }}
                                        >
                                            <motion.span
                                                className="italic font-outfit"
                                                style={{ color: currentTheme.colors.foreground }}
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                {loadingPhrase}
                                            </motion.span>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <form
                                onSubmit={handleSend}
                                className="p-4 border-t border-white/10 flex gap-3"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                <input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Speak to Vision Guide..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 transition-all"
                                    style={{
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        boxShadow: inputValue ? `0 0 0 1px ${hexToRgba(currentTheme.colors.primary, 0.3)}` : 'none',
                                    }}
                                />
                                <motion.button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-3 rounded-full disabled:opacity-30"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
                                        boxShadow: `0 0 20px ${hexToRgba(currentTheme.colors.primary, 0.4)}`,
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div style={{ pointerEvents: 'auto' }}>
                {/* Floating orb button */}
                <motion.button
                    onClick={handleToggle}
                    className="relative p-4 rounded-full shadow-lg flex items-center gap-2"
                    style={{
                        background: isOpen
                            ? hexToRgba(currentTheme.colors.primary, 0.3)
                            : `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
                        boxShadow: isOpen
                            ? 'none'
                            : `
                            0 0 30px ${hexToRgba(currentTheme.colors.primary, 0.5)},
                            0 10px 40px ${hexToRgba(currentTheme.colors.background, 0.6)}
                        `,
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                        !isOpen
                            ? {
                                boxShadow: [
                                    `0 0 30px ${hexToRgba(currentTheme.colors.primary, 0.5)}, 0 10px 40px ${hexToRgba(currentTheme.colors.background, 0.6)}`,
                                    `0 0 50px ${hexToRgba(currentTheme.colors.primary, 0.7)}, 0 10px 40px ${hexToRgba(currentTheme.colors.background, 0.6)}`,
                                    `0 0 30px ${hexToRgba(currentTheme.colors.primary, 0.5)}, 0 10px 40px ${hexToRgba(currentTheme.colors.background, 0.6)}`,
                                ],
                            }
                            : undefined
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-label="Summon The Guide"
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <>
                            <Compass className="w-6 h-6 text-white" />
                            <span className="font-outfit font-medium text-white">
                                Vision Guide
                            </span>
                        </>
                    )}

                    {/* Pulsing ring when collapsed */}
                    {!isOpen && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2"
                            style={{ borderColor: currentTheme.colors.primary }}
                            animate={{
                                scale: [1, 1.4],
                                opacity: [0.6, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeOut',
                            }}
                        />
                    )}
                </motion.button>
            </div>
        </div>,
        document.body
    ) : null;
};

export default TheGuide;
