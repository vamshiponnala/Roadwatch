// src/screens/DashboardScreen.js
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

const STATUS_COLOR = { VERIFIED:"#22c55e", PENDING:"#eab308", REJECTED:"#ef4444" };

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("ALL");
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["myReports","all"], queryFn: () => api.get("/reports?limit=50").then(r => r.data),
  });
  const { data: balance } = useQuery({
    queryKey: ["balance"], queryFn: () => api.get("/rewards/balance").then(r => r.data),
  });

  const reports  = data?.reports || [];
  const filtered = tab==="ALL" ? reports : reports.filter(r => r.status===tab);
  const verified = reports.filter(r => r.status==="VERIFIED").length;
  const pending  = reports.filter(r => r.status==="PENDING").length;

  const withdraw = async () => {
    const rupees = balance?.rupees || 0;
    if (rupees < 10) return Alert.alert("Insufficient Balance", "Minimum withdrawal is ₹10.");
    Alert.prompt("Withdraw to UPI", "Enter your UPI ID (e.g. name@upi)", async (upiId) => {
      if (!upiId) return;
      try {
        await api.post("/rewards/withdraw", { upiId, amount: rupees });
        Alert.alert("Success", `₹${rupees} transfer initiated to ${upiId}`);
      } catch (e) {
        Alert.alert("Error", e.response?.data?.error || "Withdrawal failed.");
      }
    });
  };

  return (
    <SafeAreaView style={d.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316"/>}>
        <Text style={d.title}>My Dashboard</Text>

        <View style={d.statsGrid}>
          {[
            { label:"Total",    val:reports.length, color:"#fff"  },
            { label:"Verified", val:verified,        color:"#22c55e" },
            { label:"Pending",  val:pending,         color:"#eab308" },
            { label:"Points",   val:user?.pointsBalance||0, color:"#f97316" },
          ].map(s => (
            <View key={s.label} style={d.statCard}>
              <Text style={[d.statVal, { color:s.color }]}>{s.val}</Text>
              <Text style={d.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={d.withdrawCard}>
          <View>
            <Text style={d.wLabel}>Available Balance</Text>
            <Text style={d.wAmount}>₹{balance?.rupees?.toFixed(0) || 0}</Text>
          </View>
          <TouchableOpacity style={d.wBtn} onPress={withdraw}>
            <Text style={d.wBtnText}>💳 Withdraw</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft:20, marginBottom:14 }}
          contentContainerStyle={{ gap:8 }}>
          {["ALL","VERIFIED","PENDING","REJECTED"].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[d.tabBtn, tab===t && d.tabBtnActive]}>
              <Text style={[d.tabText, tab===t && { color:"#fff" }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(r => (
          <View key={r.id} style={d.reportCard}>
            <View style={{ flex:1 }}>
              <Text style={d.rViolation}>{r.violationType.replace(/_/g," ")}</Text>
              <Text style={d.rLocation}>📍 {r.address || r.city || "Unknown"}</Text>
              <Text style={d.rTime}>{new Date(r.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems:"flex-end" }}>
              <View style={[d.badge, { backgroundColor: STATUS_COLOR[r.status]+"22" }]}>
                <Text style={[d.badgeText, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
              </View>
              {r.pointsAwarded > 0 && <Text style={d.pts}>+{r.pointsAwarded} pts</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
  container:    { flex:1, backgroundColor:"#080d17" },
  title:        { color:"#fff", fontSize:22, fontWeight:"900", padding:20 },
  statsGrid:    { flexDirection:"row", flexWrap:"wrap", gap:10, paddingHorizontal:20, marginBottom:16 },
  statCard:     { flex:1, minWidth:"45%", backgroundColor:"rgba(255,255,255,0.04)", borderRadius:18, padding:16, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  statVal:      { fontSize:26, fontWeight:"900" },
  statLabel:    { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  withdrawCard: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", backgroundColor:"#14532d", borderRadius:22, margin:20, marginTop:0, padding:18 },
  wLabel:       { color:"rgba(255,255,255,0.7)", fontSize:12, marginBottom:4 },
  wAmount:      { color:"#fff", fontSize:28, fontWeight:"900" },
  wBtn:         { backgroundColor:"rgba(255,255,255,0.15)", borderRadius:14, padding:12 },
  wBtnText:     { color:"#fff", fontWeight:"800" },
  tabBtn:       { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:"rgba(255,255,255,0.05)" },
  tabBtnActive: { backgroundColor:"#f97316" },
  tabText:      { color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700" },
  reportCard:   { flexDirection:"row", backgroundColor:"rgba(255,255,255,0.04)", marginHorizontal:20, marginBottom:8, borderRadius:16, padding:14, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  rViolation:   { color:"#fff", fontSize:14, fontWeight:"800" },
  rLocation:    { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:3 },
  rTime:        { color:"rgba(255,255,255,0.25)", fontSize:10, marginTop:2 },
  badge:        { borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  badgeText:    { fontSize:9, fontWeight:"800", textTransform:"uppercase" },
  pts:          { color:"#f97316", fontSize:11, fontWeight:"700", marginTop:4 },
});

// ─────────────────────────────────────────────────────────────────────────────