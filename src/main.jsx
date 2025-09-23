import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { messaging } from "./firebase"; // Import Firebase messaging
import { getToken } from "firebase/messaging";

export async function subscribeToPush(token) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  let platform = 'web';
  if (isIOS) {
    platform = 'ios';
  } else if (isAndroid) {
    platform = 'android';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Push notification permission denied.");
    }

    let subscriptionToken;
    let token_type;

    const registration = await navigator.serviceWorker.ready;
    if (isIOS) {
      // Use Web Push for iOS
      if (!('PushManager' in window)) {
        throw new Error('Push messaging is not supported on this browser.');
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BMU_YCY4w8CyrDxvP5aQt-1KsAJT8huKF6zfJQoBAGN0Xvcdzmxn5E-h-PKYeJAKEVPnFgO1zz3bZCOzBQQe7t8"
        ),
      });
      subscriptionToken = subscription;
      token_type = 'web-push';
    } else {
      // Use FCM for Android/other
      // TODO: You need to replace 'YOUR_VAPID_KEY' with your actual VAPID key from Firebase console
      const fcmToken = await getToken(messaging, { 
        vapidKey: "BKjARESEQ_QEOC_QEGf7Ps86FAd3vvBSTeYbj8DUmSjGU6oWDaW0yzPA_EijKDJcE1_ImXFPi8yzE5srY9S82Gg",
        serviceWorkerRegistration: registration 
      });
      if (!fcmToken) {
        throw new Error("Could not get FCM token.");
      }
      subscriptionToken = { token: fcmToken }; // Standardize the token format
      token_type = 'fcm';
    }

    console.log(subscriptionToken, "subscription", token, "token", token_type, "token_type");
    await fetch("https://8c3e60ce26e2.ngrok-free.app/subscribe", {
      method: "POST",
      body: JSON.stringify({ token, subscription: subscriptionToken, token_type, platform }),
      headers: { "Content-Type": "application/json" },
    });
    console.log("Subscribed to push");

  } catch (error) {
    console.error("Subscription failed:", error);
    throw error;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
