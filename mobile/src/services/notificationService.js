// src/services/notificationService.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});
 
class NotificationService {
  async registerForPushNotifications() {
    if (!Device.isDevice) return null;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }
}
 
export const notificationService = new NotificationService();
 