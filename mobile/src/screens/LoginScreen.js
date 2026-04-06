// src/screens/LoginScreen.js
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
 
export default function LoginScreen() {
  const { login } = useAuthStore();
  const [phase,   setPhase]   = useState("phone");
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mode,    setMode]    = useState("user");
 
  const sendOtp = async () => {
    if (phone.length < 10) return Alert.alert("Error", "Enter a valid 10-digit mobile number.");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      setPhase("otp");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };
 
  const verifyOtp = async () => {
    if (otp.length < 6) return Alert.alert("Error", "Enter the 6-digit OTP.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, otp });
      // If authority mode, update role on backend or handle locally
      await login(data.tokens, { ...data.user, role: mode === "admin" ? "AUTHORITY" : data.user.role });
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "Invalid OTP.");
    } finally { setLoading(false); }
  };
 
  return (
    <SafeAreaView style={s.container}>
      <View style={s.logo}>
        <Text style={s.logoIcon}>🚔</Text>
        <Text style={s.logoTitle}>RoadWatch</Text>
        <Text style={s.logoSub}>Safer roads, together.</Text>
      </View>
 
      <View style={s.toggle}>
        {["user","admin"].map(m => (
          <TouchableOpacity key={m} onPress={() => setMode(m)}
            style={[s.toggleBtn, mode===m && s.toggleActive]}>
            <Text style={[s.toggleText, mode===m && s.toggleTextActive]}>
              {m === "user" ? "👤 Citizen" : "🛡️ Authority"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
 
      {phase === "phone" ? (
        <>
          <Text style={s.label}>Mobile Number</Text>
          <View style={s.phoneRow}>
            <View style={s.countryCode}><Text style={s.countryText}>🇮🇳 +91</Text></View>
            <TextInput style={s.input} value={phone} onChangeText={t => setPhone(t.replace(/\D/g,"").slice(0,10))}
              placeholder="10-digit number" placeholderTextColor="#444" keyboardType="phone-pad" maxLength={10} />
          </View>
          <TouchableOpacity style={[s.btn, phone.length<10 && s.btnDisabled]} onPress={sendOtp} disabled={loading||phone.length<10}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnText}>Send OTP →</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.label}>OTP sent to +91 {phone}</Text>
          <TextInput style={[s.input, s.otpInput]} value={otp} onChangeText={t => setOtp(t.replace(/\D/g,"").slice(0,6))}
            placeholder="6-digit OTP" placeholderTextColor="#444" keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={[s.btn, otp.length<6 && s.btnDisabled]} onPress={verifyOtp} disabled={loading||otp.length<6}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnText}>Verify & Login →</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPhase("phone"); setOtp(""); }}>
            <Text style={s.backLink}>← Change number</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
 
const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:"#080d17", padding:24, justifyContent:"center" },
  logo:            { alignItems:"center", marginBottom:40 },
  logoIcon:        { fontSize:64, marginBottom:12 },
  logoTitle:       { color:"#fff", fontSize:32, fontWeight:"900" },
  logoSub:         { color:"rgba(255,255,255,0.4)", fontSize:14, marginTop:4 },
  toggle:          { flexDirection:"row", backgroundColor:"rgba(255,255,255,0.05)", borderRadius:16, padding:4, marginBottom:28 },
  toggleBtn:       { flex:1, padding:12, borderRadius:13, alignItems:"center" },
  toggleActive:    { backgroundColor:"#f97316" },
  toggleText:      { color:"rgba(255,255,255,0.5)", fontWeight:"700" },
  toggleTextActive:{ color:"#fff" },
  label:           { color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:1, marginBottom:8 },
  phoneRow:        { flexDirection:"row", marginBottom:16 },
  countryCode:     { backgroundColor:"rgba(255,255,255,0.06)", borderRadius:12, padding:14, marginRight:8, justifyContent:"center" },
  countryText:     { color:"#fff", fontWeight:"700" },
  input:           { flex:1, backgroundColor:"rgba(255,255,255,0.06)", borderRadius:12, padding:14, color:"#fff", fontSize:16 },
  otpInput:        { flex:0, marginBottom:16, textAlign:"center", fontSize:24, letterSpacing:12 },
  btn:             { backgroundColor:"#f97316", borderRadius:16, padding:16, alignItems:"center", marginBottom:12 },
  btnDisabled:     { backgroundColor:"rgba(255,255,255,0.08)" },
  btnText:         { color:"#fff", fontWeight:"900", fontSize:16 },
  backLink:        { color:"rgba(255,255,255,0.4)", textAlign:"center", marginTop:8 },
});
 