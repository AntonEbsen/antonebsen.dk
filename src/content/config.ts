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
            // Strict Hero Schema
            hero: z.object({
                title: z.string().optional(),
                eyebrow: z.string().optional(),
                text: z.string().optional(),
                tag: z.string().optional(), // Added for home.json
                pills: z.array(z.string()).optional(),
                buttons: z.record(z.string()).optional(),
                // Flat buttons for home.json compatibility
                btnPort: z.string().optional(),
                btnCV: z.string().optional(),
                btnGuest: z.string().optional(),
                actions: z.array(z.object({
                    text: z.string(),
                    href: z.string(),
                    icon: z.string().optional(),
                    variant: z.string().optional()
                })).optional(),
                image: z.object({
                    src: z.string(),
                    alt: z.string()
                }).optional()
            }).passthrough().optional(),
            sections: z.record(z.any()).optional(),
            roles: z.any().optional(),
            contact: z.any().optional(),
            ui: z.any().optional()
        }).passthrough()
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
    }),
    'timeline': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            items: z.array(z.object({
                year: z.string(),
                title: z.string(),
                description: z.string(),
                icon: z.string().optional()
            }))
        })
    }),
    'qa': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            subtitle: z.string().optional(),
            items: z.array(z.object({
                question: z.string(),
                answer: z.string()
            }))
        })
    }),
    'cv': defineCollection({
        type: 'data',
        schema: z.object({
            experience: z.array(z.object({
                title: z.string(),
                organization: z.string(),
                location: z.string(),
                period: z.string(),
                type: z.string(),
                categories: z.array(z.string()).optional(),
                description: z.array(z.string()),
                highlights: z.array(z.object({
                    label: z.string(),
                    value: z.string()
                })).optional(),
                links: z.array(z.object({
                    text: z.string(),
                    href: z.string(),
                    icon: z.string().optional()
                })).optional()
            })).optional(),
            education: z.array(z.object({
                institution: z.string(),
                degree: z.string(),
                period: z.string(),
                categories: z.array(z.string()).optional(),
                description: z.string(),
                bullets: z.array(z.string()).optional(),
                technologies: z.array(z.string()).optional()
            })).optional(),
            courses: z.array(z.object({
                title: z.string(),
                tag: z.string(),
                institution: z.string(),
                description: z.string(),
                links: z.array(z.object({
                    text: z.string(),
                    href: z.string()
                })).optional()
            })).optional(),
            projects: z.array(z.object({
                title: z.string(),
                tag: z.string().optional(),
                categories: z.array(z.string()).optional(),
                meta: z.string().optional(),
                description: z.string(),
                links: z.array(z.object({
                    text: z.string(),
                    href: z.string()
                })).optional()
            })).optional(),
            certifications: z.array(z.object({
                name: z.string(),
                url: z.string(),
                image: z.string(),
                categories: z.array(z.string()).optional(),
                description: z.string(),
                displayName: z.string().optional()
            })).optional(),
            organizations: z.array(z.object({
                name: z.string(),
                role: z.string(),
                period: z.string(),
                description: z.string(),
                url: z.string().optional()
            })).optional()
        })
    }),
    'skills': defineCollection({
        type: 'data',
        schema: z.object({
            professional: z.array(z.object({
                id: z.string().optional(),
                icon: z.string().optional(),
                name: z.string(),
                title: z.string().optional()
            })),
            programming: z.array(z.object({
                id: z.string().optional(),
                icon: z.string().optional(),
                name: z.string(),
                title: z.string().optional(),
                level: z.string().optional()
            })),
            focus: z.array(z.object({
                icon: z.string(),
                name: z.string()
            })).optional(),
            languages: z.array(z.object({
                flag: z.string(),
                name: z.string(),
                level: z.string()
            })).optional()
        })
    }),
    'resources': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            items: z.array(z.object({
                title: z.string(),
                desc: z.string(),
                pill: z.string().optional(),
                meta: z.string().optional(),
                links: z.array(z.object({
                    url: z.string(),
                    text: z.string(),
                    icon: z.string().nullable().optional(),
                    ghost: z.boolean().optional(),
                    download: z.boolean().optional(),
                    external: z.boolean().optional(),
                    disabled: z.boolean().optional()
                }))
            }))
        })
    }),
    'certifications': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            desc: z.string(),
            hero: z.object({
                eyebrow: z.string(),
                title: z.string(),
                text: z.string(),
                tipTitle: z.string(),
                tipText: z.string(),
                themes: z.array(z.string())
            }),
            empty: z.string(),
            emptyDash: z.string(),
            dashLink: z.string(),
            cats: z.record(z.object({
                title: z.string().optional(), // For "other" it's just a string in the old object, will normalize
                text: z.string().optional(),
                empty: z.string().optional()
            })),
            btnProof: z.string(),
            otherPill: z.string(),
            contact: z.object({
                title: z.string(),
                text: z.string()
            })
        })
    }),
    'website-history': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            desc: z.string(),
            eyebrow: z.string(),
            h1: z.string(),
            lead: z.string(),
            btns: z.record(z.string()),
            meta: z.object({
                title: z.string(),
                updated: z.string(),
                date: z.string(),
                time: z.string(),
                val: z.string(),
                tags: z.string(),
                tagsVal: z.string()
            }),
            tldr: z.object({
                title: z.string(),
                list: z.array(z.string())
            }),
            why: z.object({
                title: z.string(),
                p1: z.string(),
                p2: z.string()
            }),
            build: z.object({
                title: z.string(),
                intro: z.string(),
                p1: z.object({ title: z.string(), tag: z.string(), text: z.string() }),
                p2: z.object({ title: z.string(), tag: z.string(), text: z.string() }),
                p3: z.object({ title: z.string(), tag: z.string(), text: z.string() })
            }),
            timeline: z.object({
                title: z.string(),
                list: z.array(z.string()),
                outro: z.string()
            }),
            enables: z.object({
                title: z.string(),
                list: z.array(z.string())
            }),
            next: z.object({
                title: z.string(),
                text: z.string(),
                btns: z.record(z.string())
            }),
            feedback: z.object({
                title: z.string(),
                text: z.string(),
                mail: z.string(),
                page: z.string()
            })
        })
    }),
    'adversity': defineCollection({
        type: 'data',
        schema: z.object({
            title: z.string(),
            desc: z.string(),
            eyebrow: z.string(),
            h1: z.string(),
            intro: z.string(),
            chapters: z.array(z.object({
                id: z.string(),
                title: z.string(),
                content: z.array(z.string()),
                quotes: z.array(z.object({
                    text: z.string(),
                    author: z.string().optional(),
                    style: z.string().optional()
                })).optional(),
                outro: z.string().optional(),
                cards: z.boolean().optional()
            })),
            cards: z.record(z.object({
                label: z.string(),
                text: z.string()
            })).optional(),
            footer: z.object({
                title: z.string(),
                text: z.string(),
                btnCV: z.string(),
                btnPort: z.string()
            })
        })
    })
};
