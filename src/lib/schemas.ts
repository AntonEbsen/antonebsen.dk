import { z } from "zod";

export const ProjectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    tags: z.array(z.string()).optional(),
    url: z.string().optional().or(z.literal('')),
    featured: z.boolean().optional(),
    image_url: z.string().optional()
});

export const SkillSchema = z.object({
    name: z.string().min(1),
    category: z.string(),
    proficiency: z.number().min(0).max(100),
    icon: z.string().optional(),
    description: z.string().optional()
});

export const GuestbookSchema = z.object({
    name: z.string().min(1).max(50),
    message: z.string().min(1).max(500),
    signature: z.string().optional()
});

export const BookSchema = z.object({
    title: z.string().min(1),
    author: z.string().optional(),
    status: z.enum(['Reading', 'Finished', 'To Read']),
    rating: z.number().min(1).max(5).nullable().optional()
});

export const QuoteSchema = z.object({
    text: z.string().min(1),
    author: z.string().optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).optional()
});

export const TrainingSchema = z.object({
    date: z.string(),
    type: z.string(),
    duration_min: z.number().optional().nullable(),
    distance_km: z.number().optional().nullable(),
    tonnage_kg: z.number().optional().nullable(),
    notes: z.string().optional()
});

export const TravelSchema = z.object({
    city: z.string().min(1),
    country: z.string().min(1),
    category: z.string(),
    lat: z.number(),
    lng: z.number(),
    year: z.number().optional().nullable(),
    notes: z.string().optional()
});

export const PostSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional(),
    slug: z.string().optional(),
    image_url: z.string().optional(),
    published: z.boolean().optional(),
    tags: z.array(z.string()).optional()
});
