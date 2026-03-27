import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Server-side Supabase client
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Client-side Supabase client
export function createBrowserClient() {
  return createClientComponentClient()
}

// Database types
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  original_content: string
  filtered_content: string
  was_filtered: boolean
  biff_score: number
  hostile_language_count: number
  pattern_flags: string[]
  message_hash: string
  previous_hash: string | null
  created_at: string
  sender?: User
  recipient?: User
}

export interface Conversation {
  id: string
  participant_a_id: string
  participant_b_id: string
  case_number: string | null
  jurisdiction: string | null
  status: 'active' | 'archived' | 'suspended'
  created_at: string
  participant_a?: User
  participant_b?: User
  messages?: Message[]
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'parent' | 'attorney' | 'admin'
  created_at: string
}

export interface ProfessionalAccess {
  id: string
  conversation_id: string
  professional_id: string
  granted_by: string
  granted_at: string
  access_level: 'view_only' | 'export'
  conversation?: Conversation
  professional?: User
}
