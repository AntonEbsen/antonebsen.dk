
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import cv from '../../data/cv.json';

export const prerender = false;

export const GET: APIRoute = async () => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
        experience: 0,
        education: 0,
        errors: [] as string[]
    };

    // Migrate Experience
    if (cv.experience && cv.experience.length > 0) {
        for (const role of cv.experience) {
            const { error } = await supabase.from('experience').insert([{
                title: role.title,
                organization: role.organization,
                location: role.location,
                period: role.period,
                type: role.type,
                description: role.description,
                highlights: role.highlights,
                links: role.links,
                visible: true
            }]);

            if (error) results.errors.push(`Exp Error (${role.title}): ${error.message}`);
            else results.experience++;
        }
    }

    // Migrate Education
    if (cv.education && cv.education.length > 0) {
        for (const edu of cv.education) {
            const { error } = await supabase.from('education').insert([{
                institution: edu.institution,
                degree: edu.degree,
                period: edu.period,
                description: edu.description,
                bullets: edu.bullets,
                technologies: edu.technologies,
                visible: true
            }]);

            if (error) results.errors.push(`Edu Error (${edu.degree}): ${error.message}`);
            else results.education++;
        }
    }

    return new Response(JSON.stringify({
        message: "Migration completed",
        stats: results
    }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
};
