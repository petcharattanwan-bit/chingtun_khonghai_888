// ==========================================================
// user-sync.js — บันทึก/อัปเดตข้อมูลผู้ใช้ลง Firestore collection "users"
// เรียกใช้ทุกครั้งที่ผู้ใช้ล็อกอินสำเร็จ เพื่อให้ admin ดูรายชื่อผู้ใช้ได้จากในเว็บ
// ==========================================================
import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function syncUserDoc(user) {
  if (!user) return;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || null,
        isAnonymous: user.isAnonymous,
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.error("บันทึกข้อมูลผู้ใช้ไม่สำเร็จ:", err);
  }
}
