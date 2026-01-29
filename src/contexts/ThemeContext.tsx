import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    type ThemeConfig,
    type ThemeId,
    type CustomTheme,
    BUILT_IN_THEMES,
    DEFAULT_THEME,
    getThemeById,
    getThemeCSSVariables,
} from '@/lib/themes';

const THEME_STORAGE_KEY = 'invision-theme';
const CUSTOM_THEMES_STORAGE_KEY = 'invision-custom-themes';

interface ThemeContextType {
    currentTheme: ThemeConfig | CustomTheme;
    themeId: ThemeId | string;
    availableThemes: ThemeConfig[];
    customThemes: CustomTheme[];
    setTheme: (themeId: ThemeId | string) => void;
    addCustomTheme: (theme: Omit<CustomTheme, 'customId' | 'createdAt'>) => CustomTheme;
    updateCustomTheme: (customId: string, updates: Partial<CustomTheme>) => void;
    removeCustomTheme: (customId: string) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Apply CSS variables to document root
function applyThemeToDocument(theme: ThemeConfig | CustomTheme) {
    const root = document.documentElement;
    const variables = getThemeCSSVariables(theme);

    Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    // Set background color on body
    document.body.style.backgroundColor = theme.colors.background;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig | CustomTheme>(DEFAULT_THEME);
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load theme from localStorage on mount
    useEffect(() => {
        try {
            // Load custom themes
            const storedCustomThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
            if (storedCustomThemes) {
                const parsed = JSON.parse(storedCustomThemes) as CustomTheme[];
                setCustomThemes(parsed.map(t => ({
                    ...t,
                    createdAt: new Date(t.createdAt)
                })));
            }

            // Load selected theme
            const storedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
            if (storedThemeId) {
                // Check if it's a built-in theme
                const builtIn = getThemeById(storedThemeId as ThemeId);
                if (builtIn) {
                    setCurrentTheme(builtIn);
                } else {
                    // Check custom themes
                    const storedCustomThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
                    if (storedCustomThemes) {
                        const customs = JSON.parse(storedCustomThemes) as CustomTheme[];
                        const custom = customs.find(t => t.customId === storedThemeId);
                        if (custom) {
                            setCurrentTheme({
                                ...custom,
                                createdAt: new Date(custom.createdAt)
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading theme from storage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Apply theme CSS variables whenever theme changes
    useEffect(() => {
        if (!isLoading) {
            applyThemeToDocument(currentTheme);
        }
    }, [currentTheme, isLoading]);

    const setTheme = useCallback((themeId: ThemeId | string) => {
        // Check built-in themes first
        const builtIn = getThemeById(themeId as ThemeId);
        if (builtIn) {
            setCurrentTheme(builtIn);
            localStorage.setItem(THEME_STORAGE_KEY, themeId);
            return;
        }

        // Check custom themes
        const custom = customThemes.find(t => t.customId === themeId);
        if (custom) {
            setCurrentTheme(custom);
            localStorage.setItem(THEME_STORAGE_KEY, themeId);
        }
    }, [customThemes]);

    const addCustomTheme = useCallback((theme: Omit<CustomTheme, 'customId' | 'createdAt'>): CustomTheme => {
        const newTheme: CustomTheme = {
            ...theme,
            customId: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
        };

        setCustomThemes(prev => {
            const updated = [...prev, newTheme];
            localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        return newTheme;
    }, []);

    const removeCustomTheme = useCallback((customId: string) => {
        setCustomThemes(prev => {
            const updated = prev.filter(t => t.customId !== customId);
            localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        // If current theme was deleted, revert to default
        if (currentTheme.id === 'custom' && (currentTheme as CustomTheme).customId === customId) {
            setCurrentTheme(DEFAULT_THEME);
            localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME.id);
        }
    }, [currentTheme]);

    const updateCustomTheme = useCallback((customId: string, updates: Partial<CustomTheme>) => {
        setCustomThemes(prev => {
            const updated = prev.map(t => {
                if (t.customId !== customId) return t;
                return { ...t, ...updates };
            });
            localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        // If current theme is being updated, apply changes immediately
        if (currentTheme.id === 'custom' && (currentTheme as CustomTheme).customId === customId) {
            setCurrentTheme(prev => ({ ...prev, ...updates }));
        }
    }, [currentTheme]);

    const themeId = currentTheme.id === 'custom'
        ? (currentTheme as CustomTheme).customId
        : currentTheme.id;

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                themeId,
                availableThemes: BUILT_IN_THEMES,
                customThemes,
                setTheme,
                addCustomTheme,
                updateCustomTheme,
                removeCustomTheme,
                isLoading,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
