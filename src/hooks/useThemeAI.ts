import { useState, useCallback } from 'react';
import { geminiService, type GeneratedTheme } from '@/lib/gemini';
import { useToast } from '@/contexts/ToastContext';

interface UseThemeAIResult {
    isGenerating: boolean;
    generateTheme: (prompt: string) => Promise<GeneratedTheme | null>;
    error: string | null;
}

export const useThemeAI = (): UseThemeAIResult => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showError } = useToast();

    const generateTheme = useCallback(async (prompt: string): Promise<GeneratedTheme | null> => {
        setIsGenerating(true);
        setError(null);

        try {
            const theme = await geminiService.createThemeFromPrompt(prompt);
            return theme;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate theme';
            setError(errorMessage);
            showError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [showError]);

    return {
        isGenerating,
        generateTheme,
        error
    };
};
