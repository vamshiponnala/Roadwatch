// src/navigation/RootNavigator.js
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuthStore } from "../store/authStore";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user } = useAuthStore();
  return (
    <NavigationContainer theme={{ colors: { background: "#080d17" } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
