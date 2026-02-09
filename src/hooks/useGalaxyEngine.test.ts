import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGalaxyEngine } from './useGalaxyEngine';

interface TestItem {
    id: string;
    name: string;
}

describe('useGalaxyEngine', () => {
    const makeItems = (count: number): TestItem[] =>
        Array.from({ length: count }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}` }));

    describe('basic positioning', () => {
        it('should return empty nodes for empty items', () => {
            const { result } = renderHook(() => useGalaxyEngine([]));
            expect(result.current.nodes).toHaveLength(0);
        });

        it('should return one node for one item', () => {
            const items = makeItems(1);
            const { result } = renderHook(() => useGalaxyEngine(items));
            expect(result.current.nodes).toHaveLength(1);
            expect(result.current.nodes[0].item).toBe(items[0]);
            expect(result.current.nodes[0].index).toBe(0);
        });

        it('should return correct number of nodes', () => {
            const items = makeItems(10);
            const { result } = renderHook(() => useGalaxyEngine(items));
            expect(result.current.nodes).toHaveLength(10);
        });

        it('should preserve item references in nodes', () => {
            const items = makeItems(3);
            const { result } = renderHook(() => useGalaxyEngine(items));
            result.current.nodes.forEach((node, i) => {
                expect(node.item).toBe(items[i]);
                expect(node.index).toBe(i);
            });
        });
    });

    describe('Golden Spiral math', () => {
        it('should place first node near center', () => {
            const items = makeItems(1);
            const { result } = renderHook(() => useGalaxyEngine(items, { centerX: 50, centerY: 50 }));
            const node = result.current.nodes[0];
            // First node should be within a reasonable distance from center
            expect(Math.abs(node.x - 50)).toBeLessThan(20);
            expect(Math.abs(node.y - 50)).toBeLessThan(20);
        });

        it('should spread nodes further from center as index increases', () => {
            const items = makeItems(5);
            const { result } = renderHook(() => useGalaxyEngine(items, { centerX: 50, centerY: 50 }));
            const nodes = result.current.nodes;

            // Distance from center should generally increase
            const distances = nodes.map(n =>
                Math.sqrt((n.x - 50) ** 2 + (n.y - 50) ** 2)
            );

            // Last node should be further than first node
            expect(distances[distances.length - 1]).toBeGreaterThan(distances[0]);
        });

        it('should produce unique positions for each node', () => {
            const items = makeItems(8);
            const { result } = renderHook(() => useGalaxyEngine(items));
            const positions = result.current.nodes.map(n => `${n.x.toFixed(4)},${n.y.toFixed(4)}`);
            const uniquePositions = new Set(positions);
            expect(uniquePositions.size).toBe(8);
        });
    });

    describe('options', () => {
        it('should respect custom center position', () => {
            const items = makeItems(1);
            const { result } = renderHook(() =>
                useGalaxyEngine(items, { centerX: 20, centerY: 80 })
            );
            const node = result.current.nodes[0];
            // First node should be near the custom center
            expect(Math.abs(node.x - 20)).toBeLessThan(20);
            expect(Math.abs(node.y - 80)).toBeLessThan(20);
        });

        it('should use spreadFactor to control node spacing', () => {
            const items = makeItems(5);
            const { result: tight } = renderHook(() =>
                useGalaxyEngine(items, { centerX: 50, centerY: 50, spreadFactor: 5 })
            );
            const { result: wide } = renderHook(() =>
                useGalaxyEngine(items, { centerX: 50, centerY: 50, spreadFactor: 20 })
            );

            // Wide spread should have larger max distance from center
            const maxDistTight = Math.max(...tight.current.nodes.map(n =>
                Math.sqrt((n.x - 50) ** 2 + (n.y - 50) ** 2)
            ));
            const maxDistWide = Math.max(...wide.current.nodes.map(n =>
                Math.sqrt((n.x - 50) ** 2 + (n.y - 50) ** 2)
            ));
            expect(maxDistWide).toBeGreaterThan(maxDistTight);
        });

        it('should use zoomLevel to compress positions toward center', () => {
            const items = makeItems(5);
            const { result: zoomed } = renderHook(() =>
                useGalaxyEngine(items, { centerX: 50, centerY: 50, zoomLevel: 2 })
            );
            const { result: normal } = renderHook(() =>
                useGalaxyEngine(items, { centerX: 50, centerY: 50, zoomLevel: 1 })
            );

            // Higher zoom should pull nodes closer to center
            const maxDistZoomed = Math.max(...zoomed.current.nodes.map(n =>
                Math.sqrt((n.x - 50) ** 2 + (n.y - 50) ** 2)
            ));
            const maxDistNormal = Math.max(...normal.current.nodes.map(n =>
                Math.sqrt((n.x - 50) ** 2 + (n.y - 50) ** 2)
            ));
            expect(maxDistZoomed).toBeLessThan(maxDistNormal);
        });
    });

    describe('node properties', () => {
        it('should set default scale to 1', () => {
            const items = makeItems(3);
            const { result } = renderHook(() => useGalaxyEngine(items));
            result.current.nodes.forEach(node => {
                expect(node.scale).toBe(1);
            });
        });

        it('should include angle and radius for each node', () => {
            const items = makeItems(3);
            const { result } = renderHook(() => useGalaxyEngine(items));
            result.current.nodes.forEach(node => {
                expect(typeof node.angle).toBe('number');
                expect(typeof node.radius).toBe('number');
                expect(node.radius).toBeGreaterThan(0);
            });
        });
    });
});
