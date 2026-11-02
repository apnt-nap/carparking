import '../lib/i18n';
import {
  IBMPlexSansThai_400Regular, IBMPlexSansThai_500Medium, IBMPlexSansThai_600SemiBold, IBMPlexSansThai_700Bold, useFonts,
} from '@expo-google-fonts/ibm-plex-sans-thai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastHost } from '../components/Toast';
import { FONT } from '../components/ui';
import { useDataMode } from '../lib/dataSource';
import { useTheme } from '../lib/theme';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } });

export default function RootLayout() {
  const t = useTheme();
  // UI-32: IBM Plex Sans Thai. If loading fails, the app carries on with the system font.
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansThai_400Regular, IBMPlexSansThai_500Medium, IBMPlexSansThai_600SemiBold, IBMPlexSansThai_700Bold,
  });
  // Wait for the saved demo/server choice so the first requests go to the right place.
  const mode = useDataMode();
  if (mode === undefined || (!fontsLoaded && !fontError)) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.background }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.background },
            headerTintColor: t.text,
            headerTitleStyle: { fontFamily: FONT.semibold },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="topup" options={{ presentation: 'modal' }} />
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
