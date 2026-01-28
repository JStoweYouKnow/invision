import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SpaceBackground } from './SpaceBackground';
import { BrainBackground } from './BrainBackground';
import { TreeBackground } from './TreeBackground';
import { CustomBackground } from './CustomBackground';

interface ThemeBackgroundProps {
    className?: string;
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ className = '' }) => {
    const { currentTheme } = useTheme();

    switch (currentTheme.id) {
        case 'space':
            return <SpaceBackground className={className} />;
        case 'brain':
            return <BrainBackground className={className} />;
        case 'tree':
            return <TreeBackground className={className} />;
        case 'custom':
            return <CustomBackground className={className} />;
        default:
            return <SpaceBackground className={className} />;
    }
};

// Re-export individual backgrounds for direct use if needed
export { SpaceBackground } from './SpaceBackground';
export { BrainBackground } from './BrainBackground';
export { TreeBackground } from './TreeBackground';
export { CustomBackground } from './CustomBackground';
