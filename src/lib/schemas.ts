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

// ── The write routes that had no schema at all ──────────────────────────────
//
// Nine routes inserted `await request.json()` straight into Supabase, so a caller
// could set any column the table had. The shapes below follow src/types/database.ts;
// Zod strips keys it does not name, which is the point. Lengths are generous — the
// bound is there to stop a megabyte in a text column, not to second-guess Anton.

export const MediaSchema = z.object({
    title: z.string().min(1).max(200),
    source: z.string().min(1).max(200),
    date: z.string().max(40).optional(),
    url: z.string().max(500).optional(),
});

/** The "now" status pill in the navbar. Table: status. */
export const StatusSchema = z.object({
    emoji: z.string().min(1).max(16),
    status: z.string().min(1).max(280),
});

export const ReferenceSchema = z.object({
    name: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    company: z.string().max(120).optional(),
    relationship: z.string().max(120).optional(),
    quote: z.string().min(1).max(2000),
    linkedin_url: z.string().max(500).optional(),
});

export const BucketListStatus = z.enum(['todo', 'doing', 'done']);

export const BucketListInputSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    image_url: z.string().max(500).optional(),
    status: BucketListStatus.default('todo'),
});

export const BucketListUpdateSchema = z.object({
    id: z.coerce.number().int().positive(),
    status: BucketListStatus,
});

export const CvEducationSchema = z.object({
    institution: z.string().min(1).max(200),
    degree: z.string().min(1).max(200),
    period: z.string().max(60).optional(),
    description: z.string().max(2000).optional(),
    bullets: z.array(z.string().max(300)).max(20).optional(),
    technologies: z.array(z.string().max(60)).max(30).optional(),
});

export const CvExperienceSchema = z.object({
    title: z.string().min(1).max(200),
    organization: z.string().min(1).max(200),
    type: z.string().max(60).optional(),
    location: z.string().max(120).optional(),
    period: z.string().max(60).optional(),
    description: z.array(z.string().max(300)).max(20).optional(),
    highlights: z.array(z.object({
        label: z.string().max(60),
        value: z.string().max(200),
    })).max(10).optional(),
});

/** A visitor's question from the /qa form. Table: qa (status starts as 'pending'). */
export const QaQuestionSchema = z.object({
    question: z.string().trim().min(5).max(500),
    asker_name: z.string().trim().max(80).optional().or(z.literal('')),
});

/** Answering or hiding a visitor's question. Table: qa. */
export const QaUpdateSchema = z.object({
    id: z.coerce.number().int().positive(),
    status: z.enum(['pending', 'answered', 'hidden']),
    answer: z.string().max(4000).optional(),
});

/** A visitor's reaction on a post. The three types are the ones ArticleReactions offers. */
export const ReactionSchema = z.object({
    slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i),
    reaction_type: z.enum(['insightful', 'strong-data', 'thought-provoking']),
});
