// src/screens/HomeScreen.js
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
 
export function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["myReports"], queryFn: () => api.get("/reports?limit=3").then(r => r.data),
  });
 
  const STATUS_COLOR = { VERIFIED:"#22c55e", PENDING:"#eab308", REJECTED:"#ef4444" };
  const reports = data?.reports || [];
 
  return (
    <SafeAreaView style={h.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316"/>}>
        <View style={h.header}>
          <View>
            <Text style={h.greeting}>Good morning 👋</Text>
            <Text style={h.name}>{user?.name || "Citizen"}</Text>
          </View>
          <View style={h.avatar}><Text style={h.avatarText}>{(user?.name||"U")[0].toUpperCase()}</Text></View>
        </View>
 
        <View style={h.heroCard}>
          <Text style={h.heroLabel}>Your Impact Score</Text>
          <View style={h.heroRow}>
            <View><Text style={h.heroPts}>{user?.pointsBalance?.toLocaleString() || 0}</Text><Text style={h.heroSub}>Points Earned</Text></View>
            <View><Text style={h.heroCount}>{reports.length}</Text><Text style={h.heroSub}>Reports Filed</Text></View>
          </View>
          <TouchableOpacity style={h.withdrawBtn}>
            <Text style={h.withdrawText}>💰 ₹{Math.floor((user?.pointsBalance||0)/2)} available • Withdraw to UPI</Text>
          </TouchableOpacity>
        </View>
 
        <View style={h.actions}>
          <TouchableOpacity style={h.actionReport} onPress={() => navigation.navigate("Report")}>
            <Text style={{ fontSize:28 }}>📸</Text>
            <Text style={h.actionTitle}>Report Violation</Text>
            <Text style={h.actionSub}>Earn up to 80 pts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={h.actionMap} onPress={() => navigation.navigate("MapTab")}>
            <Text style={{ fontSize:28 }}>🗺️</Text>
            <Text style={h.actionTitle}>View Heatmap</Text>
            <Text style={h.actionSubBlue}>Live hotspots</Text>
          </TouchableOpacity>
        </View>
 
        <Text style={h.sectionTitle}>Recent Activity</Text>
        {reports.map(r => (
          <View key={r.id} style={h.reportCard}>
            <Text style={{ fontSize:22 }}>🚗</Text>
            <View style={{ flex:1, marginLeft:12 }}>
              <Text style={h.reportViolation}>{r.violationType.replace(/_/g," ")}</Text>
              <Text style={h.reportLocation}>📍 {r.address || r.city || "Unknown"} · {new Date(r.createdAt).toLocaleDateString()}</Text>
            </View>
            <View>
              <View style={[h.badge, { backgroundColor: STATUS_COLOR[r.status]+"22" }]}>
                <Text style={[h.badgeText, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
              </View>
              {r.pointsAwarded > 0 && <Text style={h.pts}>+{r.pointsAwarded} pts</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
 
const h = StyleSheet.create({
  container:     { flex:1, backgroundColor:"#080d17" },
  header:        { flexDirection:"row", justifyContent:"space-between", alignItems:"center", padding:20 },
  greeting:      { color:"rgba(255,255,255,0.4)", fontSize:12, fontWeight:"700" },
  name:          { color:"#fff", fontSize:22, fontWeight:"900" },
  avatar:        { width:46, height:46, borderRadius:23, backgroundColor:"#f97316", alignItems:"center", justifyContent:"center" },
  avatarText:    { color:"#fff", fontSize:20, fontWeight:"900" },
  heroCard:      { margin:20, marginTop:0, backgroundColor:"#f97316", borderRadius:24, padding:22 },
  heroLabel:     { color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:"700", textTransform:"uppercase", marginBottom:8 },
  heroRow:       { flexDirection:"row", gap:32, marginBottom:16 },
  heroPts:       { color:"#fff", fontSize:42, fontWeight:"900" },
  heroCount:     { color:"#fff", fontSize:28, fontWeight:"900" },
  heroSub:       { color:"rgba(255,255,255,0.7)", fontSize:12 },
  withdrawBtn:   { backgroundColor:"rgba(255,255,255,0.2)", borderRadius:12, padding:10 },
  withdrawText:  { color:"#fff", fontSize:13, fontWeight:"700", textAlign:"center" },
  actions:       { flexDirection:"row", gap:12, paddingHorizontal:20, marginBottom:20 },
  actionReport:  { flex:1, backgroundColor:"rgba(249,115,22,0.1)", borderRadius:20, padding:18, borderWidth:1.5, borderColor:"rgba(249,115,22,0.3)" },
  actionMap:     { flex:1, backgroundColor:"rgba(56,189,248,0.08)", borderRadius:20, padding:18, borderWidth:1.5, borderColor:"rgba(56,189,248,0.2)" },
  actionTitle:   { color:"#fff", fontSize:14, fontWeight:"800", marginTop:8 },
  actionSub:     { color:"#f97316", fontSize:11, marginTop:2 },
  actionSubBlue: { color:"#38bdf8", fontSize:11, marginTop:2 },
  sectionTitle:  { color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:1, paddingHorizontal:20, marginBottom:12 },
  reportCard:    { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.04)", marginHorizontal:20, marginBottom:8, borderRadius:16, padding:14, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  reportViolation:{ color:"#fff", fontSize:13, fontWeight:"700" },
  reportLocation: { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  badge:          { borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  badgeText:      { fontSize:9, fontWeight:"800", textTransform:"uppercase" },
  pts:            { color:"#f97316", fontSize:11, fontWeight:"700", marginTop:4, textAlign:"right" },
});
 
export default HomeScreen;