
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function AppLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const { StatusBar: RNStatusBar } = require('react-native');
        RNStatusBar.setBackgroundColor('#1a1a1a');
        RNStatusBar.setBarStyle('light-content');
        try {
          const EdgeToEdge = require('react-native-edge-to-edge');
          if (EdgeToEdge?.disable) {
            EdgeToEdge.disable();
          }
        } catch (e) {
          // Ignorar se não estiver disponível
        }
      } catch (error) {
        console.log('Erro ao configurar status bar:', error);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }} edges={["bottom","left","right"]}>
        <StatusBar style="light" backgroundColor="#1a1a1a" translucent={false} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1a1a1a' },
            animation: 'fade',
            animationDuration: 200,
            navigationBarColor: '#1a1a1a',
            statusBarBackgroundColor: '#1a1a1a',
          }}
        >
          <Stack.Screen 
            name="home" 
            options={{
              animation: 'fade',
              animationDuration: 200,
              contentStyle: { backgroundColor: '#1a1a1a' },
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
