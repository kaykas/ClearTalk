import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { setupNotificationListeners } from '../lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Set up notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);
        // TODO: Navigate to conversation if data contains conversation_id
      }
    );

    return cleanup;
  }, []);

  return (
    <PaperProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="conversation/[id]"
          options={{
            title: 'Conversation',
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
