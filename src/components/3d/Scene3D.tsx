
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Stars,
    Float,
    Html,
    Sphere,
    MeshDistortMaterial,
    Line,
    Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useTheme } from '@/contexts/ThemeContext';
import { type SavedGoal } from '@/lib/firestore';

// --- Types ---
interface Scene3DProps {
    goals: SavedGoal[];
    onGoalSelect: (goalId: string) => void;
}

// --- Constants ---
const ORBIT_RADIUS_BASE = 15;
const ORBIT_SPACING = 5;

// --- Components ---

// 1. Central Entity (Sun / Master Brain / World Tree)
const CentralEntity: React.FC = () => {
    const { currentTheme } = useTheme();
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
        }
        if (glowRef.current) {
            glowRef.current.rotation.z -= 0.001;
            // Pulsing effect
            const scale = 1 + Math.sin(state.clock.elapsedTime) * 0.05;
            glowRef.current.scale.set(scale, scale, scale);
        }
    });

    const { colors } = currentTheme;

    // Theme-specific geometry/material
    if (currentTheme.id === 'brain') {
        return (
            <group>
                {/* Brain Core */}
                <Sphere args={[4, 32, 32]} ref={meshRef}>
                    <MeshDistortMaterial
                        color={colors.primary}
                        emissive={colors.accent}
                        emissiveIntensity={0.5}
                        roughness={0.2}
                        metalness={0.8}
                        distort={0.4}
                        speed={2}
                    />
                </Sphere>
                {/* Neural Field Glow */}
                <Sphere args={[6, 32, 32]} ref={glowRef}>
                    <meshBasicMaterial color={colors.glow} transparent opacity={0.1} wireframe />
                </Sphere>
            </group>
        );
    }

    if (currentTheme.id === 'tree') {
        return (
            <group position={[0, -2, 0]}>
                {/* Ancient Tree Trunk */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[1.5, 2.5, 8, 8]} />
                    <meshStandardMaterial color="#4a3728" roughness={0.9} />
                </mesh>
                {/* Main Canopy */}
                <mesh position={[0, 4, 0]} ref={meshRef}>
                    <dodecahedronGeometry args={[5, 1]} />
                    <MeshDistortMaterial
                        color={colors.primary}
                        emissive={colors.secondary}
                        emissiveIntensity={0.2}
                        roughness={0.8}
                        distort={0.3}
                        speed={0.5}
                    />
                </mesh>
                {/* Secondary Canopy Layers */}
                <mesh position={[2, 3, 2]}>
                    <dodecahedronGeometry args={[3, 0]} />
                    <meshStandardMaterial color={colors.secondary} roughness={0.8} />
                </mesh>
                <mesh position={[-2, 2, -2]}>
                    <dodecahedronGeometry args={[2.5, 0]} />
                    <meshStandardMaterial color={colors.secondary} roughness={0.8} />
                </mesh>

                {/* Floating Spores/Fireflies */}
                <Sparkles count={40} scale={12} size={4} speed={0.4} opacity={0.5} color={colors.accent} />

                {/* Ground Glow */}
                <Sphere args={[8, 16, 16]} ref={glowRef} position={[0, -2, 0]}>
                    <meshStandardMaterial color={colors.accent} transparent opacity={0.1} wireframe />
                </Sphere>
            </group>
        );
    }

    // Default: Cosmic Sun
    return (
        <group>
            <Sphere args={[4, 64, 64]} ref={meshRef}>
                <meshStandardMaterial
                    color="#fdb813"
                    emissive="#ff8800"
                    emissiveIntensity={2}
                    roughness={0.4}
                />
            </Sphere>
            {/* Corona */}
            <Sphere args={[4.2, 32, 32]} ref={glowRef}>
                <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
            </Sphere>
            <pointLight intensity={500} distance={100} decay={2} color="#ffaa00" />
        </group>
    );
};

