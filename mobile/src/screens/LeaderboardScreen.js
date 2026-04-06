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
//