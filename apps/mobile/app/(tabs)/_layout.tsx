import { Tabs } from 'expo-router';
import { IconButton } from 'react-native-paper';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="message-text" size={size} iconColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="biff"
        options={{
          title: 'BIFF Coach',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="school" size={size} iconColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shield"
        options={{
          title: 'Shield',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="shield" size={size} iconColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="cog" size={size} iconColor={color} />
          ),
        }}
      />
    </Tabs>
  );
}
