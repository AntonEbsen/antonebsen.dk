
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// GET: Fetch posts
export const GET: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Add new post
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const slug = body.slug || slugify(body.title);

    const { data, error } = await supabase
        .from('posts')
        .insert([{
            title: body.title,
            slug: slug,
            excerpt: body.excerpt,
            content: body.content,
            image_url: body.image_url,
            published: body.published || false,
            published_at: body.published ? new Date().toISOString() : null
        }])
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// DELETE: Remove post
export const DELETE: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
