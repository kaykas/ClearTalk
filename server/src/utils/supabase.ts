import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  biff_score: number;
  biff_brief: number;
  biff_informative: number;
  biff_friendly: number;
  biff_firm: number;
  hash: string;
  previous_hash: string | null;
  is_filtered: boolean;
  original_content: string | null;
  created_at: string;
}

export interface MessageShieldLog {
  id: string;
  message_id: string;
  original_content: string;
  filtered_content: string;
  manipulation_types: string[];
  severity: 'low' | 'medium' | 'high';
  facts_preserved: string[];
  created_at: string;
}

export interface PatternDetection {
  id: string;
  conversation_id: string;
  pattern_type: string;
  confidence: number;
  evidence: string;
  detected_in_messages: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}
