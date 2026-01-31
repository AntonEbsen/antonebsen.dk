import { supabase } from './supabase';

// --- Types ---
export interface Book {
    id: number;
    created_at: string;
    title: string;
    author: string;
    rating: number; // 0-5
    status: string; // 'Read', 'To Read', etc.
    notes?: string;
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

// --- Fetch Functions ---

export async function getBooks(): Promise<Book[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('rating', { ascending: false });
        if (error) console.error("Error fetching books:", error);
        return (data || []) as Book[];
    } catch (e) {
        console.error("Exception fetching books:", e);
        return [];
    }
}

export async function getCertifications(): Promise<Certification[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('certifications')
            .select('*')
            .eq('visible', true)
            .order('id', { ascending: false });
        if (error) console.error("Error fetching certifications:", error);
        return (data || []) as Certification[];
    } catch (e) {
        console.error("Exception fetching certifications:", e);
        return [];
    }
}

export async function getPodcasts(): Promise<Podcast[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('podcasts') // Assuming table name is 'podcasts'
            .select('*')
            .order('rating', { ascending: false });
        // Note: Check table name in actual usage? Previous code used 'podcasts'
        if (error) console.error("Error fetching podcasts:", error);
        return (data || []) as Podcast[];
    } catch (e) {
        console.error("Exception fetching podcasts:", e);
        return [];
    }
}

export async function getBucketList(): Promise<BucketItem[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('bucket_list')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) console.error("Error fetching bucket list:", error);
        return (data || []) as BucketItem[];
    } catch (e) {
        console.error("Exception fetching bucket list:", e);
        return [];
    }
}
