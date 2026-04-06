// src/screens/SuccessScreen.js
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function SuccessScreen() {
  const navigation = useNavigation();
  useEffect(() => { setTimeout(() => navigation.navigate("Home"), 3000); }, []);
  return (
    <View style={ss.container}>
      <Text style={ss.icon}>✅</Text>
      <Text style={ss.title}>Report Submitted!</Text>
      <Text style={ss.sub}>Authorities have been notified. You'll earn points upon verification.</Text>
      <View style={ss.card}>
        <Text style={ss.cardLabel}>Potential Reward</Text>
        <Text style={ss.cardPts}>+50 pts</Text>
        <Text style={ss.cardSub}>on verification</Text>
      </View>
      <Text style={ss.redirect}>Returning to home...</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex:1, backgroundColor:"#080d17", alignItems:"center", justifyContent:"center", padding:32 },
  icon:      { fontSize:80, marginBottom:24 },
  title:     { color:"#fff", fontSize:28, fontWeight:"900", marginBottom:8 },
  sub:       { color:"rgba(255,255,255,0.5)", fontSize:14, textAlign:"center", lineHeight:22, marginBottom:32 },
  card:      { backgroundColor:"rgba(249,115,22,0.1)", borderRadius:24, padding:28, alignItems:"center", borderWidth:1.5, borderColor:"rgba(249,115,22,0.3)", marginBottom:24 },
  cardLabel: { color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700", textTransform:"uppercase" },
  cardPts:   { color:"#f97316", fontSize:52, fontWeight:"900" },
  cardSub:   { color:"#f97316", fontSize:14, fontWeight:"700" },
  redirect:  { color:"rgba(255,255,255,0.25)", fontSize:12 },
});
export default SuccessScreen;