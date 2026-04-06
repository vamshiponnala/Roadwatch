// src/store/authStore.js
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";
 
export const useAuthStore = create((set, get) => ({
  user:    null,
  loading: false,
 
  loadStoredAuth: async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user });
    } catch {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
  },
 
  login: async (tokens, user) => {
    await SecureStore.setItemAsync("accessToken",  tokens.access);
    await SecureStore.setItemAsync("refreshToken", tokens.refresh);
    set({ user });
  },
 
  logout: async () => {
    try { await api.post("/auth/logout"); } catch {}
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    set({ user: null });
  },
 
  updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
}));
 
// ─────────────────────────────────────────────────────────────────────────────