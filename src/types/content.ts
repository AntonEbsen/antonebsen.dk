
export interface TimelineItem {
    id: string;
    year: string;
    yearVal: number;
    category: string;
    title_da: string;
    title_en: string;
    desc_da: string;
    desc_en: string;
    company?: string; // Not in JSON but useful for context if added later
    link?: string;
    linkText_da?: string;
    linkText_en?: string;
    links?: { url: string; text_da: string; text_en: string; ghost?: boolean }[];
}

export interface ProjectItem {
    title: string;
    tagString: string;
    description: string;
    tools: string;
    output: string;
    links?: { label: string; url: string; disabled?: boolean }[];
    // Computed fields for multi-language context if needed, currently JSON is English-centric
    title_da?: string;
    description_da?: string;
    category?: string; // Mapped from tagString or hardcoded
    tech?: string[];   // Mapped from tools
}

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
    tags?: string[];
}

export interface QAItem {
    q_en: string;
    a_en: string;
    q_da: string;
    a_da: string;
}

export interface QARoot {
    pinned: QAItem[];
}

export interface BookItem {
    title: string;
    author: string;
    rating: number;
    review?: string;
    cover?: string;
}

export interface BucketListEntry {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status: 'todo' | 'doing' | 'done';
    created_at: string;
    completed_at?: string;
    image_url?: string;
}

export interface CaseItem {
    id?: string;
    title: string;
    subtitle?: string;
    role: string[];
    method: string[];
    result: string[];
    tools: string[];
    data: string[];
    link?: string;
    // UI specific fields from content.cases
    problem?: string;
    desc?: string;
    pill?: string;
}

export interface VideoCV {
    title: string;
    description: string;
    bodyClass: string;
    hero: {
        eyebrow: string;
        title: string;
        lead: string;
        tip: string;
        cta: {
            video: string;
            pdf: string;
            contact: string;
        };
    };
    sidebar: {
        title: string;
        points: string[];
    };
    video: {
        src: string;
        downloadText: string;
        downloadLink: string;
    };
    summary: {
        title: string;
        items: string[];
    };
    chapters: {
        title: string;
        items: string[];
        note: string;
    };
    links: {
        title: string;
        text: string;
        items: {
            cv: string;
            pdf: string;
            linkedin: string;
            github: string;
        };
    };
}
