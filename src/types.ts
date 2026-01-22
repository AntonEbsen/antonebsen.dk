export interface Link {
    text: string;
    href: string;
    icon?: string;
}

export interface Experience {
    title: string;
    organization: string;
    location: string;
    period: string;
    type: string;
    description: string[];
    highlights?: { label: string; value: string }[];
    links?: Link[];
}

export interface Education {
    institution: string;
    degree: string;
    period: string;
    description?: string;
    bullets?: string[];
    technologies?: string[];
    location?: string;
    projects?: { label: string; title: string }[];
}

export interface Course {
    title: string;
    tag: string;
    institution: string;
    description: string;
    links?: Link[];
}

export interface Project {
    title: string;
    tag: string;
    meta?: string;
    description: string;
    links?: Link[];
}

export interface Skill {
    id?: string;
    icon: string;
    name: string;
    title?: string; // tooltips
}

export interface Language {
    flag: string;
    name: string;
    level: string;
}

export interface Book {
    title: string;
    author: string;
    year: string;
    description: string;
    cover?: string; // Path to image
    tags?: string[];
    link?: string;
}

export interface Podcast {
    title: string;
    host: string;
    description: string;
    image?: string;
    link?: string;
    tags?: string[];
}
