// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

console.log(`[Supabase Init] URL: ${supabaseUrl ? 'Found' : 'Missing'}, Key: ${supabaseAnonKey ? 'Found' : 'Missing'}`);

export const supabase = null;
// (supabaseUrl && supabaseAnonKey)
//     ? createClient(supabaseUrl, supabaseAnonKey, {
//         auth: {
//             persistSession: false
//         }
//     })
//     : null;

export function isSupabaseAvailable() {
    return !!supabase;
}
