import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

/**
 * Voice Input component using Web Speech API
 * Provides a microphone button with real-time visual feedback
 */
export const VoiceInput: React.FC<VoiceInputProps> = ({
    onTranscript,
    onListeningChange,
    disabled = false,
    className = '',
}) => {
    const { currentTheme } = useTheme();
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(() => {
        if (typeof window !== 'undefined') {
            return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        }
        return false;
    });

    const [interimTranscript, setInterimTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isSupported) {
            console.warn('Speech recognition not supported in this browser');
        }
    }, [isSupported]);

    // Audio level analyzer for visual feedback
    const startAudioAnalysis = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const updateLevel = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(average / 255);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (error) {
            console.warn('Could not start audio analysis:', error);
        }
    }, []);

    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setAudioLevel(0);
    }, []);

    // Initialize and handle speech recognition
    const startListening = useCallback(() => {
        if (!isSupported || disabled) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            onListeningChange?.(true);
            startAudioAnalysis();
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            onListeningChange?.(false);
            stopAudioAnalysis();
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimResult = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimResult += transcript;
                }
            }

            setInterimTranscript(interimResult);

            if (finalTranscript) {
                onTranscript(finalTranscript);
                setInterimTranscript('');
            }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setIsSupported(false);
            }
            setIsListening(false);
            stopAudioAnalysis();
        };

        recognitionRef.current.start();
    }, [isSupported, disabled, onTranscript, onListeningChange, startAudioAnalysis, stopAudioAnalysis]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        stopAudioAnalysis();
    }, [stopAudioAnalysis]);

    // Audio visualization loop
    const visualize = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isListening) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteTimeDomainData(dataArray);

            // Calculate instantaneous volume for glow effect
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += Math.abs(dataArray[i] - 128);
            }
            const average = sum / bufferLength;
            setAudioLevel(average / 128); // Normalize

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw waveform
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    }, [isListening]);

    useEffect(() => {
        if (isListening) {
            visualize();
        }
    }, [isListening, visualize]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            stopAudioAnalysis();
        };
    }, [stopAudioAnalysis]);

    if (!isSupported) {
        return null; // Don't render if not supported
    }

    return (
        <div className={`relative ${className}`}>
            <motion.button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={disabled}
                className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                style={{
                    backgroundColor: isListening ? '#ef4444' : currentTheme.colors.primary,
                    width: isListening ? '120px' : '44px',
                    height: '44px',
                    color: '#ffffff',
                    boxShadow: isListening
                        ? `0 0 ${20 + audioLevel * 20}px rgba(239, 68, 68, 0.6)`
                        : `0 4px 6px -1px ${currentTheme.colors.primary}4D`,
                }}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                layout // Animate layout changes
            >
                {/* Visualizer Canvas */}
                <canvas
                    ref={canvasRef}
                    width={120}
                    height={44}
                    className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Icon / Label */}
                <div className="relative z-10 flex items-center gap-2">
                    {isListening ? (
                        <div className="flex items-center gap-2 px-1">
                            <Square className="w-3 h-3 fill-current animate-pulse" />
                            <span className="text-xs font-medium whitespace-nowrap">Stop Recording</span>
                        </div>
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </div>
            </motion.button>

            {/* Interim transcript tooltip */}
            <AnimatePresence>
                {interimTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white text-sm min-w-48 max-w-64 text-center whitespace-pre-wrap shadow-xl z-50"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-center gap-2 text-brand-purple">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs font-medium uppercase tracking-wider">Listening...</span>
                            </div>
                            <span className="opacity-90 font-light italic">"{interimTranscript}"</span>
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceInput;
