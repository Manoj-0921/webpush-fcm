import { precacheAndRoute } from "workbox-precaching";
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// TODO: Add your own Firebase configuration here
const firebaseConfig = {
apiKey: "AIzaSyCJnkRJfxoFGnjbpzFweHcA88RFNZ6gLIU",
  authDomain: "fcm1-f49bf.firebaseapp.com",
  projectId: "fcm1-f49bf",
  storageBucket: "fcm1-f49bf.firebasestorage.app",
  messagingSenderId: "33514454153",
  appId: "1:33514454153:web:1b0b71240313e0f3c65a58"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle FCM background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/pwa-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Handle web push notifications (for iOS)
self.addEventListener("push", (event) => {
  // This listener will be triggered for web push notifications.
  // FCM messages are handled by onBackgroundMessage.
  // We can add a check to see if the push event is from FCM and ignore it,
  // but usually they don't overlap if configured correctly.

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "Push Notification";
  const options = {
    body: data.body || "You have a new message.",
    icon: "pwa-192x192.png",
    badge: "pwa-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});