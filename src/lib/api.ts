import { supabase } from './supabase';
import { z } from 'zod';

// --- Schemas & Types ---

export const BookSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    title: z.string(),
    author: z.string(),
    rating: z.number(),
    status: z.string(),
    notes: z.string().optional().nullable(),
});
export type Book = z.infer<typeof BookSchema>;

export const CertificationSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    title: z.string(),
    issuer: z.string(),
    date: z.string(),
    url: z.string().optional().nullable(),
    category: z.string(),
    visible: z.boolean(),
    skills: z.array(z.string()).optional(),
    credential_id: z.string().optional().nullable(),
    expiration_date: z.string().optional().nullable(),
    featured: z.boolean().optional(),
    project_name: z.string().optional().nullable(),
    project_url: z.string().optional().nullable(),
});
export type Certification = z.infer<typeof CertificationSchema>;

export const PodcastSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    title: z.string(),
    host: z.string(),
    rating: z.number(),
    notes: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
});
export type Podcast = z.infer<typeof PodcastSchema>;

export const BucketItemSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    title: z.string(),
    status: z.enum(['todo', 'doing', 'done']),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});
export type BucketItem = z.infer<typeof BucketItemSchema>;

export type TimelineItem = {
    category?: string;
    title: string;
    year: string | number;
    meta?: string;
    description: string;
    link?: string;
    linkText?: string;
    links?: { url: string; text: string; }[];
};


// --- Fetch Functions ---

export async function getBooks(): Promise<Book[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('rating', { ascending: false });

        if (error) {
            console.error("Error fetching books:", error);
            return [];
        }

        const validItems: Book[] = [];
        data?.forEach((item) => {
            const result = BookSchema.safeParse(item);
            if (result.success) {
                validItems.push(result.data);
            } else {
                console.warn(`Skipping invalid Book (ID: ${(item as any).id}):`, result.error.flatten());
            }
        });
        return validItems;
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

        if (error) {
            console.error("Error fetching certifications:", error);
            return [];
        }

        const validItems: Certification[] = [];
        data?.forEach((item) => {
            const result = CertificationSchema.safeParse(item);
            if (result.success) {
                validItems.push(result.data);
            } else {
                console.warn(`Skipping invalid Certification (ID: ${(item as any).id}):`, result.error.flatten());
            }
        });
        return validItems;
    } catch (e) {
        console.error("Exception fetching certifications:", e);
        return [];
    }
}

export async function getPodcasts(): Promise<Podcast[]> {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('podcasts')
            .select('*')
            .order('rating', { ascending: false });

        if (error) {
            console.error("Error fetching podcasts:", error);
            return [];
        }

        const validItems: Podcast[] = [];
        data?.forEach((item) => {
            const result = PodcastSchema.safeParse(item);
            if (result.success) {
                validItems.push(result.data);
            } else {
                console.warn(`Skipping invalid Podcast (ID: ${(item as any).id}):`, result.error.flatten());
            }
        });
        return validItems;
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

        if (error) {
            console.error("Error fetching bucket list:", error);
            return [];
        }

        const validItems: BucketItem[] = [];
        data?.forEach((item) => {
            const result = BucketItemSchema.safeParse(item);
            if (result.success) {
                validItems.push(result.data);
            } else {
                console.warn(`Skipping invalid BucketItem (ID: ${(item as any).id}):`, result.error.flatten());
            }
        });
        return validItems;
    } catch (e) {
        console.error("Exception fetching bucket list:", e);
        return [];
    }
}
