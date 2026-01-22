import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
    type: 'data',
    schema: z.object({
        title: z.string(),
        tag: z.string(),
        meta: z.string().optional(),
        description: z.string(),
        category: z.enum(['academic', 'training', 'travel']),
        links: z.array(z.object({
            label: z.string(),
            url: z.string(),
            icon: z.string().optional(),
            disabled: z.boolean().optional(),
            class: z.string().optional()
        })).optional()
    })
});

const portfolioCollection = defineCollection({
    type: 'data',
    schema: z.object({
        title: z.string(),
        tagString: z.string(),
        description: z.string(),
        tools: z.string(),
        output: z.string(),
        links: z.array(z.object({
            label: z.string(),
            url: z.string(),
            icon: z.string().optional(),
            class: z.string().optional()
        })).optional()
    })
});

const booksCollection = defineCollection({
    type: 'data',
    schema: z.object({
        title: z.string(),
        author: z.string(),
        year: z.string().optional(),
        genre: z.string().optional(),
        tag: z.string().optional(),
        note: z.string(),
        links: z.array(z.object({
            label: z.string(),
            url: z.string(),
            icon: z.string().optional(),
            disabled: z.boolean().optional(),
            class: z.string().optional()
        })).optional()
    })
});

export const collections = {
    'blog': blogCollection,
    'portfolio': portfolioCollection,
    'books': booksCollection,
};
