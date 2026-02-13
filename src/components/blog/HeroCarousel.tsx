import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselItem {
    title: string;
    description: string;
    tag: string;
    meta: string;
    link: string;
    linkText: string;
}

interface Props {
    items: CarouselItem[];
    lang: 'da' | 'en' | 'de';
}

export default function HeroCarousel({ items, lang }: Props) {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 8000);
        return () => clearInterval(timer);
    }, [index]);

    const handleNext = () => {
        setDirection(1);
        setIndex((prev) => (prev + 1) % items.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    const item = items[index];

    return (
        <div className="relative w-full h-[320px] md:h-full min-h-[300px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-1">
            <div className="absolute inset-0 bg-[url('/assets/images/grid.svg')] opacity-10 pointer-events-none"></div>

            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={index}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.3 }
                    }}
                    className="absolute inset-0 p-8 flex flex-col justify-center"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-2 py-1 rounded bg-accent/20 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
                            {item.tag}
                        </span>
                        <span className="text-xs text-dim opacity-50 font-medium">{item.meta}</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight tracking-tight text-white drop-shadow-sm">
                        {item.title}
                    </h2>

                    <p className="text-dim text-lg leading-relaxed max-w-2xl mb-8 line-clamp-2 md:line-clamp-none opacity-80">
                        {item.description}
                    </p>

                    <a
                        href={item.link}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all w-fit shadow-lg shadow-accent/20"
                    >
                        {item.linkText}
                        <i className="fa-solid fa-arrow-right text-xs"></i>
                    </a>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-8 flex gap-2 z-20">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setDirection(i > index ? 1 : -1);
                            setIndex(i);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-accent w-6' : 'bg-white/20 hover:bg-white/40'}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Navigation Arrows */}
            <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-dim hover:bg-white/10 hover:text-white transition-all"
                >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-dim hover:bg-white/10 hover:text-white transition-all"
                >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    );
}
