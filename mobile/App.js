// App.js — RoadWatch root entry point
import { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

import RootNavigator from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/authStore";
import { notificationService } from "./src/services/notificationService";
import { socketService } from "./src/services/socketService";

// Keep splash visible until fonts + auth are ready
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
});

export default function App() {
  const { loadStoredAuth, user } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts
        await Font.loadAsync({
          "Outfit-Regular": require("./assets/fonts/Outfit-Regular.ttf"),
          "Outfit-SemiBold": require("./assets/fonts/Outfit-SemiBold.ttf"),
          "Outfit-Bold":    require("./assets/fonts/Outfit-Bold.ttf"),
          "Outfit-ExtraBold": require("./assets/fonts/Outfit-ExtraBold.ttf"),
          "Outfit-Black":   require("./assets/fonts/Outfit-Black.ttf"),
        });
        // Restore auth session from SecureStore
        await loadStoredAuth();
        // Register push notifications
        await notificationService.registerForPushNotifications();
      } catch (e) {
        console.warn("App prepare error:", e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // Connect socket when user logs in
  useEffect(() => {
    if (user) {
      socketService.connect(user.id, user.role);
    } else {
      socketService.disconnect();
    }
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <RootNavigator />
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}