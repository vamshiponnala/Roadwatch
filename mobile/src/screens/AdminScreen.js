// src/screens/LeaderboardScreen.js
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["leaderboard"], queryFn: () => api.get("/users/leaderboard").then(r => r.data),
  });
  const list = data?.leaderboard || [];

  return (
    <SafeAreaView style={l.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316"/>}>
        <Text style={l.title}>Leaderboard 🏆</Text>
        <Text style={l.sub}>Top citizen reporters this month</Text>

        {/* Podium */}
        {list.length >= 3 && (
          <View style={l.podium}>
            {[list[1], list[0], list[2]].map((p, i) => {
              const heights = [90, 120, 75];
              const colors  = ["#94a3b8","#f97316","#b45309"];
              return (
                <View key={p.id} style={l.podiumItem}>
                  <Text style={l.podiumName}>{(p.name||p.phone||"?").split(" ")[0]}</Text>
                  <Text style={{ fontSize:18 }}>{["🥈","🥇","🥉"][i]}</Text>
                  <View style={[l.podiumBar, { height:heights[i], backgroundColor:colors[i] }]}>
                    <Text style={l.podiumRank}>#{[2,1,3][i]}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {list.map(p => {
          const isMe = p.id === user?.id;
          return (
            <View key={p.id} style={[l.row, isMe && l.rowMe]}>
              <Text style={[l.rank, isMe && { color:"#f97316" }]}>#{p.rank}</Text>
              <View style={[l.avatar, isMe && l.avatarMe]}>
                <Text style={l.avatarText}>{(p.name||p.phone||"?")[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={[l.name, isMe && { color:"#f97316" }]}>{p.name||p.phone}{isMe?" (You)":""}</Text>
                <Text style={l.reportCount}>{p._count?.reports||0} reports filed</Text>
              </View>
              <View style={{ alignItems:"flex-end" }}>
                <Text style={l.points}>{p.pointsBalance?.toLocaleString()}</Text>
                <Text style={l.ptsLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const l = StyleSheet.create({
  container:   { flex:1, backgroundColor:"#080d17" },
  title:       { color:"#fff", fontSize:22, fontWeight:"900", paddingHorizontal:20, paddingTop:20 },
  sub:         { color:"rgba(255,255,255,0.4)", fontSize:13, paddingHorizontal:20, marginBottom:20 },
  podium:      { flexDirection:"row", justifyContent:"center", alignItems:"flex-end", gap:10, marginBottom:24, height:160 },
  podiumItem:  { alignItems:"center", gap:5 },
  podiumName:  { color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:"700" },
  podiumBar:   { width:68, borderRadius:12, alignItems:"center", paddingTop:8 },
  podiumRank:  { color:"#fff", fontWeight:"900", fontSize:16 },
  row:         { flexDirection:"row", alignItems:"center", gap:14, backgroundColor:"rgba(255,255,255,0.04)", marginHorizontal:20, marginBottom:8, borderRadius:18, padding:14, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  rowMe:       { backgroundColor:"rgba(249,115,22,0.09)", borderColor:"rgba(249,115,22,0.35)" },
  rank:        { color:"rgba(255,255,255,0.4)", fontSize:15, fontWeight:"900", width:28 },
  avatar:      { width:38, height:38, borderRadius:19, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" },
  avatarMe:    { backgroundColor:"#f97316" },
  avatarText:  { color:"#fff", fontWeight:"800" },
  name:        { color:"#fff", fontSize:14, fontWeight:"800" },
  reportCount: { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  points:      { color:"#f97316", fontSize:16, fontWeight:"900" },
  ptsLabel:    { color:"rgba(255,255,255,0.35)", fontSize:10 },
});

// ─────────────────────────────────────────────────────────────────────────────
// src/screens/AdminScreen.js
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

const STATUS_COLOR = { VERIFIED:"#22c55e", PENDING:"#eab308", REJECTED:"#ef4444" };

export function AdminScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab]       = useState("PENDING");
  const [expanded, setExpanded] = useState(null);

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["adminReports", tab],
    queryFn:  () => api.get(`/admin/reports?status=${tab}&limit=30`).then(r => r.data),
  });
  const { data: statsData } = useQuery({
    queryKey: ["adminStats"], queryFn: () => api.get("/admin/stats").then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, notes, challanNumber }) =>
      api.patch(`/admin/reports/${id}/review`, { action, notes, challanNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminReports"]);
      queryClient.invalidateQueries(["adminStats"]);
      setExpanded(null);
    },
    onError: (e) => Alert.alert("Error", e.response?.data?.error || "Action failed."),
  });

  const approve = (report) => {
    Alert.prompt("Issue Challan", "Enter challan number (optional)", (challan) => {
      reviewMutation.mutate({ id:report.id, action:"APPROVE", challanNumber:challan||undefined });
    });
  };

  const reject = (report) => {
    Alert.prompt("Reject Report", "Reason for rejection (optional)", (notes) => {
      reviewMutation.mutate({ id:report.id, action:"REJECT", notes:notes||undefined });
    });
  };

  const stats   = statsData?.stats;
  const reports = data?.reports || [];

  return (
    <SafeAreaView style={a.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316"/>}>
        <View style={a.header}>
          <View><Text style={a.subtitle}>Traffic Authority</Text><Text style={a.title}>Admin Panel 🛡️</Text></View>
          {stats && <View style={a.pendingBadge}><Text style={a.pendingText}>{stats.pending} Pending</Text></View>}
        </View>

        {stats && (
          <View style={a.statsRow}>
            {[["Pending",stats.pending,"#eab308"],["Verified",stats.verified,"#22c55e"],["Total",stats.total,"#38bdf8"]].map(([k,v,c]) => (
              <View key={k} style={a.statCard}>
                <Text style={[a.statVal, { color:c }]}>{v}</Text>
                <Text style={a.statLabel}>{k}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft:20, marginBottom:14 }}
          contentContainerStyle={{ gap:8 }}>
          {["PENDING","VERIFIED","REJECTED"].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[a.tabBtn, tab===t && a.tabActive]}>
              <Text style={[a.tabText, tab===t && { color:"#fff" }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {reports.map(r => (
          <TouchableOpacity key={r.id} style={[a.card, expanded===r.id && a.cardExpanded]} onPress={() => setExpanded(expanded===r.id?null:r.id)}>
            <View style={a.cardTop}>
              <View style={a.iconWrap}><Text style={{ fontSize:22 }}>🚗</Text></View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                  <Text style={a.violation}>{r.violationType.replace(/_/g," ")}</Text>
                  <View style={[a.badge, { backgroundColor: STATUS_COLOR[r.status]+"22" }]}>
                    <Text style={[a.badgeText, { color: STATUS_COLOR[r.status] }]}>{r.status}</Text>
                  </View>
                </View>
                <Text style={a.location}>📍 {r.address || r.city || "Unknown"}</Text>
                <Text style={a.reporter}>👤 {r.reporter?.phone || "Anonymous"} · {new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>

            {expanded===r.id && r.status==="PENDING" && (
              <View style={a.actions}>
                <TouchableOpacity style={a.approveBtn} onPress={() => approve(r)} disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? <ActivityIndicator color="#fff" size="small"/> : <Text style={a.approveTxt}>✅ Approve & Issue Challan</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={a.rejectBtn} onPress={() => reject(r)} disabled={reviewMutation.isPending}>
                  <Text style={a.rejectTxt}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            )}
            {expanded===r.id && r.status==="VERIFIED" && (
              <View style={a.verifiedNote}>
                <Text style={{ color:"#22c55e", fontSize:12, fontWeight:"700" }}>✅ Verified · Challan: {r.challanNumber||"N/A"} · +{r.pointsAwarded} pts awarded</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  container:    { flex:1, backgroundColor:"#080d17" },
  header:       { flexDirection:"row", justifyContent:"space-between", alignItems:"center", padding:20 },
  subtitle:     { color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:"700", textTransform:"uppercase" },
  title:        { color:"#fff", fontSize:22, fontWeight:"900" },
  pendingBadge: { backgroundColor:"rgba(249,115,22,0.15)", borderRadius:12, padding:"6px 12px", paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:"rgba(249,115,22,0.3)" },
  pendingText:  { color:"#f97316", fontSize:12, fontWeight:"700" },
  statsRow:     { flexDirection:"row", gap:10, paddingHorizontal:20, marginBottom:16 },
  statCard:     { flex:1, backgroundColor:"rgba(255,255,255,0.04)", borderRadius:16, padding:14, alignItems:"center", borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  statVal:      { fontSize:22, fontWeight:"900" },
  statLabel:    { color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:2 },
  tabBtn:       { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:"rgba(255,255,255,0.05)" },
  tabActive:    { backgroundColor:"#f97316" },
  tabText:      { color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700" },
  card:         { backgroundColor:"rgba(255,255,255,0.04)", marginHorizontal:20, marginBottom:10, borderRadius:20, padding:16, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  cardExpanded: { borderColor:"rgba(249,115,22,0.4)", backgroundColor:"rgba(249,115,22,0.06)" },
  cardTop:      { flexDirection:"row", gap:12 },
  iconWrap:     { width:44, height:44, borderRadius:14, backgroundColor:"rgba(249,115,22,0.12)", alignItems:"center", justifyContent:"center" },
  violation:    { color:"#fff", fontSize:14, fontWeight:"800" },
  location:     { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:3 },
  reporter:     { color:"rgba(255,255,255,0.3)", fontSize:10, marginTop:2 },
  badge:        { borderRadius:20, paddingHorizontal:8, paddingVertical:3, alignSelf:"flex-start" },
  badgeText:    { fontSize:9, fontWeight:"800", textTransform:"uppercase" },
  actions:      { flexDirection:"row", gap:8, marginTop:14 },
  approveBtn:   { flex:1, backgroundColor:"#16a34a", borderRadius:14, padding:12, alignItems:"center" },
  approveTxt:   { color:"#fff", fontWeight:"800", fontSize:13 },
  rejectBtn:    { flex:1, backgroundColor:"rgba(239,68,68,0.15)", borderRadius:14, padding:12, alignItems:"center", borderWidth:1, borderColor:"rgba(239,68,68,0.3)" },
  rejectTxt:    { color:"#ef4444", fontWeight:"800", fontSize:13 },
  verifiedNote: { marginTop:12, backgroundColor:"rgba(34,197,94,0.08)", borderRadius:12, padding:10 },
});

export default AdminScreen;