// ==========================================================
// user.js — ใช้กับ login.html (ล็อกอินผู้ใช้ทั่วไป)
// ==========================================================
import { auth } from "./firebase-config.js";
import { syncUserDoc } from "./user-sync.js";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const anonBtn = document.getElementById("anonBtn");
const showEmailFormLink = document.getElementById("showEmailFormLink");
const userForm = document.getElementById("userForm");
const switchModeLink = document.getElementById("switchModeLink");
const switchText = document.getElementById("switchText");
const userSubmitBtn = document.getElementById("userSubmitBtn");
const errorEl = document.getElementById("userError");
const successEl = document.getElementById("userSuccess");

if (anonBtn) {
  let mode = "login"; // หรือ "signup"

  // ถ้าล็อกอินอยู่แล้ว (ไม่ว่าแบบไหน) ให้เด้งกลับหน้าแรกทันที
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "index.html";
      sessionStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectTo;
    }
  });

  function showError(msg) {
    errorEl.innerText = msg;
    errorEl.style.display = "block";
    successEl.style.display = "none";
  }

  // ---- เข้าใช้งานแบบไม่ระบุตัวตน ----
  anonBtn.addEventListener("click", async () => {
    errorEl.style.display = "none";
    anonBtn.innerText = "กำลังเข้าสู่ระบบ...";
    anonBtn.disabled = true;
    try {
      const cred = await signInAnonymously(auth);
      await syncUserDoc(cred.user);
      // onAuthStateChanged ด้านบนจะ redirect ให้เอง
    } catch (err) {
      console.error(err);
      showError("เข้าใช้งานไม่สำเร็จ: " + err.message);
      anonBtn.innerText = "เข้าใช้งานแบบไม่ระบุตัวตน"
      anonBtn.disabled = false;
    }
  });

  // ---- สลับแสดงฟอร์มอีเมล ----
  if (showEmailFormLink) {
    showEmailFormLink.addEventListener("click", (e) => {
      e.preventDefault();
      userForm.style.display = userForm.style.display === "none" ? "block" : "none";
    });
  }

  // ---- สลับโหมด login / สมัครสมาชิก ----
  if (switchModeLink) {
    switchModeLink.addEventListener("click", (e) => {
      e.preventDefault();
      mode = mode === "login" ? "signup" : "login";
      if (mode === "signup") {
        userSubmitBtn.innerText = "สมัครสมาชิก";
        switchText.innerText = "มีบัญชีอยู่แล้ว?";
        switchModeLink.innerText = "เข้าสู่ระบบ";
      } else {
        userSubmitBtn.innerText = "เข้าสู่ระบบ";
        switchText.innerText = "ยังไม่มีบัญชี?";
        switchModeLink.innerText = "สมัครสมาชิก";
      }
      errorEl.style.display = "none";
      successEl.style.display = "none";
    });
  }

  // ---- ส่งฟอร์มอีเมล/รหัสผ่าน ----
  if (userForm) {
    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("uEmail").value;
      const password = document.getElementById("uPassword").value;

      errorEl.style.display = "none";
      userSubmitBtn.disabled = true;

      try {
        let cred;
        if (mode === "signup") {
          cred = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          cred = await signInWithEmailAndPassword(auth, email, password);
        }
        await syncUserDoc(cred.user);
        // onAuthStateChanged ด้านบนจะ redirect ให้เอง
      } catch (err) {
        console.error(err);
        let msg = "เกิดข้อผิดพลาด: " + err.message;
        if (err.code === "auth/email-already-in-use") msg = "อีเมลนี้ถูกใช้สมัครไปแล้ว ลองเข้าสู่ระบบแทน";
        if (err.code === "auth/invalid-credential") msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        if (err.code === "auth/weak-password") msg = "รหัสผ่านสั้นเกินไป ต้องอย่างน้อย 6 ตัวอักษร";
        showError(msg);
      } finally {
        userSubmitBtn.disabled = false;
      }
    });
  }
}
