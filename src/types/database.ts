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
            }
            chat_messages: { // Assuming structure based on usage
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
            }
        }
    }
}
