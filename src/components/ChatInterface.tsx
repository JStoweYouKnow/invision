import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, ChevronDown } from 'lucide-react';
import { geminiService, type GeneratedPlan } from '@/lib/gemini';
import type { ChatSession } from '@google/generative-ai';

interface ChatInterfaceProps {
    goal: string;
    plan: GeneratedPlan;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ goal, plan }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initialize chat session when opening for the first time
    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!chatSession && !isOpen) {
            setIsLoading(true);
            try {
                const session = await geminiService.startChat(goal, plan);
                setChatSession(session);
                setMessages([
                    { role: 'model', text: "I'm your AI coach. How can I help you refine this plan?" }
                ]);
            } catch (error) {
                console.error("Failed to start chat", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chatSession) return;

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const result = await chatSession.sendMessage(userMsg);
            const response = result.response.text();
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex-1" />
                            <h3 className="font-display font-bold text-slate-900">Chat with Coach</h3>
                            <div className="flex-1 flex justify-end">
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-brand-purple text-white'
                                            : 'bg-white text-slate-900 border border-slate-200'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-sm text-slate-500 animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask a follow-up question..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="p-2 bg-brand-purple text-white rounded-full hover:bg-brand-purple/90 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className={`p-4 rounded-full shadow-lg flex items-center gap-2 transition-colors ${isOpen ? 'bg-secondary text-foreground' : 'bg-white text-black'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                {!isOpen && <span className="font-medium">Chat Assistant</span>}
            </motion.button>
        </div>
    );
};
