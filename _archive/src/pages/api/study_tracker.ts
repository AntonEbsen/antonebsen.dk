
import type { APIRoute } from 'astro';
import { supabase } from '@lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
    }

    const { action, member_id } = body;

    if (!member_id) {
        return new Response(JSON.stringify({ error: 'Missing member_id' }), { status: 400 });
    }

    try {
        if (action === 'start') {
            const { error } = await supabase.from('study_active_timers').upsert({
                member_id: member_id,
                start_time: new Date().toISOString(),
                duration_minutes: 25,
                is_active: true
            }, { onConflict: 'member_id' });
            if (error) throw error;
        }
        else if (action === 'stop') {
            const { error } = await supabase.from('study_active_timers')
                .update({ is_active: false })
                .eq('member_id', member_id);
            if (error) throw error;
        }
        else if (action === 'finish') {
            // 1. Stop timer
            const { error: stopError } = await supabase.from('study_active_timers')
                .update({ is_active: false })
                .eq('member_id', member_id);
            if (stopError) throw stopError;

            // 2. Update Leaderboard
            const { data: current } = await supabase
                .from('study_leaderboard')
                .select('pomodoros')
                .eq('member_id', member_id)
                .single();

            const { error: lbError } = await supabase.from('study_leaderboard').upsert({
                member_id: member_id,
                pomodoros: (current?.pomodoros || 0) + 1,
                updated_at: new Date().toISOString()
            }, { onConflict: 'member_id' });
            if (lbError) throw lbError;
        }
        else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Study Tracker Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
