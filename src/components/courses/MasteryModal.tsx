import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MasteryModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: {
        title: string;
        tag: string;
        description: string;
        syllabus?: string[];
        learningOutcomes?: string[];
        competencies?: string[];
        verifiedSkills?: string[];
        grade?: string;
        ects?: string;
        institution?: string;
    };
    lang: 'da' | 'en';
}

const MasteryModal: React.FC<{ lang: 'da' | 'en' }> = ({ lang }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [course, setCourse] = React.useState<any>(null);
    const isDa = lang === 'da';

    React.useEffect(() => {
        const handleOpen = (e: any) => {
            setCourse(e.detail.course);
            setIsOpen(true);
        };
        window.addEventListener('open-mastery-modal', handleOpen);
        return () => window.removeEventListener('open-mastery-modal', handleOpen);
    }, []);

    const onClose = () => setIsOpen(false);

    if (!course) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                            >
                                <i className="fa-solid fa-xmark text-white/40"></i>
                            </button>

                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/20">
                                    {course.tag}
                                </span>
                                <span className="text-white/40 text-[10px] uppercase font-mono tracking-widest">
                                    {course.institution} • {course.ects} ECTS
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight pr-12">
                                {course.title}
                            </h2>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-10">
                                {/* Description */}
                                <section>
                                    <p className="text-white/60 leading-relaxed italic border-l-2 border-accent/30 pl-6 py-1">
                                        "{course.description}"
                                    </p>
                                </section>

                                {/* Syllabus */}
                                {course.syllabus && course.syllabus.length > 0 && (
                                    <section>
                                        <h3 className="text-accent text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-layer-group opacity-50"></i>
                                            {isDa ? 'Pensum & Teknikker' : 'Syllabus & Techniques'}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {course.syllabus.map((item: string, i: number) => (
                                                <div key={i} className="flex gap-3 text-sm text-white/70 group">
                                                    <span className="text-accent font-mono">0{i + 1}</span>
                                                    <span className="group-hover:text-white transition-colors">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Learning Outcomes */}
                                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                                    <section>
                                        <h3 className="text-accent text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-bullseye opacity-50"></i>
                                            {isDa ? 'Læringsmål (Knowledge)' : 'Learning Outcomes'}
                                        </h3>
                                        <ul className="space-y-3">
                                            {course.learningOutcomes.map((item: string, i: number) => (
                                                <li key={i} className="flex gap-3 text-sm text-white/70">
                                                    <i className="fa-solid fa-check text-accent mt-1 text-[10px]"></i>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Competencies */}
                                {course.competencies && course.competencies.length > 0 && (
                                    <section>
                                        <h3 className="text-accent text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-graduation-cap opacity-50"></i>
                                            {isDa ? 'Kompetencer (Applied Skills)' : 'Competencies'}
                                        </h3>
                                        <ul className="space-y-3">
                                            {course.competencies.map((item: string, i: number) => (
                                                <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-accent/20 transition-all">
                                                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                        <i className="fa-solid fa-bolt text-accent text-[12px]"></i>
                                                    </div>
                                                    <p className="text-sm text-white/80 group-hover:text-white transition-colors">
                                                        {item}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                {course.verifiedSkills?.map((s: string) => (
                                    <span key={s} className="text-[10px] font-mono text-white/30 px-2 py-1 rounded border border-white/5">
                                        #{s.replace(/\s+/g, '')}
                                    </span>
                                ))}
                            </div>
                            <div className="text-right">
                                <span className="text-white/40 text-[10px] block uppercase font-mono tracking-widest">{isDa ? 'Karakter' : 'Grade'}</span>
                                <span className="text-2xl font-black text-accent">{course.grade}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MasteryModal;
