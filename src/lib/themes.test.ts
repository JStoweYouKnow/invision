import { describe, it, expect } from 'vitest';
import {
    SPACE_THEME,
    BRAIN_THEME,
    TREE_THEME,
    BUILT_IN_THEMES,
    DEFAULT_THEME,
    getThemeById,
    getThemeCSSVariables,
} from './themes';
import type { ThemeConfig } from './themes';

describe('Theme System', () => {
    describe('Built-in Themes', () => {
        it('should have exactly 3 built-in themes', () => {
            expect(BUILT_IN_THEMES).toHaveLength(3);
        });

        it('should include space, brain, and tree themes', () => {
            const ids = BUILT_IN_THEMES.map(t => t.id);
            expect(ids).toContain('space');
            expect(ids).toContain('brain');
            expect(ids).toContain('tree');
        });

        it('should default to the space theme', () => {
            expect(DEFAULT_THEME.id).toBe('space');
        });

        it.each([
            ['space', SPACE_THEME],
            ['brain', BRAIN_THEME],
            ['tree', TREE_THEME],
        ] as const)('%s theme should have all required color fields', (_name, theme) => {
            expect(theme.colors.background).toBeTruthy();
            expect(theme.colors.foreground).toBeTruthy();
            expect(theme.colors.primary).toBeTruthy();
            expect(theme.colors.secondary).toBeTruthy();
            expect(theme.colors.accent).toBeTruthy();
            expect(theme.colors.glow).toBeTruthy();
        });

        it.each([
            ['space', SPACE_THEME],
            ['brain', BRAIN_THEME],
            ['tree', TREE_THEME],
        ] as const)('%s theme should have valid particle config', (_name, theme) => {
            expect(theme.particles.count).toBeGreaterThan(0);
            expect(theme.particles.color).toBeTruthy();
            expect(theme.particles.glowColor).toBeTruthy();
            expect(theme.particles.sizes).toHaveLength(3);
            // Sizes should be in ascending order
            expect(theme.particles.sizes[0]).toBeLessThan(theme.particles.sizes[1]);
            expect(theme.particles.sizes[1]).toBeLessThan(theme.particles.sizes[2]);
        });

        it.each([
            ['space', SPACE_THEME],
            ['brain', BRAIN_THEME],
            ['tree', TREE_THEME],
        ] as const)('%s theme should have name and description', (_name, theme) => {
            expect(theme.name.length).toBeGreaterThan(0);
            expect(theme.description.length).toBeGreaterThan(0);
        });
    });

    describe('getThemeById', () => {
        it('should return the space theme for "space"', () => {
            expect(getThemeById('space')).toBe(SPACE_THEME);
        });

        it('should return the brain theme for "brain"', () => {
            expect(getThemeById('brain')).toBe(BRAIN_THEME);
        });

        it('should return the tree theme for "tree"', () => {
            expect(getThemeById('tree')).toBe(TREE_THEME);
        });

        it('should return undefined for "custom"', () => {
            expect(getThemeById('custom')).toBeUndefined();
        });
    });

    describe('getThemeCSSVariables', () => {
        it('should return all expected CSS variable keys', () => {
            const vars = getThemeCSSVariables(SPACE_THEME);
            expect(vars).toHaveProperty('--theme-background');
            expect(vars).toHaveProperty('--theme-foreground');
            expect(vars).toHaveProperty('--theme-primary');
            expect(vars).toHaveProperty('--theme-secondary');
            expect(vars).toHaveProperty('--theme-accent');
            expect(vars).toHaveProperty('--theme-glow');
            expect(vars).toHaveProperty('--theme-particle-color');
            expect(vars).toHaveProperty('--theme-particle-glow');
        });

        it('should map theme colors to correct CSS variables', () => {
            const vars = getThemeCSSVariables(BRAIN_THEME);
            expect(vars['--theme-background']).toBe(BRAIN_THEME.colors.background);
            expect(vars['--theme-primary']).toBe(BRAIN_THEME.colors.primary);
            expect(vars['--theme-particle-color']).toBe(BRAIN_THEME.particles.color);
        });

        it('should produce different variables for different themes', () => {
            const spaceVars = getThemeCSSVariables(SPACE_THEME);
            const treeVars = getThemeCSSVariables(TREE_THEME);
            expect(spaceVars['--theme-background']).not.toBe(treeVars['--theme-background']);
            expect(spaceVars['--theme-primary']).not.toBe(treeVars['--theme-primary']);
        });

        it('should work with a custom theme config', () => {
            const custom: ThemeConfig = {
                id: 'space',
                name: 'Test',
                description: 'Test theme',
                preview: '',
                colors: {
                    background: '#000',
                    foreground: '#fff',
                    primary: '#f00',
                    secondary: '#0f0',
                    accent: '#00f',
                    glow: 'rgba(0,0,0,0.5)',
                },
                particles: { count: 10, color: '#fff', glowColor: '#fff', sizes: [1, 2, 3] },
            };
            const vars = getThemeCSSVariables(custom);
            expect(vars['--theme-background']).toBe('#000');
            expect(vars['--theme-primary']).toBe('#f00');
        });
    });
});
