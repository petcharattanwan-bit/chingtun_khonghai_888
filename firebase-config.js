// ==========================================================
// firebase-config.js
// ไฟล์ตั้งค่า Firebase กลาง — ให้ไฟล์อื่น import จากที่นี่ที่เดียว
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWOPzlKNSwfh0ni4Kt4-KS_kqKcsOXCHk",
  authDomain: "lostproject-8e695.firebaseapp.com",
  projectId: "lostproject-8e695",
  storageBucket: "lostproject-8e695.firebasestorage.app",
  messagingSenderId: "225958914608",
  appId: "1:225958914608:web:b2ee04258ca7885094dbf5",
  measurementId: "G-3CMQ3G4BP1"
};

const app = initializeApp(firebaseConfig);

// analytics อาจใช้ไม่ได้ในบางเบราว์เซอร์/โหมด ไม่ให้ error ทำให้เว็บพัง
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
