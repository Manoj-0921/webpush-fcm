import { precacheAndRoute } from "workbox-precaching";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCJnkRJfxoFGnjbpzFweHcA88RFNZ6gLIU",
  authDomain: "fcm1-f49bf.firebaseapp.com",
  projectId: "fcm1-f49bf",
  storageBucket: "fcm1-f49bf.firebasestorage.app",
  messagingSenderId: "33514454153",
  appId: "1:33514454153:web:1b0b71240313e0f3c65a58"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle FCM background messages (Android only)
onBackgroundMessage(messaging, (payload) => {
  const notificationTitle = payload.data?.title || "Notification";
  const notificationOptions = {
    body: payload.data?.body || "You have a new message.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
// Handle Web Push notifications (iOS/Safari)
self.addEventListener("push", (event) => {
  console.log("[sw.js] Push received.", event);

  try {
    if (event.data) {
      const data = event.data.json();
      if (data && data["firebase-messaging-msg-data"]) {
        // It's an FCM message, skip handling here
        return;
      }
    }
  } catch (e) {
    // continue to handle as web push
  }

  // Handle as a normal web push
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: "Push", body: "You have a new messasdsdssdsdge." };
  }

  const title = data.title;
  const body = data.body;

  if (title && body) {
    const options = {
      body: body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
  // If title or body is missing, do not display a notification
});

// (Optional) Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

