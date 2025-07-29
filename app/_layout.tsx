import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { FavoritesProvider } from '../context/FavoritesContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <FavoritesProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ 
            headerShown: false,
            headerTitle: '',
            headerBackTitle: '',
          }} />
          <Stack.Screen name="home" options={{ 
            headerShown: false,
            headerTitle: '',
            headerBackTitle: '',
          }} />
          <Stack.Screen name="search" options={{ 
            headerShown: false,
            headerTitle: '',
            headerBackTitle: '',
          }} />
          <Stack.Screen name="[id]" options={{ 
            headerShown: false,
            headerTitle: '',
            headerBackTitle: '',
          }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </FavoritesProvider>
  );
}
