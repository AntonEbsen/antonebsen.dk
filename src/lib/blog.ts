import { getCollection, type CollectionEntry } from 'astro:content';
import { ORCID_URI } from './orcid';

export type Post = CollectionEntry<'blog'>;
export type PostLang = 'da' | 'en';

export const SITE = 'https://antonebsen.dk';

/**
 * The posts a visitor can read, newest first.
 *
 * Five of the sixteen entries are link collections with no body. They used to show
 * in the listing as cards (two with disabled "#" links) and to build as pages that
 * rendered "this post has no content". They are not listed, built, or syndicated;
 * the assistant's corpus still knows them by title, which is a separate decision.
 */
export async function publishedPosts(): Promise<Post[]> {
    const posts = await getCollection('blog');
    return posts
        .filter((p) => (p.data.content?.length ?? 0) > 0)
        .sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export function postUrl(slug: string, lang: PostLang): string {
    return lang === 'da' ? `/blog/${slug}` : `/en/blog/${slug}`;
}

export function postTitle(post: Post, lang: PostLang): string {
    return (lang === 'da' && post.data.title_da) || post.data.title;
}

export function postDescription(post: Post, lang: PostLang): string {
    return (lang === 'da' && post.data.description_da) || post.data.description;
}

/** schema.org BlogPosting for a post page's <head>. */
export function postJsonLd(post: Post, lang: PostLang) {
    const url = SITE + postUrl(post.id, lang);
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': url,
        mainEntityOfPage: url,
        headline: postTitle(post, lang),
        description: postDescription(post, lang),
        inLanguage: lang,
        datePublished: post.data.date,
        dateModified: post.data.updated ?? post.data.date,
        author: {
            '@type': 'Person',
            '@id': ORCID_URI,
            name: 'Anton Meier Ebsen Jørgensen',
            url: SITE,
        },
        publisher: {
            '@type': 'Person',
            name: 'Anton Meier Ebsen Jørgensen',
            url: SITE,
        },
        ...(post.data.series
            ? {
                  isPartOf: {
                      '@type': 'CreativeWorkSeries',
                      name: post.data.series,
                      ...(post.data.seriesOrder ? { position: post.data.seriesOrder } : {}),
                  },
              }
            : {}),
        keywords: post.data.tag,
        articleSection: post.data.category,
    };
}
