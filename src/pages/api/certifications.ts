import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { CertificationSchema } from '../../lib/api';

export const GET: APIRoute = async () => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }
    const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('id', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
};

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!cookies.has("auth_token")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!supabase) {
        return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }

    try {
        const body = await request.json();

        const newCert = {
            name: body.title,
            issuer: body.issuer,
            date: body.date,
            url: body.url,
            category: body.category,
            visible: true,
            skills: body.skills,
            credential_id: body.credential_id,
            expiration_date: body.expiration_date,
            featured: body.featured || false,
            project_name: body.project_name,
            project_url: body.project_url
        };

        const { data, error } = await supabase
            .from('certifications')
            .insert([newCert])
            .select();

        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

        return new Response(JSON.stringify(data[0]), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid Request" }), { status: 400 });
    }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
    if (!cookies.has("auth_token")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!supabase) {
        return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
