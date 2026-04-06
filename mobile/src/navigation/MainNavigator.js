// src/navigation/MainNavigator.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator }     from "@react-navigation/stack";
import { Text, View }               from "react-native";
import { useAuthStore }             from "../store/authStore";
 
import HomeScreen        from "../screens/HomeScreen";
import ReportScreen      from "../screens/ReportScreen";
import CameraScreen      from "../screens/CameraScreen";
import MapScreen         from "../screens/MapScreen";
import DashboardScreen   from "../screens/DashboardScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import AdminScreen       from "../screens/AdminScreen";
 
const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();
 
// Report flow is a stack: Report → Camera → back to Report
function ReportStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportForm" component={ReportScreen} />
      <Stack.Screen name="Camera"     component={CameraScreen}
        options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
 
export default function MainNavigator() {
  const { user } = useAuthStore();
  const isAdmin  = user?.role === "AUTHORITY" || user?.role === "ADMIN";
 
  const icon = (emoji) => ({ focused }) => (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
 
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:          false,
        tabBarStyle:          { backgroundColor: "#090e1a", borderTopColor: "rgba(255,255,255,0.06)", paddingBottom: 8, height: 64 },
        tabBarActiveTintColor:  "#f97316",
        tabBarInactiveTintColor:"rgba(255,255,255,0.35)",
        tabBarLabelStyle:     { fontSize: 9, fontFamily: "Outfit-Bold", letterSpacing: 0.5 },
      }}
    >
      {isAdmin ? (
        <>
          <Tab.Screen name="Admin"       component={AdminScreen}       options={{ tabBarLabel:"Review",   tabBarIcon: icon("🛡️") }} />
          <Tab.Screen name="MapTab"      component={MapScreen}         options={{ tabBarLabel:"Heatmap",  tabBarIcon: icon("🗺️") }} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarLabel:"Leaders",  tabBarIcon: icon("🏆") }} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home"        component={HomeScreen}        options={{ tabBarLabel:"Home",     tabBarIcon: icon("🏠") }} />
          <Tab.Screen name="Report"      component={ReportStack}       options={{ tabBarLabel:"Report",   tabBarIcon: icon("📸") }} />
          <Tab.Screen name="MapTab"      component={MapScreen}         options={{ tabBarLabel:"Map",      tabBarIcon: icon("🗺️") }} />
          <Tab.Screen name="Dashboard"   component={DashboardScreen}   options={{ tabBarLabel:"My Reports",tabBarIcon: icon("📊") }} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarLabel:"Leaders",  tabBarIcon: icon("🏆") }} />
        </>
      )}
    </Tab.Navigator>
  );
}
 