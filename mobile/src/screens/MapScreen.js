// src/screens/MapScreen.js
// Google Maps + heatmap overlay powered by /api/v1/map/heatmap
import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Dimensions
} from "react-native";
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

const VIOLATION_FILTERS = [
  { id:"all",             label:"All",       color:"#f97316" },
  { id:"NO_HELMET",       label:"Helmet",    color:"#ef4444" },
  { id:"SIGNAL_VIOLATION",label:"Signal",    color:"#eab308" },
  { id:"ILLEGAL_PARKING", label:"Parking",   color:"#8b5cf6" },
  { id:"OVER_SPEEDING",   label:"Speed",     color:"#ec4899" },
];

// Pune city center
const DEFAULT_REGION = {
  latitude:      18.5204,
  longitude:     73.8567,
  latitudeDelta:  0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const mapRef      = useRef(null);
  const [region,    setRegion]    = useState(DEFAULT_REGION);
  const [filter,    setFilter]    = useState("all");
  const [userLoc,   setUserLoc]   = useState(null);
  const [selected,  setSelected]  = useState(null);

  // ── Fetch heatmap data from backend ─────────────────────────────────────────
  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ["heatmap", filter],
    queryFn:  () => api.get(`/map/heatmap${filter !== "all" ? `?violationType=${filter}` : ""}`).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: hotspots } = useQuery({
    queryKey: ["hotspots"],
    queryFn:  () => api.get("/map/hotspots").then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  // ── Get user location ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLoc(coords);

      // Center map on user
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta:  0.1,
        longitudeDelta: 0.1,
      }, 800);
    })();
  }, []);

  const goToMyLocation = () => {
    if (!userLoc) return;
    mapRef.current?.animateToRegion({ ...userLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
  };

  // Convert backend points → react-native-maps Heatmap format
  const heatPoints = (heatmapData?.points || []).map(p => ({
    latitude:  p.lat,
    longitude: p.lng,
    weight:    p.weight || 1,
  }));

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={setRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Heatmap layer */}
        {heatPoints.length > 0 && (
          <Heatmap
            points={heatPoints}
            opacity={0.75}
            radius={40}
            maxIntensity={10}
            gradientSmoothing={10}
            heatmapMode="POINTS_WEIGHT"
            gradient={{
              colors:     ["#22c55e", "#eab308", "#f97316", "#ef4444"],
              startPoints:[0.1, 0.4, 0.7, 1.0],
              colorMapSize: 256,
            }}
          />
        )}

        {/* Hotspot Markers */}
        {(hotspots?.hotspots || []).slice(0, 8).map((h, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: parseFloat(h.lat), longitude: parseFloat(h.lng) }}
            onPress={() => setSelected(h)}
          >
            <View style={styles.markerBubble}>
              <Text style={styles.markerCount}>{h.count}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#f97316" />
        </View>
      )}

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Violation Heatmap</Text>
          <Text style={styles.headerSub}>{heatmapData?.count || 0} reports plotted</Text>
        </View>
      </SafeAreaView>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {VIOLATION_FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterPill, filter === f.id && { backgroundColor: f.color + "33", borderColor: f.color }]}
            >
              <Text style={[styles.filterLabel, filter === f.id && { color: f.color }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocBtn} onPress={goToMyLocation}>
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>

      {/* Selected Hotspot Card */}
      {selected && (
        <View style={styles.hotspotCard}>
          <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
            <View>
              <Text style={styles.hotspotCity}>{selected.city || "Unknown Area"}</Text>
              <Text style={styles.hotspotCoords}>{parseFloat(selected.lat).toFixed(4)}°N, {parseFloat(selected.lng).toFixed(4)}°E</Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={{ color:"rgba(255,255,255,0.4)", fontSize:18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.hotspotStats}>
            <View style={styles.hotspotStat}>
              <Text style={styles.hotspotStatVal}>{selected.count}</Text>
              <Text style={styles.hotspotStatLbl}>Violations</Text>
            </View>
            <View style={styles.hotspotStat}>
              <Text style={[styles.hotspotStatVal, { color:"#ef4444" }]}>High</Text>
              <Text style={styles.hotspotStatLbl}>Risk Level</Text>
            </View>
          </View>
        </View>
      )}

      {/* Hotspot List (bottom) */}
      {!selected && (
        <View style={styles.bottomList}>
          <Text style={styles.bottomListTitle}>🔥 Top Hotspots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
            {(hotspots?.hotspots || []).slice(0, 5).map((h, i) => (
              <TouchableOpacity
                key={i}
                style={styles.hotspotChip}
                onPress={() => {
                  mapRef.current?.animateToRegion({ latitude: parseFloat(h.lat), longitude: parseFloat(h.lng), latitudeDelta: 0.03, longitudeDelta: 0.03 }, 600);
                  setSelected(h);
                }}
              >
                <Text style={styles.chipRank}>#{i + 1}</Text>
                <Text style={styles.chipCity}>{h.city || "Zone"}</Text>
                <Text style={styles.chipCount}>{h.count} reports</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:"#080d17" },
  loadingOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.3)", alignItems:"center", justifyContent:"center" },
  header:          { position:"absolute", top:0, left:0, right:0 },
  headerCard:      { margin:16, backgroundColor:"rgba(8,13,23,0.85)", borderRadius:16, padding:"12px 16px", backdropFilter:"blur(12px)", borderWidth:1, borderColor:"rgba(255,255,255,0.08)", padding:14 },
  headerTitle:     { color:"#fff", fontSize:18, fontFamily:"Outfit-Bold" },
  headerSub:       { color:"rgba(255,255,255,0.4)", fontSize:12, fontFamily:"Outfit-Regular", marginTop:2 },
  filterRow:       { position:"absolute", top:100, left:0, right:0 },
  filterPill:      { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:"rgba(0,0,0,0.55)", borderWidth:1, borderColor:"rgba(255,255,255,0.12)" },
  filterLabel:     { color:"rgba(255,255,255,0.6)", fontSize:12, fontFamily:"Outfit-SemiBold" },
  myLocBtn:        { position:"absolute", right:16, bottom:220, width:48, height:48, borderRadius:24, backgroundColor:"rgba(8,13,23,0.9)", alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:"rgba(255,255,255,0.1)" },
  markerBubble:    { backgroundColor:"rgba(239,68,68,0.9)", borderRadius:14, paddingHorizontal:8, paddingVertical:4, borderWidth:1.5, borderColor:"#fff" },
  markerCount:     { color:"#fff", fontSize:11, fontFamily:"Outfit-Bold" },
  hotspotCard:     { position:"absolute", bottom:100, left:16, right:16, backgroundColor:"rgba(13,17,27,0.95)", borderRadius:20, padding:18, borderWidth:1, borderColor:"rgba(249,115,22,0.3)" },
  hotspotCity:     { color:"#fff", fontSize:16, fontFamily:"Outfit-Bold" },
  hotspotCoords:   { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  hotspotStats:    { flexDirection:"row", gap:24, marginTop:14 },
  hotspotStat:     { alignItems:"center" },
  hotspotStatVal:  { color:"#f97316", fontSize:22, fontFamily:"Outfit-Black" },
  hotspotStatLbl:  { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
  bottomList:      { position:"absolute", bottom:90, left:0, right:0, paddingLeft:16 },
  bottomListTitle: { color:"rgba(255,255,255,0.5)", fontSize:11, fontFamily:"Outfit-Bold", letterSpacing:1, textTransform:"uppercase", marginBottom:10 },
  hotspotChip:     { backgroundColor:"rgba(13,17,27,0.9)", borderRadius:14, padding:12, borderWidth:1, borderColor:"rgba(255,255,255,0.08)", minWidth:110 },
  chipRank:        { color:"#f97316", fontSize:13, fontFamily:"Outfit-Bold" },
  chipCity:        { color:"#fff", fontSize:13, fontFamily:"Outfit-SemiBold", marginTop:2 },
  chipCount:       { color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 },
});

// Google Maps dark style
const darkMapStyle = [
  { elementType:"geometry",       stylers:[{ color:"#0d1117" }] },
  { elementType:"labels.text.fill",stylers:[{ color:"#6b7280" }] },
  { elementType:"labels.text.stroke",stylers:[{ color:"#0d1117" }] },
  { featureType:"road",elementType:"geometry",stylers:[{ color:"#1f2937" }] },
  { featureType:"road",elementType:"geometry.stroke",stylers:[{ color:"#111827" }] },
  { featureType:"road.highway",elementType:"geometry",stylers:[{ color:"#374151" }] },
  { featureType:"water",elementType:"geometry",stylers:[{ color:"#0c1830" }] },
  { featureType:"poi",elementType:"geometry",stylers:[{ color:"#111827" }] },
  { featureType:"transit",elementType:"geometry",stylers:[{ color:"#1f2937" }] },
];