import { State } from '../state.js';

export const Themes = {
    themes: {
        dark: {
            '--bg-primary': '#0a0a0a',
            '--bg-secondary': '#1a1a1a',
            '--surface': '#2a2a2a',
            '--surface-hover': '#3a3a3a',
            '--border': '#3a3a3a',
            '--text-primary': '#ffffff',
            '--text-secondary': '#a0a0a0'
        },
        light: {
            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f5f5f5',
            '--surface': '#ffffff',
            '--surface-hover': '#f0f0f0',
            '--border': '#e0e0e0',
            '--text-primary': '#000000',
            '--text-secondary': '#666666'
        },
        midnight: {
            '--bg-primary': '#0f1729',
            '--bg-secondary': '#1a2332',
            '--surface': '#243447',
            '--surface-hover': '#2d4158',
            '--border': '#2d4158',
            '--text-primary': '#e2e8f0',
            '--text-secondary': '#94a3b8'
        }
    },
    
    accentColors: [
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#10b981',
        '#ef4444',
        '#06b6d4'
    ],
    
    init() {
        this.applyTheme(State.theme);
        this.applyAccentColor(State.accentColor);
    },
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        
        State.setTheme(themeName);
    },
    
    applyAccentColor(color) {
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-hover', this.lightenColor(color, 20));
        State.setAccentColor(color);
    },
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    },
    
    getThemes() {
        return Object.keys(this.themes);
    },
    
    getAccentColors() {
        return this.accentColors;
    }
};
