import { useMemo } from 'react';

interface GalaxyItem {
    id?: string;
    [key: string]: any;
}

interface GalaxyNode<T> {
    item: T;
    x: number;
    y: number;
    angle: number;
    radius: number;
    scale: number;
    index: number;
}

interface UseGalaxyEngineOptions {
    centerX?: number; // percentage 0-100
    centerY?: number; // percentage 0-100
    zoomLevel?: number;
    spreadFactor?: number; // How far apart nodes are
    spiralConstant?: number; // Controls the tightness of the spiral
}

/**
 * A shared hook for calculating Golden Spiral (Phyllotaxis) positions
 * Used by both CosmosMap (Personal) and CommunityFeed (Public)
 */
export const useGalaxyEngine = <T extends GalaxyItem>(
    items: T[],
    options: UseGalaxyEngineOptions = {}
) => {
    const {
        centerX = 50,
        centerY = 50,
        zoomLevel = 1,
        spreadFactor = 12,
        spiralConstant = 2.4 // Standard golden angle approximation factor
    } = options;

    const nodes = useMemo<GalaxyNode<T>[]>(() => {
        return items.map((item, index) => {
            // Golden angle for natural spiral distribution
            // Default is approx 2.4 (Golden Angle ~2.3999 radians)
            const angle = index * spiralConstant;

            // Radius grows with the square root of the index to maintain even density
            const radius = Math.sqrt(index + 1) * spreadFactor;

            return {
                item,
                index,
                angle,
                radius,
                // Calculate percentage-based coordinates for CSS positioning
                x: centerX + (Math.cos(angle) * radius) / zoomLevel,
                y: centerY + (Math.sin(angle) * radius) / zoomLevel,
                // Default scale, can be overridden by consumer
                scale: 1,
            };
        });
    }, [items, centerX, centerY, zoomLevel, spreadFactor]);

    return { nodes };
};
