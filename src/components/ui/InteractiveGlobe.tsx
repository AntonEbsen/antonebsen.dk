import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

export default function InteractiveGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0, // Centered roughly on Europe vertically
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.1, 0.1, 0.1],
            markerColor: [0.83, 0.69, 0.22], // #D4AF37 (Gold)
            glowColor: [0.2, 0.2, 0.2],
            markers: [
                // Copenhagen
                { location: [55.6761, 12.5683], size: 0.1 }
            ],
            onRender: (state) => {
                // Called on every animation frame.
                // `state` will be an empty object, return updated params.
                state.phi = phi;
                phi += 0.003; // Auto-rotation speed
            },
        });

        return () => {
            globe.destroy();
        };
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <canvas
                ref={canvasRef}
                style={{ width: 600, height: 600, maxWidth: '100%', aspectRatio: '1' }}
                className="opacity-80 hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-dim/50 uppercase tracking-widest pointer-events-none">
                Drag to rotate
            </div>
        </div>
    );
}
