export interface Book {
    id: number;
    created_at: string;
    title: string;
    author: string;
    rating: number; // 0-5
    status: string; // 'Read', 'To Read', etc.
    notes?: string;
}

export interface Case {
    id: string;
    title: string;
    pill: string;
    desc: string;
    problem: string;
    data: string[];
    method: string[];
    result: string[];
    role: string[];
    tools: string[];
}

export interface Certification {
    id: number;
    created_at: string;
    title: string;
    issuer: string;
    date: string;
    url?: string;
    category: string;
    visible: boolean;
}

export interface TimelineItem {
    year: string;
    title: string;
    desc: string;
    type: 'work' | 'education' | 'other';
}

export interface Podcast {
    id: number;
    created_at: string;
    title: string;
    host: string;
    rating: number;
    notes?: string;
    url?: string;
    category?: string;
}

export interface BucketItem {
    id: number;
    created_at: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    category?: string;
    description?: string;
}
