import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { motion, AnimatePresence } from "framer-motion";

interface TravelNode {
  city: string;
  country: string;
  location: [number, number]; // [lat, lng]
  category: string;
  lesson: string;
  description: string;
  image?: string;
}

interface Props {
  nodes: TravelNode[];
  labels: {
    close: string;
    lesson: string;
    context: string;
  };
}

export default function TravelGlobe({ nodes, labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeNode, setActiveNode] = useState<TravelNode | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const r = useRef(0);
  const phi = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 800 * 2,
      height: 800 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.05, 0.05, 0.08], // Deep midnight blue
      markerColor: [1, 0.84, 0], // Gold/Neon Yellow
      glowColor: [0.1, 0.15, 0.3], // Dark Blue Glow
      markers: nodes.map(n => ({ location: n.location, size: 0.1 })),
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phi.current += 0.005;
        }
        state.phi = phi.current + r.current;
      },
    });

    // Make canvas visible
    setTimeout(() => {
        if (canvasRef.current) canvasRef.current.style.opacity = '1';
    }, 100);

    return () => {
      globe.destroy();
    };
  }, [nodes]);

  const handleNodeClick = (node: TravelNode) => {
    setActiveNode(node);
  };

  return (
    <div className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden">
      
      {/* THE GLOBE */}
      <div className="relative z-0 w-full max-w-[800px] aspect-square">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-1000"
            style={{ opacity: 0 }}
            onPointerDown={(e) => {
              pointerInteracting.current =
                e.clientX - pointerInteractionMovement.current;
            }}
            onPointerUp={() => {
              pointerInteracting.current = null;
            }}
            onPointerOut={() => {
              pointerInteracting.current = null;
            }}
            onMouseMove={(e) => {
              if (pointerInteracting.current !== null) {
                const delta = e.clientX - pointerInteracting.current;
                pointerInteractionMovement.current = delta;
                r.current = delta / 200;
              }
            }}
          />
      </div>

      {/* FLOATING MARKERS LIST (Optional Overlay) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center gap-4">
        {nodes.map((node, i) => (
          <button
            key={i}
            onClick={() => handleNodeClick(node)}
            className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-xs font-bold text-white/70 hover:text-white hover:border-accent/50 hover:bg-accent/10 transition-all uppercase tracking-widest"
          >
            {node.city}
          </button>
        ))}
      </div>

      {/* FULL SCREEN MODAL */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12"
          >
            {/* Backdrop Blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
                onClick={() => setActiveNode(null)}
            ></div>

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveNode(null)}
                className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Content Panel */}
              <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-4 block">
                    {activeNode.category}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2">
                    {activeNode.city}
                  </h2>
                  <p className="text-xl text-white/40 font-medium">{activeNode.country}</p>
                </div>

                <div className="space-y-8">
                   <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-3">{labels.lesson}</h4>
                      <p className="text-2xl md:text-3xl font-serif italic text-white/90 leading-snug">
                        "{activeNode.lesson}"
                      </p>
                   </div>
                   
                   <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-3">{labels.context}</h4>
                      <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                        {activeNode.description}
                      </p>
                   </div>
                </div>
              </div>

              {/* Decorative Accent */}
              <div className="hidden md:block w-1/3 bg-gradient-to-br from-accent/20 to-purple-500/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 grayscale mix-blend-overlay">
                     <i className="fa-solid fa-earth-americas text-[200px]"></i>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
