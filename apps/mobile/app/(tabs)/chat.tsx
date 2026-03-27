import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Avatar, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase, Conversation, Profile } from '../../lib/supabase';
import ShieldIndicator from '../../components/ShieldIndicator';

interface ConversationWithProfile extends Conversation {
  otherUser?: Profile;
  unreadCount?: number;
}

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get conversations where user is participant
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!messages_conversation_id_fkey(
            id,
            content,
            created_at,
            sender_id,
            read_at
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Load other user profiles and count unread messages
      const conversationsWithProfiles = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          // Count unread messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...convo,
            otherUser: profile,
            unreadCount: count || 0,
          };
        })
      );

      setConversations(conversationsWithProfiles);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const filteredConversations = conversations.filter((convo) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      convo.otherUser?.full_name?.toLowerCase().includes(query) ||
      convo.otherUser?.email?.toLowerCase().includes(query)
    );
  });

  const renderConversation = ({ item }: { item: ConversationWithProfile }) => {
    const lastMessage = item.messages?.[0];
    const otherUser = item.otherUser;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/conversation/${item.id}`)}
      >
        <Avatar.Text
          size={56}
          label={otherUser?.full_name?.[0] || otherUser?.email?.[0] || '?'}
          style={styles.avatar}
        />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>
              {otherUser?.full_name || otherUser?.email || 'Unknown'}
            </Text>
            {lastMessage && (
              <Text style={styles.timestamp}>
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage?.content || 'No messages yet'}
            </Text>
            {item.unreadCount! > 0 && (
              <Badge style={styles.badge}>{item.unreadCount}</Badge>
            )}
          </View>

          <View style={styles.shieldContainer}>
            <ShieldIndicator level={otherUser?.shield_level || 'moderate'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search conversations"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No conversations yet'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to new conversation screen
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchbar: {
    margin: 8,
    elevation: 2,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    backgroundColor: '#007AFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  badge: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  shieldContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
  },
});
