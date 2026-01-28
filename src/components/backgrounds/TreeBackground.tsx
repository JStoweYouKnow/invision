import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface TreeBackgroundProps {
    className?: string;
}

interface Branch {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    depth: number;
}

// Seeded random number generator (pure function)
function createSeededRandom(seed: number) {
    let currentSeed = seed;
    return () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
    };
}

// Generate fractal tree branches with seeded random
function generateBranches(
    startX: number,
    startY: number,
    angle: number,
    length: number,
    thickness: number,
    depth: number,
    maxDepth: number,
    branches: Branch[],
    idPrefix: string,
    seededRandom: () => number
): void {
    if (depth > maxDepth || length < 2) return;

    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    branches.push({
        id: `${idPrefix}-${depth}-${branches.length}`,
        startX,
        startY,
        endX,
        endY,
        thickness,
        depth
    });

    // Branch out with some variation
    const branchCount = depth < 2 ? 3 : 2;
    const angleSpread = 0.5 + seededRandom() * 0.3;

    for (let i = 0; i < branchCount; i++) {
        const newAngle = angle + (i - (branchCount - 1) / 2) * angleSpread + (seededRandom() - 0.5) * 0.2;
        const newLength = length * (0.65 + seededRandom() * 0.15);
        const newThickness = thickness * 0.7;

        generateBranches(
            endX, endY,
            newAngle,
            newLength,
            newThickness,
            depth + 1,
            maxDepth,
            branches,
            idPrefix,
            seededRandom
        );
    }
}

// Generate a tree structure with seeded random
function generateTree(centerX: number, baseY: number, isRoot: boolean, seededRandom: () => number): Branch[] {
    const branches: Branch[] = [];
    const baseAngle = isRoot ? Math.PI / 2 : -Math.PI / 2; // Down for roots, up for branches
    const baseLength = isRoot ? 15 : 20;

    generateBranches(
        centerX, baseY,
        baseAngle,
        baseLength,
        isRoot ? 3 : 4,
        0,
        isRoot ? 4 : 5,
        branches,
        isRoot ? 'root' : 'branch',
        seededRandom
    );

    return branches;
}

export const TreeBackground: React.FC<TreeBackgroundProps> = ({ className = '' }) => {
    const { currentTheme } = useTheme();
    const { colors, particles } = currentTheme;

    // Generate stable tree structure
    const { branches, roots } = useMemo(() => {
        // Use seeded random for consistent results
        const branchRandom = createSeededRandom(12345);
        const rootRandom = createSeededRandom(54321);

        const branches = generateTree(50, 55, false, branchRandom);
        const roots = generateTree(50, 55, true, rootRandom);

        return { branches, roots };
    }, []);

    // Generate leaves
    const leaves = useMemo(() => {
        return [...Array(particles.count)].map((_, i) => ({
            id: i,
            x: (i * 17) % 100,
            y: (i * 23) % 100,
            size: 4 + (i % 3) * 2,
            rotation: (i * 37) % 360,
            delay: (i % 8) * 0.5,
        }));
    }, [particles.count]);

    return (
        <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
            style={{ backgroundColor: colors.background }}>

            {/* Forest glow */}
            <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-25"
                style={{ background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)` }} />
            <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-20"
                style={{ background: `radial-gradient(circle, ${colors.accent}30 0%, transparent 70%)` }} />

            {/* SVG for tree structure */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="branchGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="rootGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
                    </linearGradient>
                    <filter id="treeGlow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Roots */}
                {roots.map((root, i) => (
                    <motion.line
                        key={root.id}
                        x1={`${root.startX}%`}
                        y1={`${root.startY}%`}
                        x2={`${root.endX}%`}
                        y2={`${root.endY}%`}
                        stroke="url(#rootGradient)"
                        strokeWidth={root.thickness}
                        strokeLinecap="round"
                        filter="url(#treeGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.5 }}
                        transition={{
                            duration: 1.5,
                            delay: root.depth * 0.2 + i * 0.02,
                            ease: "easeOut"
                        }}
                    />
                ))}

                {/* Branches */}
                {branches.map((branch, i) => (
                    <motion.line
                        key={branch.id}
                        x1={`${branch.startX}%`}
                        y1={`${branch.startY}%`}
                        x2={`${branch.endX}%`}
                        y2={`${branch.endY}%`}
                        stroke="url(#branchGradient)"
                        strokeWidth={branch.thickness}
                        strokeLinecap="round"
                        filter="url(#treeGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.7 }}
                        transition={{
                            duration: 1.5,
                            delay: branch.depth * 0.2 + i * 0.02,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </svg>

            {/* Floating leaves */}
            {leaves.map((leaf) => (
                <motion.div
                    key={`leaf-${leaf.id}`}
                    className="absolute"
                    style={{
                        left: `${leaf.x}%`,
                        top: `${leaf.y}%`,
                        width: `${leaf.size}px`,
                        height: `${leaf.size}px`,
                    }}
                    animate={{
                        y: [0, 20, 0],
                        x: [0, 10, -5, 0],
                        rotate: [leaf.rotation, leaf.rotation + 30, leaf.rotation - 20, leaf.rotation],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 6 + (leaf.id % 4),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: leaf.delay
                    }}
                >
                    {/* Leaf shape */}
                    <svg viewBox="0 0 20 20" className="w-full h-full">
                        <path
                            d="M10 2 Q15 8 10 18 Q5 8 10 2"
                            fill={particles.color}
                            opacity="0.7"
                        />
                        <path
                            d="M10 4 L10 16"
                            stroke={colors.primary}
                            strokeWidth="0.5"
                            opacity="0.5"
                        />
                    </svg>
                </motion.div>
            ))}

            {/* Glowing particles (pollen/fireflies) */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={`glow-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${(i * 23) % 100}%`,
                        top: `${(i * 31) % 100}%`,
                        width: '4px',
                        height: '4px',
                        backgroundColor: colors.accent,
                        boxShadow: `0 0 8px 4px ${colors.accent}80`
                    }}
                    animate={{
                        y: [0, -40, 0],
                        x: [0, 15, -10, 0],
                        opacity: [0.2, 1, 0.2],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 5 + (i % 4),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.4
                    }}
                />
            ))}
        </div>
    );
};
