// Theme System Types and Built-in Configurations

export type ThemeId = 'space' | 'brain' | 'tree' | 'custom';

export interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
}

export interface ThemeParticles {
    count: number;
    color: string;
    glowColor: string;
    sizes: [number, number, number]; // [small, medium, large]
    enabled?: boolean;
}

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    description: string;
    preview: string;
    colors: ThemeColors;
    particles: ThemeParticles;
}

export interface CustomTheme extends Omit<ThemeConfig, 'id'> {
    id: 'custom';
    customId: string; // Unique identifier for this custom theme
    backgroundImage?: string; // base64 or URL
    userId: string;
    createdAt: Date;
    isPublic?: boolean;
    likes?: number;
}

// Built-in Theme Configurations

export const SPACE_THEME: ThemeConfig = {
    id: 'space',
    name: 'Cosmic Voyage',
    description: 'Navigate through stars, nebulas, and cosmic dust',
    preview: '/themes/space-preview.jpg',
    colors: {
        background: '#0f0529',
        foreground: '#f3e8ff',
        primary: '#7c3aed',
        secondary: '#6366f1',
        accent: '#a855f7',
        glow: 'rgba(147, 51, 234, 0.5)',
    },
    particles: {
        count: 80,
        color: '#ffffff',
        glowColor: 'rgba(255, 255, 255, 0.6)',
        sizes: [3, 5, 8],
    },
};

export const BRAIN_THEME: ThemeConfig = {
    id: 'brain',
    name: 'Neural Network',
    description: 'Journey through neurons, dendrites, and synapses',
    preview: '/themes/brain-preview.jpg',
    colors: {
        background: '#1a0a2e',
        foreground: '#fce7f3',
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#00d4ff',
        glow: 'rgba(236, 72, 153, 0.5)',
    },
    particles: {
        count: 40,
        color: '#ff6b9d',
        glowColor: 'rgba(0, 212, 255, 0.6)',
        sizes: [6, 10, 16],
    },
};

export const TREE_THEME: ThemeConfig = {
    id: 'tree',
    name: 'Living Forest',
    description: 'Grow through roots, branches, and leaves',
    preview: '/themes/tree-preview.jpg',
    colors: {
        background: '#0a1f0a',
        foreground: '#ecfccb',
        primary: '#22c55e',
        secondary: '#84cc16',
        accent: '#ffd700',
        glow: 'rgba(34, 197, 94, 0.5)',
    },
    particles: {
        count: 60,
        color: '#50c878',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        sizes: [4, 8, 12],
    },
};

export const BUILT_IN_THEMES: ThemeConfig[] = [
    SPACE_THEME,
    BRAIN_THEME,
    TREE_THEME,
];

export const DEFAULT_THEME = SPACE_THEME;

// Helper to get theme by ID
export function getThemeById(id: ThemeId): ThemeConfig | undefined {
    return BUILT_IN_THEMES.find(theme => theme.id === id);
}

// Helper to create CSS variables from theme
export function getThemeCSSVariables(theme: ThemeConfig): Record<string, string> {
    return {
        '--theme-background': theme.colors.background,
        '--theme-foreground': theme.colors.foreground,
        '--theme-primary': theme.colors.primary,
        '--theme-secondary': theme.colors.secondary,
        '--theme-accent': theme.colors.accent,
        '--theme-glow': theme.colors.glow,
        '--theme-particle-color': theme.particles.color,
        '--theme-particle-glow': theme.particles.glowColor,
    };
}
