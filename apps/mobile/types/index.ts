/**
 * Shared TypeScript types for ClearTalk Mobile App
 */

export type ShieldLevel = 'open' | 'moderate' | 'strict';

export interface BIFFScore {
  brief: number;
  informative: number;
  friendly: number;
  firm: number;
  overall: number;
  suggestions: string[];
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  shield_level: ShieldLevel;
  biometric_enabled: boolean;
  push_token: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  biff_score: BIFFScore;
  hash_chain: string;
  previous_hash: string | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  other_user: User;
  last_message: Message | null;
  unread_count: number;
}

export interface ClaudeResponse {
  biff_score: BIFFScore;
  coaching_message: string;
  improved_version?: string;
}

export interface NotificationData {
  conversation_id?: string;
  message_id?: string;
  sender_id?: string;
  type?: 'new_message' | 'message_held' | 'system';
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

// Navigation types for Expo Router
export type RootStackParamList = {
  index: undefined;
  login: undefined;
  '(tabs)': undefined;
  'conversation/[id]': { id: string };
};

// API Error types
export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: APIError | null;
}

// Hash chain types
export interface HashChainLink {
  hash: string;
  previous_hash: string | null;
  content: string;
  timestamp: string;
}

// Settings types
export interface UserSettings {
  shield_level: ShieldLevel;
  biometric_enabled: boolean;
  push_enabled: boolean;
  email_notifications: boolean;
}

// BIFF coaching types
export interface CoachingSession {
  message: string;
  score: BIFFScore;
  suggestions: string[];
  improved_version?: string;
  timestamp: string;
}

// Analytics event types
export type AnalyticsEvent =
  | 'message_sent'
  | 'message_received'
  | 'biff_analysis'
  | 'shield_changed'
  | 'login'
  | 'signup'
  | 'biometric_enabled';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, any>;
  timestamp: string;
}
