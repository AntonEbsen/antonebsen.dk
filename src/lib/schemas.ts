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
    category: z.string(), // z.enum([...]) could be stricter but string is flexible for now
    proficiency: z.number().min(0).max(100),
    icon: z.string().optional(),
    description: z.string().optional()
});

export const GuestbookSchema = z.object({
    name: z.string().min(1).max(50),
    message: z.string().min(1).max(500),
    signature: z.string().optional()
});
