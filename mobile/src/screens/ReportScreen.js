// src/screens/ReportScreen.js
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { submitReport } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";

const VIOLATIONS = [
  { id:"NO_HELMET",        icon:"⛑️",  label:"No Helmet",        points:50 },
  { id:"TRIPLE_RIDING",    icon:"🏍️",  label:"Triple Riding",    points:75 },
  { id:"SIGNAL_VIOLATION", icon:"🚦",  label:"Signal Violation", points:60 },
  { id:"ILLEGAL_PARKING",  icon:"🚫",  label:"Illegal Parking",  points:40 },
  { id:"WRONG_ROUTE",      icon:"↩️",  label:"Wrong Route",      points:55 },
  { id:"OVER_SPEEDING",    icon:"💨",  label:"Over-speeding",    points:80 },
];

export default function ReportScreen() {
  const navigation   = useNavigation();
  const route        = useRoute();
  const queryClient  = useQueryClient();

  const [step,       setStep]      = useState(0);
  const [violation,  setViolation] = useState(null);
  const [photoUri,   setPhotoUri]  = useState(route.params?.capturedPhoto?.uri || null);
  const [videoUri,   setVideoUri]  = useState(route.params?.capturedVideo?.uri || null);
  const [plate,      setPlate]     = useState("");
  const [notes,      setNotes]     = useState("");
  const [location,   setLocation]  = useState(null);
  const [anonymous,  setAnonymous] = useState(false);
  const [submitting, setSubmitting]= useState(false);

  // Update photo/video when returning from camera
  useEffect(() => {
    if (route.params?.capturedPhoto) setPhotoUri(route.params.capturedPhoto.uri);
    if (route.params?.capturedVideo) setVideoUri(route.params.capturedVideo.uri);
  }, [route.params]);

  // Get GPS location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const openCamera = (mode) => navigation.navigate("Camera", { mode });

  const submit = async () => {
    if (!location) return Alert.alert("Error", "Waiting for GPS location...");
    setSubmitting(true);
    try {
      await submitReport({
        violationType: violation.id,
        latitude:      location.latitude,
        longitude:     location.longitude,
        description:   notes,
        vehiclePlate:  plate,
        isAnonymous:   anonymous,
        photoUri,
        videoUri,
      });
      await queryClient.invalidateQueries(["myReports"]);
      navigation.navigate("Success");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "Submission failed. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ["Violation", "Evidence", "Details"];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step-1) : navigation.goBack()} style={s.backBtn}>
          <Text style={{ color:"#fff", fontSize:16 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Report Violation</Text>
      </View>

      {/* Progress */}
      <View style={s.progress}>
        {STEPS.map((st,i) => (
          <View key={st} style={{ flex:1 }}>
            <View style={[s.progressBar, i <= step && s.progressActive]}/>
            <Text style={[s.progressLabel, i===step && s.progressLabelActive]}>{st}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }}>

        {/* Step 0: Violation */}
        {step === 0 && (
          <>
            <Text style={s.sectionLabel}>What did you witness?</Text>
            <View style={s.grid}>
              {VIOLATIONS.map(v => (
                <TouchableOpacity key={v.id} onPress={() => setViolation(v)}
                  style={[s.violationCard, violation?.id===v.id && s.violationCardActive]}>
                  <Text style={{ fontSize:28, marginBottom:6 }}>{v.icon}</Text>
                  <Text style={s.violationLabel}>{v.label}</Text>
                  <Text style={s.violationPts}>+{v.points} pts</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.nextBtn, !violation && s.btnDisabled]} onPress={() => setStep(1)} disabled={!violation}>
              <Text style={s.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 1: Evidence */}
        {step === 1 && (
          <>
            {/* Location status */}
            <View style={[s.gpsCard, location && s.gpsCardActive]}>
              <Text style={{ fontSize:20 }}>📍</Text>
              <View style={{ flex:1, marginLeft:10 }}>
                <Text style={[s.gpsTitle, location && { color:"#38bdf8" }]}>
                  {location ? "GPS Location Locked" : "Acquiring GPS..."}
                </Text>
                {location && <Text style={s.gpsSub}>{location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E</Text>}
              </View>
              {location
                ? <View style={s.gpsDot}/>
                : <ActivityIndicator color="#38bdf8" size="small"/>}
            </View>

            {/* Photo */}
            <TouchableOpacity style={[s.captureBtn, photoUri && s.captureBtnDone]} onPress={() => openCamera("photo")}>
              <Text style={{ fontSize:36 }}>{photoUri ? "🖼️" : "📷"}</Text>
              <Text style={[s.captureTitle, photoUri && { color:"#22c55e" }]}>{photoUri ? "Photo Captured ✓" : "Capture Photo Evidence"}</Text>
              <Text style={s.captureSub}>{photoUri ? "Tap to retake" : "Required · Auto geo-tagged"}</Text>
            </TouchableOpacity>

            {/* Video */}
            <TouchableOpacity style={[s.captureBtn, s.captureBtnSmall, videoUri && s.captureBtnVideo]} onPress={() => openCamera("video")}>
              <Text style={{ fontSize:28 }}>{videoUri ? "🎬" : "🎥"}</Text>
              <View>
                <Text style={[s.captureTitle, videoUri && { color:"#ef4444" }]}>{videoUri ? "Video Recorded ✓" : "Record Video (optional)"}</Text>
                <Text style={s.captureSub}>Stronger evidence · Higher reward</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.nextBtn, !photoUri && s.btnDisabled]} onPress={() => setStep(2)} disabled={!photoUri}>
              <Text style={s.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <>
            <Text style={s.sectionLabel}>Vehicle Plate (optional)</Text>
            <TextInput style={s.textInput} value={plate} onChangeText={t => setPlate(t.toUpperCase())}
              placeholder="e.g. MH12AB1234" placeholderTextColor="#444"
              autoCapitalize="characters" maxLength={15} />

            <Text style={s.sectionLabel}>Notes (optional)</Text>
            <TextInput style={[s.textInput, s.textArea]} value={notes} onChangeText={setNotes}
              placeholder="Describe what happened..." placeholderTextColor="#444"
              multiline numberOfLines={3} />

            {/* Anonymous toggle */}
            <TouchableOpacity style={s.anonRow} onPress={() => setAnonymous(!anonymous)}>
              <View style={[s.checkbox, anonymous && s.checkboxActive]}>
                {anonymous && <Text style={{ color:"#fff", fontSize:12 }}>✓</Text>}
              </View>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={s.anonTitle}>Submit Anonymously</Text>
                <Text style={s.anonSub}>Your name won't be visible to authorities</Text>
              </View>
            </TouchableOpacity>

            {/* Summary */}
            <View style={s.summary}>
              {[
                ["Violation", violation?.label, violation?.icon],
                ["Evidence", `Photo${videoUri?", Video":""}`, "📎"],
                ["Location", location ? `${location.latitude.toFixed(3)}°N` : "...", "📍"],
                ["Potential Reward", `+${violation?.points} pts (₹${(violation?.points||0)/2})`, "💰"],
              ].map(([k,v,ico]) => (
                <View key={k} style={s.summaryRow}>
                  <Text style={s.summaryKey}>{ico} {k}</Text>
                  <Text style={s.summaryVal}>{v}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[s.nextBtn, s.submitBtn]} onPress={submit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff"/>
                : <Text style={s.nextBtnText}>🚀 Submit · Earn +{violation?.points} pts</Text>}
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:         { flex:1, backgroundColor:"#080d17" },
  header:            { flexDirection:"row", alignItems:"center", gap:12, padding:20 },
  backBtn:           { width:36, height:36, borderRadius:12, backgroundColor:"rgba(255,255,255,0.07)", alignItems:"center", justifyContent:"center" },
  title:             { color:"#fff", fontSize:20, fontWeight:"900" },
  progress:          { flexDirection:"row", gap:6, paddingHorizontal:20, marginBottom:4 },
  progressBar:       { height:3, borderRadius:2, backgroundColor:"rgba(255,255,255,0.1)", marginBottom:4 },
  progressActive:    { backgroundColor:"#f97316" },
  progressLabel:     { color:"rgba(255,255,255,0.3)", fontSize:10, fontWeight:"700", textTransform:"uppercase" },
  progressLabelActive:{ color:"#f97316" },
  sectionLabel:      { color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:1, marginBottom:12 },
  grid:              { flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:20 },
  violationCard:     { width:"48%", backgroundColor:"rgba(255,255,255,0.04)", borderRadius:16, padding:14, borderWidth:1, borderColor:"rgba(255,255,255,0.08)" },
  violationCardActive:{ borderColor:"#f97316", backgroundColor:"rgba(249,115,22,0.12)" },
  violationLabel:    { color:"#fff", fontSize:12, fontWeight:"800" },
  violationPts:      { color:"#f97316", fontSize:11, fontWeight:"600", marginTop:2 },
  nextBtn:           { backgroundColor:"#f97316", borderRadius:18, padding:16, alignItems:"center", marginTop:8 },
  btnDisabled:       { backgroundColor:"rgba(255,255,255,0.08)" },
  nextBtnText:       { color:"#fff", fontWeight:"900", fontSize:15 },
  submitBtn:         { backgroundColor:"#dc2626" },
  gpsCard:           { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(56,189,248,0.08)", borderRadius:14, padding:14, marginBottom:14, borderWidth:1, borderColor:"rgba(56,189,248,0.15)" },
  gpsCardActive:     { borderColor:"rgba(56,189,248,0.4)" },
  gpsTitle:          { color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:"700" },
  gpsSub:            { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  gpsDot:            { width:8, height:8, borderRadius:4, backgroundColor:"#22c55e" },
  captureBtn:        { backgroundColor:"rgba(255,255,255,0.04)", borderRadius:20, borderWidth:1.5, borderStyle:"dashed", borderColor:"rgba(255,255,255,0.15)", padding:20, alignItems:"center", marginBottom:10, minHeight:120, justifyContent:"center" },
  captureBtnDone:    { borderColor:"rgba(34,197,94,0.4)", borderStyle:"solid", backgroundColor:"rgba(34,197,94,0.06)" },
  captureBtnSmall:   { minHeight:80, flexDirection:"row", gap:14, alignItems:"center", justifyContent:"flex-start", paddingHorizontal:20 },
  captureBtnVideo:   { borderColor:"rgba(239,68,68,0.4)", borderStyle:"solid" },
  captureTitle:      { color:"rgba(255,255,255,0.8)", fontSize:14, fontWeight:"700", marginTop:6 },
  captureSub:        { color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2, textAlign:"center" },
  textInput:         { backgroundColor:"rgba(255,255,255,0.05)", borderRadius:14, padding:14, color:"#fff", fontSize:15, marginBottom:16, borderWidth:1, borderColor:"rgba(255,255,255,0.08)" },
  textArea:          { height:80, textAlignVertical:"top" },
  anonRow:           { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.04)", borderRadius:14, padding:14, marginBottom:16, borderWidth:1, borderColor:"rgba(255,255,255,0.08)" },
  checkbox:          { width:24, height:24, borderRadius:7, borderWidth:2, borderColor:"rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center" },
  checkboxActive:    { backgroundColor:"#f97316", borderColor:"#f97316" },
  anonTitle:         { color:"#fff", fontSize:13, fontWeight:"700" },
  anonSub:           { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  summary:           { backgroundColor:"rgba(249,115,22,0.08)", borderRadius:18, padding:16, marginBottom:16, borderWidth:1, borderColor:"rgba(249,115,22,0.2)" },
  summaryRow:        { flexDirection:"row", justifyContent:"space-between", marginBottom:10 },
  summaryKey:        { color:"rgba(255,255,255,0.5)", fontSize:13 },
  summaryVal:        { color:"#fff", fontSize:13, fontWeight:"700" },
});