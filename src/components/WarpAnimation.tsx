import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface WarpAnimationProps {
    isActive: boolean;
}

export const WarpAnimation: React.FC<WarpAnimationProps> = ({ isActive }) => {
    const requestRef = useRef<number | undefined>(undefined);
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

    // Loading messages that cycle
    const messages = useMemo(() => [
        "Traversing the cosmic unknown...",
        "Bending spacetime...",
        "Entering the wormhole...",
        "Discovering new possibilities...",
    ], []);

    const [messageIndex, setMessageIndex] = useState(0);

    // Callback ref - this gets called when the canvas is attached to the DOM
    const canvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
        // console.log("📍 Canvas callback ref called - canvas:", !!canvas);
        setCanvasElement(canvas);
    }, []);

    // Message cycling effect
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isActive, messages.length]);

    // WebGL Animation Effect - triggers when canvas element is available
    useEffect(() => {
        // console.log("🌀 WebGL effect triggered - isActive:", isActive, "canvas:", !!canvasElement);

        if (!isActive) {
            // console.log("❌ Not active, skipping WebGL setup");
            return;
        }

        if (!canvasElement) {
            // console.log("⏳ Canvas not available yet, waiting...");
            return;
        }

        // console.log("✅ Setting up WebGL...");
        const canvas = canvasElement;
        const gl = canvas.getContext("webgl");
        if (!gl) {
            console.error("❌ WebGL not supported");
            return;
        }
        // console.log("✅ WebGL context created");

        // Set dimensions
        const setDimensions = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            // console.log(`📏 Canvas resized to ${canvas.width}x${canvas.height}`);
        };
        setDimensions();
        window.addEventListener('resize', setDimensions);

        // Shader Sources
        const vertexShaderSrc = `
            attribute vec2 aPos;
            varying vec2 vUv;
            void main() {
                vUv = (aPos + 1.0) * 0.5;
                gl_Position = vec4(aPos, 0, 1);
            }
        `;

        const fragShaderSrc = `
            precision highp float;
            uniform float uTime;
            varying vec2 vUv;

            float rand(vec2 co) {
                return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
                vec2 uv = vUv * 2.0 - 1.0;
                float dist = length(uv);
                float angle = atan(uv.y, uv.x);

                float warp = (1.0 - dist) * 2.0;
                float t = uTime * 0.5;

                // spiraling motion
                float a = angle + t * 2.0;
                float s = sin(a * 10.0 + dist * 30.0);

                // star-like streaks
                float stars = step(0.98, rand(vec2(a * 5.0, dist * 40.0)));

                vec3 col = vec3(warp * 0.5 + s * 0.5, warp * 0.3, warp * 0.8);
                col += stars;

                // Add color cycling
                col = col * vec3(0.5 + 0.5 * sin(uTime), 0.3, 0.8);

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        // Shader Compilation
        function compileShader(type: number, source: string) {
            const s = gl!.createShader(type)!;
            gl!.shaderSource(s, source);
            gl!.compileShader(s);
            if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
                console.error("❌ Shader compile error:", gl!.getShaderInfoLog(s));
                return null;
            }
            return s;
        }

        const vertShader = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
        const fragShader = compileShader(gl.FRAGMENT_SHADER, fragShaderSrc);

        if (!vertShader || !fragShader) {
            console.error("❌ Failed to compile shaders");
            return;
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("❌ Program link error:", gl.getProgramInfoLog(program));
            return;
        }
        // console.log("✅ Shaders compiled and linked successfully");

        gl.useProgram(program);

        // Buffer Setup
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, "uTime");

        // Render Loop
        const render = (time: number) => {
            gl.uniform1f(timeLoc, time * 0.001);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Log first few frames to confirm rendering
            // if (frameCount < 3) {
            //     console.log(`🎨 Frame ${frameCount} rendered at time ${time.toFixed(2)}ms`);
            //     frameCount++;
            // }

            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);

        return () => {
            // console.log("🧹 Cleaning up WebGL resources");
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', setDimensions);
            gl.deleteProgram(program);
        };
    }, [isActive, canvasElement]);

    if (typeof document === 'undefined') {
        // console.log("❌ Document not available (SSR?)");
        return null;
    }
    if (!isActive) {
        // console.log("❌ WarpAnimation not active, returning null");
        return null;
    }

    // console.log("🚀 WarpAnimation RENDERING - creating portal to body");

    return createPortal(
        <div
            className="fixed inset-0 z-[2147483647] overflow-hidden bg-black"
        >
            <canvas
                ref={canvasCallbackRef}
                id="wormhole"
                className="absolute inset-0 w-full h-full block"
            />

            {/* Overlay Text */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIndex}
                        className="text-white/90 text-xl font-medium tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {messages[messageIndex]}
                    </motion.p>
                </AnimatePresence>

                {/* Pulsing Loading Indicators */}
                <div className="flex justify-center gap-3 mt-6">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1,
                                delay: i * 0.2,
                                repeat: Infinity,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