// 2. Individual Goal Entity (Planet / Node / Leaf)
const GoalEntity: React.FC<{
    goal: SavedGoal;
    index: number;
    total: number;
    onClick: () => void;
}> = ({ goal, index, total, onClick }) => {
    const { currentTheme } = useTheme();
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Calculate Orbit
    // Distribute spirally or concentrically? Let's use concentric for "Solar" feel
    const orbitIndex = index % 4; // 4 "lanes"
    const angleOffset = (index / total) * Math.PI * 2;
    const radius = ORBIT_RADIUS_BASE + (orbitIndex * ORBIT_SPACING);
    const speed = 0.2 / (orbitIndex + 1); // Inner planets faster

    useFrame((state) => {
        if (meshRef.current) {
            // Orbital motion
            const t = state.clock.elapsedTime * speed + angleOffset;
            meshRef.current.position.x = Math.cos(t) * radius;
            meshRef.current.position.z = Math.sin(t) * radius;

            // Self rotation
            meshRef.current.rotation.y += 0.01;

            // Hover scale
            const targetScale = hovered ? 1.5 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const color = useMemo(() => {
        // Deterministic color based on title length
        const hue = (goal.title.length * 37) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }, [goal.title]);

    // Progress texture/visual
    const progress = goal.plan?.timeline
        ? (goal.plan.timeline.filter(t => t.isCompleted).length / goal.plan.timeline.length)
        : 0;

    return (
        <group>
            <group
                ref={meshRef}
                onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
            >
                {currentTheme.id === 'brain' ? (
                    <group>
                        {/* Brain Node (Icosahedron) */}
                        <mesh>
                            <icosahedronGeometry args={[0.8 + (progress * 0.4), 1]} />
                            <meshStandardMaterial
                                color={hovered ? '#ffffff' : color}
                                roughness={0.6}
                                metalness={0.2}
                                emissive={color}
                                emissiveIntensity={hovered ? 0.5 : 0.1}
                            />
                        </mesh>
                    </group>
                ) : currentTheme.id === 'tree' ? (
                    // Floating Island Sapling
                    <group position={[0, 0.5, 0]}>
                        {/* Island Base */}
                        <mesh position={[0, -0.6, 0]}>
                            <cylinderGeometry args={[0.8, 0.2, 0.8, 6]} />
                            <meshStandardMaterial color="#5d4037" roughness={1} />
                        </mesh>
                        {/* Tree Trunk */}
                        <mesh position={[0, 0.2, 0]}>
                            <cylinderGeometry args={[0.15, 0.2, 1, 6]} />
                            <meshStandardMaterial color="#4a3728" />
                        </mesh>
                        {/* Foliage */}
                        <mesh position={[0, 1, 0]}>
                            <coneGeometry args={[0.8 + (progress * 0.3), 1.5, 6]} />
                            <meshStandardMaterial
                                color={hovered ? '#a7f3d0' : color}
                                roughness={0.8}
                                emissive={currentTheme.colors.accent}
                                emissiveIntensity={0.2}
                            />
                        </mesh>
                    </group>
                ) : (
                    // Planet (Sphere)
                    <mesh>
                        <sphereGeometry args={[1 + (progress * 0.5), 32, 32]} />
                        <meshStandardMaterial
                            color={hovered ? '#ffffff' : color}
                            roughness={0.6}
                            metalness={0.2}
                            emissive={color}
                            emissiveIntensity={hovered ? 0.5 : 0.1}
                        />
                    </mesh>
                )}

                {/* Floating Label */}
                {hovered && (
                    <Html position={[0, 2.5, 0]} center>
                        <div className="pointer-events-none px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 text-white whitespace-nowrap text-xs font-bold shadow-xl">
                            {goal.title}
                            <div className="text-[10px] text-white/60 font-medium mt-0.5">
                                {Math.round(progress * 100)}% Complete
                            </div>
                        </div>
                    </Html>
                )}
            </group>
        </group>
    );
};

// 3. Orbit Rings System
const OrbitRings: React.FC = () => {
    const { currentTheme } = useTheme();
    return (
        <group rotation={[Math.PI / 2, 0, 0]}>
            {Array.from({ length: 4 }).map((_, i) => (
                <Line
                    key={i}
                    points={new THREE.EllipseCurve(0, 0, ORBIT_RADIUS_BASE + i * ORBIT_SPACING, ORBIT_RADIUS_BASE + i * ORBIT_SPACING, 0, 2 * Math.PI, false, 0).getPoints(100)}
                    color={currentTheme.colors.accent}
                    opacity={0.15}
                    transparent
                    lineWidth={1}
                />
            ))}
        </group>
    );
};

// 4. Main Scene Wrapper
export const Scene3D: React.FC<Scene3DProps> = ({ goals, onGoalSelect }) => {
    const { currentTheme } = useTheme();

    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 20, 35], fov: 45 }}>
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />

                {/* Special Forest Lighting */}
                {currentTheme.id === 'tree' && (
                    <>
                        <fog attach="fog" args={['#051d08', 30, 90]} />
                        <spotLight position={[0, 50, 0]} angle={0.5} penumbra={1} intensity={2} color="#a7f3d0" />
                    </>
                )}

                {/* Background */}
                {currentTheme.id === 'brain' || currentTheme.id === 'tree' ? (
                    <color attach="background" args={[currentTheme.colors.background]} />
                ) : (
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                )}

                <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                    <CentralEntity />
                </Float>

                <OrbitRings />

                {goals.map((goal, index) => (
                    <GoalEntity
                        key={goal.id}
                        goal={goal}
                        index={index}
                        total={goals.length}
                        onClick={() => onGoalSelect(goal.id!)}
                    />
                ))}

                <OrbitControls
                    enablePan={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2}
                    minDistance={20}
                    maxDistance={80}
                />
            </Canvas>
        </div>
    );
};
