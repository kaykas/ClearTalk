import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage implementation using SecureStore for sensitive data
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  biff_score: {
    brief: number;
    informative: number;
    friendly: number;
    firm: number;
    overall: number;
  };
  hash_chain: string;
  previous_hash: string | null;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  shield_level: 'open' | 'moderate' | 'strict';
  biometric_enabled: boolean;
  push_token: string | null;
  created_at: string;
}

// Helper functions for realtime subscriptions
export const subscribeToConversation = (
  conversationId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToUserConversations = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`user:${userId}:conversations`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
