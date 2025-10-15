// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, } from "firebase/messaging";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// TODO: Add your own Firebase configuration here
const firebaseConfig = {
apiKey: "AIzaSyCJnkRJfxoFGnjbpzFweHcA88RFNZ6gLIU",
  authDomain: "fcm1-f49bf.firebaseapp.com",
  projectId: "fcm1-f49bf",
  storageBucket: "fcm1-f49bf.firebasestorage.app",
  messagingSenderId: "33514454153",
  appId: "1:33514454153:web:1b0b71240313e0f3c65a58",
  measurementId: "G-L3VRK2SYWQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// // Handle foreground messages
onMessage(messaging, (payload) => {
    if (document.visibilityState !== "visible") {
    // Don't show toast if not visible (let sw.js handle notification)
    return;
  }
  const notificationTitle = payload.notification?.title || payload.data?.title;
  const notificationBody = payload.notification?.body || payload.data?.body;

  if (notificationTitle && notificationBody) {
    toast.info(`${notificationTitle}\n${notificationBody}`, {
      position: "top-right",
      autoClose: 5000,
      closeButton:false
    });
  }
});


