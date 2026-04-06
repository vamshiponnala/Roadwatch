// src/services/socketService.js
import { io } from "socket.io-client";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
 
const BASE_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/v1","") || "https://api.roadwatch.in";
 
class SocketService {
  socket = null;
 
  connect(userId, role) {
    if (this.socket?.connected) return;
    this.socket = io(BASE_URL, { transports: ["websocket"], autoConnect: true });
 
    this.socket.on("connect", () => {
      this.socket.emit("join", { userId, role });
    });
 
    // Reporter: notified when their report is verified
    this.socket.on("report_verified", ({ points, challanNumber }) => {
      Toast.show({
        type:  "success",
        text1: `✅ Report Verified! +${points} points earned`,
        text2: challanNumber ? `Challan #${challanNumber} issued` : "Reward credited to your account",
      });
    });
 
    // Reporter: notified when their report is rejected
    this.socket.on("report_rejected", ({ notes }) => {
      Toast.show({
        type:  "error",
        text1: "Report Rejected",
        text2: notes || "The evidence did not meet verification standards.",
      });
    });
 
    // Admin: new report submitted
    this.socket.on("new_report", ({ violationType, city }) => {
      Toast.show({
        type:  "info",
        text1: `New Report: ${violationType.replace("_"," ")}`,
        text2: city || "Location unknown",
      });
    });
  }
 
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
 
export const socketService = new SocketService();
 
// ─────────────────────────