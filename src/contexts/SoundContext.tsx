import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeContext';

interface SoundContextType {
    isEnabled: boolean;
    toggleSound: () => void;
    volume: number;
    setVolume: (val: number) => void;
    playHover: () => void;
    playClick: () => void;
    playSuccess: () => void;
    playWarp: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isEnabled, setIsEnabled] = useState(false); // Default off for UX, user must enable
    const [volume, setVolume] = useState(0.5);
    const { currentTheme } = useTheme();

    const audioCtxRef = useRef<AudioContext | null>(null);
    const ambientGainRef = useRef<GainNode | null>(null);
    const ambientOscillatorsRef = useRef<OscillatorNode[]>([]);
    const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Initialize Audio Context on user interaction (required by browsers)
    useEffect(() => {
        // initAudio removed as it was unused. toggleSound handles initialization.
    }, []);

    // --- Sound Generation Functions ---

    const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        if (!isEnabled || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol * volume, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    const playHover = () => {
        // High, ethereal ping
        playTone(800 + Math.random() * 200, 'sine', 0.3, 0.05);
    };

    const playClick = () => {
        // Soft blip
        playTone(400, 'triangle', 0.1, 0.05);
    };

    const playSuccess = () => {
        // Major chord arpeggio
        if (!isEnabled || !audioCtxRef.current) return;
        // Removed unused 'now'
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'sine', 0.5, 0.1), i * 100);
        });
    };

    const playWarp = () => {
        // Whoosh effect - noise or sweep
        if (!isEnabled || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1 * volume, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    };

    // --- Ambient Sound Loop Management ---

    const stopAmbience = () => {
        ambientOscillatorsRef.current.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        ambientOscillatorsRef.current = [];

        if (noiseNodeRef.current) {
            try { noiseNodeRef.current.stop(); } catch (e) { }
            noiseNodeRef.current = null;
        }
    };

    const startAmbience = () => {
        if (!isEnabled || !audioCtxRef.current) return;
        stopAmbience();

        const ctx = audioCtxRef.current;
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.05 * volume; // Low background volume
        masterGain.connect(ctx.destination);
        ambientGainRef.current = masterGain;

        if (currentTheme.id === 'space' || currentTheme.id === 'custom') {
            // Space Drone: Low frequency sines
            [60, 65].forEach(freq => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(masterGain);
                osc.start();
                ambientOscillatorsRef.current.push(osc);
            });
        } else if (currentTheme.id === 'brain') {
            // Binaural Beats: Two slightly offset frequencies
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.value = 200;
            osc2.frequency.value = 205; // 5Hz beat

            // Pan them left/right if possible, but standard mono mix works for beat effect too
            osc1.connect(masterGain);
            osc2.connect(masterGain);
            osc1.start();
            osc2.start();
            ambientOscillatorsRef.current.push(osc1, osc2);
        } else if (currentTheme.id === 'tree') {
            // Forest Wind: Pink noise
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            noise.connect(masterGain);
            noise.start();
            noiseNodeRef.current = noise;
        }
    };

    // Respond to Theme Change
    useEffect(() => {
        if (isEnabled) {
            startAmbience();
        }
        return () => stopAmbience();
    }, [currentTheme.id, isEnabled, volume]);


    const toggleSound = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }

        // Resume if suspended (common browser policy)
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        setIsEnabled(prev => !prev);
    };

    return (
        <SoundContext.Provider value={{
            isEnabled, toggleSound, volume, setVolume,
            playHover, playClick, playSuccess, playWarp
        }}>
            {children}
        </SoundContext.Provider>
    );
};
