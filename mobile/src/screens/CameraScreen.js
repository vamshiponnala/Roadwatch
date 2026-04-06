// src/screens/CameraScreen.js
// Real expo-camera integration with photo/video capture, flash, flip, zoom
import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Alert, Platform
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const navigation  = useNavigation();
  const route       = useRoute();
  const mode        = route.params?.mode || "photo"; // "photo" | "video"

  const [cameraPermission,  requestCameraPermission]  = useCameraPermissions();
  const [micPermission,     requestMicPermission]     = useMicrophonePermissions();
  const [mediaPermission,   requestMediaPermission]   = MediaLibrary.usePermissions();

  const [facing,    setFacing]    = useState("back");
  const [flash,     setFlash]     = useState("off");
  const [zoom,      setZoom]      = useState(0);
  const [isRecording, setRecording] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const cameraRef   = useRef(null);
  const timerRef    = useRef(null);

  // ── Request all permissions on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted)  await requestCameraPermission();
      if (!micPermission?.granted)     await requestMicPermission();
      if (!mediaPermission?.granted)   await requestMediaPermission();
    })();
  }, []);

  // ── Recording timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  // ── Take Photo ──────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    if (!cameraRef.current || loading) return;
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality:    0.85,
        base64:     false,
        exif:       true,          // captures timestamp + device info
        skipProcessing: false,
      });

      // Save to device library
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      // Pass URI back to ReportScreen
      navigation.navigate("ReportForm", {
        capturedPhoto: { uri: photo.uri, width: photo.width, height: photo.height },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
      console.error("Photo capture error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Record Video ────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    try {
      setRecording(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 30,           // 30 second cap
        quality:     "720p",
        mute:        false,
      });

      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(video.uri);
      }

      navigation.navigate("ReportForm", { capturedVideo: { uri: video.uri } });
    } catch (err) {
      console.error("Video record error:", err);
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    cameraRef.current.stopRecording();
  };

  // ── Permission gates ─────────────────────────────────────────────────────────
  if (!cameraPermission) return <LoadingView />;

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <Text style={styles.permTitle}>📷 Camera Access Needed</Text>
        <Text style={styles.permText}>RoadWatch needs camera access to capture violation evidence.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        zoom={zoom}
        mode={mode === "video" ? "video" : "picture"}
      />

      {/* Recording badge */}
      {isRecording && (
        <View style={styles.recordingBadge}>
          <View style={styles.recDot} />
          <Text style={styles.recTime}>{formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={styles.iconTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.topRight}>
          {/* Flash */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFlash(f => f === "off" ? "on" : f === "on" ? "auto" : "off")}
          >
            <Text style={styles.iconTxt}>
              {flash === "off" ? "⚡️" : flash === "on" ? "🔦" : "⚡A"}
            </Text>
          </TouchableOpacity>

          {/* Flip */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing(f => f === "back" ? "front" : "back")}
          >
            <Text style={styles.iconTxt}>🔄</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Viewfinder guide */}
      <View style={styles.viewfinder} pointerEvents="none">
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <Text style={styles.guideTxt}>Frame the violation clearly</Text>
      </View>

      {/* Zoom Slider */}
      <View style={styles.zoomRow}>
        {[0, 0.25, 0.5, 0.75, 1].map(z => (
          <TouchableOpacity key={z} onPress={() => setZoom(z)} style={[styles.zoomBtn, zoom === z && styles.zoomActive]}>
            <Text style={[styles.zoomTxt, zoom === z && { color: "#f97316" }]}>{z === 0 ? "1×" : z === 0.25 ? "2×" : z === 0.5 ? "3×" : z === 0.75 ? "4×" : "5×"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Shutter Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        {/* Thumbnail placeholder */}
        <View style={styles.thumbPlaceholder} />

        {/* Shutter */}
        {mode === "photo" ? (
          <TouchableOpacity
            style={[styles.shutter, loading && styles.shutterDisabled]}
            onPress={takePhoto}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#f97316" size="large" />
              : <View style={styles.shutterInner} />
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.shutter, isRecording && styles.shutterRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <View style={[styles.shutterInner, isRecording && styles.shutterStopInner]} />
          </TouchableOpacity>
        )}

        {/* Mode toggle */}
        <TouchableOpacity style={styles.modeToggle} onPress={() => navigation.setParams({ mode: mode === "photo" ? "video" : "photo" })}>
          <Text style={styles.modeToggleTxt}>{mode === "photo" ? "🎥" : "📷"}</Text>
          <Text style={styles.modeToggleLabel}>{mode === "photo" ? "Video" : "Photo"}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function LoadingView() {
  return (
    <View style={{ flex:1, backgroundColor:"#000", alignItems:"center", justifyContent:"center" }}>
      <ActivityIndicator color="#f97316" size="large" />
    </View>
  );
}

const SHUTTER_SIZE = 78;
const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:"#000" },
  permContainer:    { flex:1, backgroundColor:"#080d17", alignItems:"center", justifyContent:"center", padding:32 },
  permTitle:        { color:"#fff", fontSize:24, fontFamily:"Outfit-Bold", marginBottom:12, textAlign:"center" },
  permText:         { color:"rgba(255,255,255,0.5)", fontSize:14, textAlign:"center", marginBottom:32, lineHeight:22 },
  permBtn:          { backgroundColor:"#f97316", borderRadius:16, paddingVertical:14, paddingHorizontal:40, marginBottom:16 },
  permBtnText:      { color:"#fff", fontSize:15, fontFamily:"Outfit-Bold" },
  backText:         { color:"rgba(255,255,255,0.4)", fontSize:14 },
  topControls:      { position:"absolute", top:0, left:0, right:0, flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingTop:8 },
  topRight:         { flexDirection:"row", gap:12 },
  iconBtn:          { width:44, height:44, borderRadius:22, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center" },
  iconTxt:          { fontSize:18 },
  recordingBadge:   { position:"absolute", top:100, alignSelf:"center", flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(239,68,68,0.85)", borderRadius:20, paddingHorizontal:16, paddingVertical:6 },
  recDot:           { width:8, height:8, borderRadius:4, backgroundColor:"#fff" },
  recTime:          { color:"#fff", fontSize:14, fontFamily:"Outfit-Bold" },
  viewfinder:       { position:"absolute", top:"25%", left:"10%", right:"10%", height:"45%", justifyContent:"flex-end", alignItems:"center" },
  corner:           { position:"absolute", width:24, height:24, borderColor:"rgba(255,255,255,0.7)", borderWidth:2 },
  tl:               { top:0, left:0, borderRightWidth:0, borderBottomWidth:0 },
  tr:               { top:0, right:0, borderLeftWidth:0, borderBottomWidth:0 },
  bl:               { bottom:30, left:0, borderRightWidth:0, borderTopWidth:0 },
  br:               { bottom:30, right:0, borderLeftWidth:0, borderTopWidth:0 },
  guideTxt:         { color:"rgba(255,255,255,0.6)", fontSize:12, fontFamily:"Outfit-SemiBold", marginBottom:8 },
  zoomRow:          { position:"absolute", bottom:140, alignSelf:"center", flexDirection:"row", gap:8, backgroundColor:"rgba(0,0,0,0.45)", borderRadius:24, padding:6 },
  zoomBtn:          { paddingHorizontal:12, paddingVertical:6, borderRadius:18 },
  zoomActive:       { backgroundColor:"rgba(249,115,22,0.25)" },
  zoomTxt:          { color:"rgba(255,255,255,0.7)", fontSize:13, fontFamily:"Outfit-SemiBold" },
  bottomBar:        { position:"absolute", bottom:0, left:0, right:0, flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:32, paddingBottom:24, paddingTop:16, backgroundColor:"rgba(0,0,0,0.5)" },
  thumbPlaceholder: { width:52, height:52, borderRadius:10, backgroundColor:"rgba(255,255,255,0.1)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)" },
  shutter:          { width:SHUTTER_SIZE, height:SHUTTER_SIZE, borderRadius:SHUTTER_SIZE/2, borderWidth:4, borderColor:"#fff", alignItems:"center", justifyContent:"center" },
  shutterInner:     { width:SHUTTER_SIZE-20, height:SHUTTER_SIZE-20, borderRadius:(SHUTTER_SIZE-20)/2, backgroundColor:"#fff" },
  shutterDisabled:  { opacity:0.5 },
  shutterRecording: { borderColor:"#ef4444" },
  shutterStopInner: { width:26, height:26, borderRadius:4, backgroundColor:"#ef4444" },
  modeToggle:       { width:52, alignItems:"center", gap:4 },
  modeToggleTxt:    { fontSize:22 },
  modeToggleLabel:  { color:"rgba(255,255,255,0.6)", fontSize:11, fontFamily:"Outfit-SemiBold" },
});