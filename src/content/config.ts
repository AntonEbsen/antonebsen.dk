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
    'pages': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            description: z.string(),
            bodyClass: z.string().optional(),
            hero: z.any().optional(), // Flexible for now
            sections: z.record(z.any()).optional()
        })
    }),
    'exercises': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            muscles: z.array(z.string()),
            benefits: z.array(z.string()),
            setup: z.array(z.string()),
            execution: z.array(z.string()),
            focusPoints: z.array(z.object({
                icon: z.string(),
                title: z.string(),
                text: z.string()
            })),
            tempo: z.tuple([
                z.union([z.number(), z.string()]),
                z.union([z.number(), z.string()]),
                z.union([z.number(), z.string()]),
                z.union([z.number(), z.string()])
            ]).default([3, 0, 1, 0]),
            tempoNote: z.string().optional()
        })
    })
};
