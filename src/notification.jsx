import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Cache to prevent duplicate notifications
let notificationCache = {};

// Initialize notifications
export const initNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Notifications only work on native platforms");
    return false;
  }
  
  try {
    const permResult = await LocalNotifications.requestPermissions();
    return permResult.display === 'granted';
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

// Add notification click listener
export const addNotificationClickListener = (callback) => {
  if (!Capacitor.isNativePlatform()) return;
  
  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    if (notification.notification.extra) {
      callback(notification.notification.extra);
    }
  });
};

// Remove notification listeners
export const removeNotificationListeners = () => {
  if (!Capacitor.isNativePlatform()) return;
  LocalNotifications.removeAllListeners();
};

// Check readings and send notifications
export const checkReadingsAndNotify = (data, optimalRanges) => {
  if (!Capacitor.isNativePlatform()) return;
  
  Object.entries(optimalRanges).forEach(([key, range]) => {
    if (data[key] !== undefined) {
      const value = data[key];
      
      // Special handling for zero values
      if (value === 0) {
        sendSensorErrorNotification(range.name, key);
        return;
      }
      
      // Check if value is outside optimal range
      if (value < range.min || value > range.max) {
        sendOutOfRangeNotification(range.name, value, key, range.min, range.max);
      }
    }
  });
};

// Send notification for out-of-range values
const sendOutOfRangeNotification = async (paramName, value, paramKey, min, max) => {
  // Prevent duplicate notifications within 5 minutes
  const now = Date.now();
  const cacheKey = `${paramKey}_range`;
  if (notificationCache[cacheKey] && now - notificationCache[cacheKey] < 300000) {
    return;
  }
  notificationCache[cacheKey] = now;
  
  let status = value < min ? "low" : "high";
  let unit = getUnitForParam(paramKey);
  
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: `${paramName} Alert`,
          body: `Your ${paramName} (${value}${unit}) is ${status}. Tap for more information.`,
          id: Math.floor(Math.random() * 100000),
          extra: {
            param: paramName,
            value: value
          }
        }
      ]
    });
    console.log(`Notification sent for ${paramName}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// Send notification for zero value sensor error
const sendSensorErrorNotification = async (paramName, paramKey) => {
  // Prevent duplicate notifications within 5 minutes
  const now = Date.now();
  const cacheKey = `${paramKey}_error`;
  if (notificationCache[cacheKey] && now - notificationCache[cacheKey] < 300000) {
    return;
  }
  notificationCache[cacheKey] = now;
  
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: `${paramName} Sensor Error`,
          body: `Your ${paramName} sensor is reporting 0. This may indicate a sensor issue. Tap for details.`,
          id: Math.floor(Math.random() * 100000),
          extra: {
            param: paramName,
            value: 0
          }
        }
      ]
    });
    console.log(`Error notification sent for ${paramName}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// Get unit for parameter
const getUnitForParam = (paramKey) => {
  if (paramKey === "air_temp" || paramKey === "water_temp") return "°C";
  else if (paramKey === "humidity") return "%";
  else if (paramKey === "tds") return "ppm";
  return "";
};