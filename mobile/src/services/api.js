// src/services/api.js
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
 
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.roadwatch.in/v1";
 
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
 
// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["x-app-version"] = Constants.expoConfig?.version || "1.0.0";
  config.headers["x-platform"]    = "react-native";
  return config;
});
 
// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === "TOKEN_EXPIRED" && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync("accessToken",  data.tokens.access);
        await SecureStore.setItemAsync("refreshToken", data.tokens.refresh);
        original.headers.Authorization = `Bearer ${data.tokens.access}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        // Auth store will detect missing token and redirect to login
      }
    }
    return Promise.reject(error);
  }
);
 
// ── Report submission with multipart (photo/video upload) ─────────────────────
export const submitReport = async ({ violationType, latitude, longitude, description, vehiclePlate, isAnonymous, photoUri, videoUri }) => {
  const form = new FormData();
  form.append("violationType", violationType);
  form.append("latitude",      String(latitude));
  form.append("longitude",     String(longitude));
  if (description)   form.append("description",   description);
  if (vehiclePlate)  form.append("vehiclePlate",  vehiclePlate);
  if (isAnonymous)   form.append("isAnonymous",   "true");
 
  if (photoUri) {
    const ext = photoUri.split(".").pop();
    form.append("photos", { uri: photoUri, name: `evidence.${ext}`, type: `image/${ext === "jpg" ? "jpeg" : ext}` });
  }
  if (videoUri) {
    form.append("video", { uri: videoUri, name: "evidence.mp4", type: "video/mp4" });
  }
 
  const { data } = await api.post("/reports", form, {
    headers:        { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const pct = Math.round((e.loaded * 100) / e.total);
      console.log(`Upload: ${pct}%`);
    },
  });
  return data;
};