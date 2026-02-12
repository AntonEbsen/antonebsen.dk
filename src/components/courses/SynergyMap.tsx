import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProjectLink {
    title: string;
    href: string;
}

interface Course {
    title: string;
    tag: string;
    relatedProjects?: ProjectLink[];
}

interface SynergyMapProps {
    courses: Course[];
    lang: 'da' | 'en';
}

const SynergyMap: React.FC<SynergyMapProps> = ({ courses, lang }) => {
    const [hoveredNode, setHoveredNode] = useState<{ type: 'course' | 'project'; id: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Process Data
    const synergyData = useMemo(() => {
        const relevantCourses = courses.filter(c => c.relatedProjects && c.relatedProjects.length > 0);
        const projectsMap = new Map<string, ProjectLink>();

        relevantCourses.forEach(c => {
            c.relatedProjects?.forEach(p => {
                projectsMap.set(p.title, p);
            });
        });

        const uniqueProjects = Array.from(projectsMap.values());
        return { relevantCourses, uniqueProjects };
    }, [courses]);

    const { relevantCourses, uniqueProjects } = synergyData;

    // 2. Highlighting logic
    const isHighlighted = (type: 'course' | 'project', id: string) => {
        if (!hoveredNode) return true;
        if (hoveredNode.type === type && hoveredNode.id === id) return true;

        if (hoveredNode.type === 'course') {
            const course = relevantCourses.find(c => c.title === hoveredNode.id);
            return type === 'project' && course?.relatedProjects?.some(p => p.title === id);
        } else {
            const project = uniqueProjects.find(p => p.title === hoveredNode.id);
            return type === 'course' && relevantCourses.find(c => c.title === id)?.relatedProjects?.some(p => p.title === project?.title);
        }
    };

    const isLinkActive = (courseTitle: string, projectTitle: string) => {
        if (!hoveredNode) return false;
        if (hoveredNode.type === 'course' && hoveredNode.id === courseTitle) return true;
        if (hoveredNode.type === 'project' && hoveredNode.id === projectTitle) return true;
        return false;
    };

    // 3. Flowing Lines Logic
    const [links, setLinks] = useState<{ d: string; active: boolean; id: string }[]>([]);

    useEffect(() => {
        const updateLinks = () => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newLinks: any[] = [];

            relevantCourses.forEach(course => {
                const courseEl = containerRef.current?.querySelector(`[data-course-id="${course.title.replace(/"/g, '\\"')}"]`);
                if (!courseEl) return;
                const courseRect = courseEl.getBoundingClientRect();

                course.relatedProjects?.forEach(project => {
                    const projectEl = containerRef.current?.querySelector(`[data-project-id="${project.title.replace(/"/g, '\\"')}"]`);
                    if (!projectEl) return;
                    const projectRect = projectEl.getBoundingClientRect();

                    const x1 = courseRect.right - containerRect.left;
                    const y1 = courseRect.top + courseRect.height / 2 - containerRect.top;
                    const x2 = projectRect.left - containerRect.left;
                    const y2 = projectRect.top + projectRect.height / 2 - containerRect.top;

                    const cp1x = x1 + (x2 - x1) / 2;
                    const cp2x = x1 + (x2 - x1) / 2;

                    newLinks.push({
                        d: `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`,
                        active: isLinkActive(course.title, project.title),
                        id: `${course.title}-${project.title}`
                    });
                });
            });
            setLinks(newLinks);
        };

        updateLinks();
        window.addEventListener('resize', updateLinks);
        // Intersection observer might be better for cases where elements shift on load
        const observer = new ResizeObserver(updateLinks);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateLinks);
            observer.disconnect();
        };
    }, [relevantCourses, uniqueProjects, hoveredNode]);

    return (
        <div className="synergy-map-container relative py-12 px-4 sm:px-8 bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden" ref={containerRef}>
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="text-center mb-12 relative z-10">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                    {lang === 'da' ? 'Synergi: Fra Teori til Praksis' : 'Synergy: Theory to Practice'}
                </h3>
                <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed">
                    {lang === 'da'
                        ? 'Visualisering af hvordan akademiske kurser flyder ind i mine professionelle projekter.'
                        : 'Visualizing how academic foundations flow into applied professional projects.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32 relative z-10">
                {/* SVG Overlay */}
                <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
                    <svg className="w-full h-full overflow-visible">
                        {links.map(link => (
                            <motion.path
                                key={link.id}
                                d={link.d}
                                fill="none"
                                stroke={link.active ? 'rgba(var(--accent-rgb), 0.6)' : 'rgba(255,255,255,0.05)'}
                                strokeWidth={link.active ? 3 : 1.5}
                                initial={false}
                                animate={{
                                    stroke: link.active ? 'rgba(var(--accent-rgb), 0.6)' : 'rgba(255,255,255,0.05)',
                                    strokeWidth: link.active ? 3 : 1.5,
                                    opacity: !hoveredNode ? 1 : link.active ? 1 : 0.05
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Left Column: Courses */}
                <div className="flex flex-col gap-4 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2 pl-2">
                        {lang === 'da' ? 'Akademisk Fundament' : 'Academic Foundation'}
                    </span>
                    {relevantCourses.map((course) => (
                        <motion.div
                            key={course.title}
                            data-course-id={course.title}
                            onMouseEnter={() => setHoveredNode({ type: 'course', id: course.title })}
                            onMouseLeave={() => setHoveredNode(null)}
                            animate={{
                                opacity: isHighlighted('course', course.title) ? 1 : 0.2,
                                scale: hoveredNode?.id === course.title ? 1.02 : 1,
                            }}
                            className={`p-4 rounded-2xl border transition-colors cursor-crosshair ${hoveredNode?.id === course.title
                                    ? 'bg-accent/10 border-accent/40 shadow-xl shadow-accent/5'
                                    : 'bg-white/5 border-white/5 hover:border-white/10 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                    <i className="fa-solid fa-graduation-cap text-accent text-xs"></i>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{course.tag}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Right Column: Projects */}
                <div className="flex flex-col gap-4 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-2 pl-2 md:text-right">
                        {lang === 'da' ? 'Anvendte Projekter' : 'Applied Portfolio'}
                    </span>
                    {uniqueProjects.map((project) => (
                        <motion.a
                            href={project.href}
                            key={project.title}
                            data-project-id={project.title}
                            onMouseEnter={() => setHoveredNode({ type: 'project', id: project.title })}
                            onMouseLeave={() => setHoveredNode(null)}
                            animate={{
                                opacity: isHighlighted('project', project.title) ? 1 : 0.2,
                                scale: hoveredNode?.id === project.title ? 1.02 : 1,
                            }}
                            className={`p-4 rounded-2xl border transition-colors cursor-pointer block group ${hoveredNode?.id === project.title
                                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xl shadow-indigo-500/5'
                                    : 'bg-white/5 border-white/5 hover:border-white/10 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-3 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <i className="fa-solid fa-code-branch text-indigo-400 text-xs"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{project.title}</h4>
                                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Applied Artifact</span>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <i className="fa-solid fa-arrow-right text-white/40 group-hover:text-white/80 transition-all text-[10px]"></i>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SynergyMap;
