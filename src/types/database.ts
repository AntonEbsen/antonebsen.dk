export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            guestbook: {
                Row: {
                    id: number
                    created_at: string
                    name: string
                    message: string
                    is_approved: boolean
                }
                Insert: {
                    id?: number
                    created_at?: string
                    name: string
                    message: string
                    is_approved?: boolean
                }
                Update: {
                    id?: number
                    created_at?: string
                    name?: string
                    message?: string
                    is_approved?: boolean
                }
                Relationships: []
            }
            subscribers: {
                Row: {
                    id: number
                    created_at: string
                    email: string
                }
                Insert: {
                    id?: number
                    created_at?: string
                    email: string
                }
                Update: {
                    id?: number
                    created_at?: string
                    email?: string
                }
                Relationships: []
            }
            chat_messages: {
                Row: {
                    id: number;
                    created_at: string;
                    role: 'user' | 'assistant';
                    content: string;
                    session_id?: string;
                }
                Insert: {
                    role: 'user' | 'assistant';
                    content: string;
                    session_id?: string;
                }
                Relationships: []
            }
            // App Tables
            projects: {
                Row: { id: number; created_at: string; title: string; description: string; tags: string[]; url?: string; featured?: boolean }
                Insert: { id?: number; created_at?: string; title: string; description: string; tags?: string[]; url?: string; featured?: boolean }
                Update: { id?: number; created_at?: string; title?: string; description?: string; tags?: string[]; url?: string; featured?: boolean }
                Relationships: []
            }
            skills: {
                Row: { id: number; created_at: string; name: string; category: string; icon?: string; proficiency: number; description?: string }
                Insert: { id?: number; created_at?: string; name: string; category: string; icon?: string; proficiency: number; description?: string }
                Update: { id?: number; created_at?: string; name?: string; category?: string; icon?: string; proficiency?: number; description?: string }
                Relationships: []
            }
            travel: {
                Row: { id: number; created_at: string; city: string; country: string; category?: string; lat: number; lng: number; year?: number; notes?: string }
                Insert: { id?: number; created_at?: string; city: string; country: string; category?: string; lat: number; lng: number; year?: number; notes?: string }
                Update: { id?: number; created_at?: string; city?: string; country?: string; category?: string; lat?: number; lng?: number; year?: number; notes?: string }
                Relationships: []
            }
            books: {
                Row: { id: number; created_at: string; title: string; author?: string; status: string; rating?: number }
                Insert: { id?: number; created_at?: string; title: string; author?: string; status: string; rating?: number }
                Update: { id?: number; created_at?: string; title?: string; author?: string; status?: string; rating?: number }
                Relationships: []
            }
            training: {
                Row: { id: number; created_at: string; date: string; type: string; duration_min?: number; distance_km?: number; tonnage_kg?: number; notes?: string }
                Insert: { id?: number; created_at?: string; date: string; type: string; duration_min?: number; distance_km?: number; tonnage_kg?: number; notes?: string }
                Update: { id?: number; created_at?: string; date?: string; type?: string; duration_min?: number; distance_km?: number; tonnage_kg?: number; notes?: string }
                Relationships: []
            }
            quotes: {
                Row: { id: number; created_at: string; text: string; author?: string; source?: string; tags?: string[] }
                Insert: { id?: number; created_at?: string; text: string; author?: string; source?: string; tags?: string[] }
                Update: { id?: number; created_at?: string; text?: string; author?: string; source?: string; tags?: string[] }
                Relationships: []
            }
            contact_messages: {
                Row: { id: number; created_at: string; name: string; email: string; message: string; read: boolean }
                Insert: { id?: number; created_at?: string; name: string; email: string; message: string; read?: boolean }
                Update: { id?: number; created_at?: string; name?: string; email?: string; message?: string; read?: boolean }
                Relationships: []
            }
            posts: {
                Row: { id: number; created_at: string; title: string; slug: string; excerpt?: string; content: string; image_url?: string; published: boolean }
                Insert: { id?: number; created_at?: string; title: string; slug: string; excerpt?: string; content: string; image_url?: string; published?: boolean }
                Update: { id?: number; created_at?: string; title?: string; slug?: string; excerpt?: string; content?: string; image_url?: string; published?: boolean }
                Relationships: []
            }
            status: {
                Row: { id: number; created_at: string; emoji: string; status: string }
                Insert: { id?: number; created_at?: string; emoji: string; status: string }
                Update: { id?: number; created_at?: string; emoji?: string; status?: string }
                Relationships: []
            }
            bucketlist: {
                Row: { id: number; created_at: string; title: string; description?: string; image_url?: string; status: 'todo' | 'doing' | 'done' }
                Insert: { id?: number; created_at?: string; title: string; description?: string; image_url?: string; status?: 'todo' | 'doing' | 'done' }
                Update: { id?: number; created_at?: string; title?: string; description?: string; image_url?: string; status?: 'todo' | 'doing' | 'done' }
                Relationships: []
            }
            qa: {
                Row: { id: number; created_at: string; question: string; answer?: string; status: 'pending' | 'answered' | 'hidden'; asker_name?: string }
                Insert: { id?: number; created_at?: string; question: string; answer?: string; status?: 'pending' | 'answered' | 'hidden'; asker_name?: string }
                Update: { id?: number; created_at?: string; question?: string; answer?: string; status?: 'pending' | 'answered' | 'hidden'; asker_name?: string }
                Relationships: []
            }
            cv_experience: {
                Row: { id: number; created_at: string; title: string; organization: string; type?: string; location?: string; period?: string; description?: string[]; highlights?: any }
                Insert: { id?: number; created_at?: string; title: string; organization: string; type?: string; location?: string; period?: string; description?: string[]; highlights?: any }
                Update: { id?: number; created_at?: string; title?: string; organization?: string; type?: string; location?: string; period?: string; description?: string[]; highlights?: any }
                Relationships: []
            }
            cv_education: {
                Row: { id: number; created_at: string; institution: string; degree: string; period?: string; description?: string; bullets?: string[]; technologies?: string[] }
                Insert: { id?: number; created_at?: string; institution: string; degree: string; period?: string; description?: string; bullets?: string[]; technologies?: string[] }
                Update: { id?: number; created_at?: string; institution?: string; degree?: string; period?: string; description?: string; bullets?: string[]; technologies?: string[] }
                Relationships: []
            }
            media: {
                Row: { id: number; created_at: string; title: string; source: string; date?: string; url?: string }
                Insert: { id?: number; created_at?: string; title: string; source: string; date?: string; url?: string }
                Update: { id?: number; created_at?: string; title?: string; source?: string; date?: string; url?: string }
                Relationships: []
            }
            references: {
                Row: { id: number; created_at: string; name: string; role: string; company?: string; relationship?: string; quote: string; linkedin_url?: string }
                Insert: { id?: number; created_at?: string; name: string; role: string; company?: string; relationship?: string; quote: string; linkedin_url?: string }
                Update: { id?: number; created_at?: string; name?: string; role?: string; company?: string; relationship?: string; quote?: string; linkedin_url?: string }
                Relationships: []
            }
        }
    }
    Views: {
        [_ in never]: never
    }
    Functions: {
        [_ in never]: never
    }
    Enums: {
        [_ in never]: never
    }
    CompositeTypes: {
        [_ in never]: never
    }
}
