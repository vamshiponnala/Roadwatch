// src/store/authStore.js
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";

export const useAuthStore = create((set, get) => ({
  user:    null,
  loading: false,

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;
      try {
        const { data } = await api.get("/auth/me");
        set({ user: data.user });
      } catch (error) {
        console.error("Error loading stored auth:", error.message);
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
      }
    } catch (error) {
      console.error("Critical error in loadStoredAuth:", error);
    }
  },

  login: async (tokens, user) => {
    try {
      set({ loading: true });
      await SecureStore.setItemAsync("accessToken",  tokens.access);
      await SecureStore.setItemAsync("refreshToken", tokens.refresh);
      set({ user, loading: false });
    } catch (error) {
      console.error("Error during login:", error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      try { await api.post("/auth/logout"); } catch (error) {
        console.warn("Logout API call failed:", error.message);
      }
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      set({ user: null, loading: false });
    } catch (error) {
      console.error("Critical error during logout:", error);
      set({ loading: false });
      throw error;
    }
  },

  updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
}));

// ────────────────────────────────────────────────────────────────────────────────
