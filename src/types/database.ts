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
