// ==========================================================
// firebase.js — ใช้กับ report.html (ฟอร์มแจ้งของหาย, ต้องล็อกอินก่อน) และ lost.html (รายการของหาย)
// ==========================================================
import { db, auth } from "./firebase-config.js";
import { syncUserDoc } from "./user-sync.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ฟังก์ชันแปลงรูปภาพเป็นข้อความ Base64 (แก้ปัญหา CORS ได้ชัวร์ 100%)
const convertBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });
};

// --- ระบบบันทึกข้อมูล (report.html) — บังคับต้องล็อกอินก่อน ---
const form = document.getElementById("lostForm");

if (form) {
  const userBar = document.getElementById("userBar");
  const userStatus = document.getElementById("userStatus");
  const reportSection = document.getElementById("reportSection");
  const logoutBtn = document.getElementById("userLogoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // ยังไม่ได้ล็อกอิน จำหน้านี้ไว้แล้วเด้งไปหน้า login
      sessionStorage.setItem("redirectAfterLogin", "report.html");
      window.location.href = "login.html";
      return;
    }
    userBar.style.display = "flex";
    reportSection.style.display = "block";
    userStatus.innerText = user.isAnonymous
      ? "เข้าใช้งานแบบไม่ระบุตัวตน"
      : "เข้าสู่ระบบในชื่อ: " + user.email;
    syncUserDoc(user);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector("#lostForm button[type='submit']");
    const reporterNameEl = document.getElementById("reporterName");
    const itemEl = document.getElementById("item");
    const imageEl = document.getElementById("image");
    const detailEl = document.getElementById("detail");
    const placeEl = document.getElementById("place");
    const contactEl = document.getElementById("contact");

    const file = imageEl ? imageEl.files[0] : null;
    let imageUrl = "";

    try {
      if (submitBtn) {
        submitBtn.innerText = "กำลังส่งข้อมูล...";
        submitBtn.disabled = true;
      }

      if (file) {
        if (file.size > 1.5 * 1024 * 1024) {
          alert("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 1.5MB ครับ");
          if (submitBtn) {
            submitBtn.innerText = "ส่งประกาศ";
            submitBtn.disabled = false;
          }
          return;
        }
        imageUrl = await convertBase64(file);
      }

      await addDoc(collection(db, "lostItems"), {
        item: itemEl.value,
        imageUrl: imageUrl,
        detail: detailEl.value,
        contact: contactEl.value,
        place: placeEl.value,
        reporterName: reporterNameEl.value,
        status: "lost",
        createdAt: new Date(),
        reporterUid: auth.currentUser ? auth.currentUser.uid : null
      });

      alert("ส่งประกาศสำเร็จ!");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.innerText = "ส่งประกาศ";
        submitBtn.disabled = false;
      }
    }
  });
}

// --- ระบบแสดงผลข้อมูล (lost.html) — แสดงเฉพาะรายการที่ยังไม่ถูกทำเครื่องหมายว่า "พบแล้ว" ---
const list = document.getElementById("lostList");

if (list) {
  const loadLostItems = async () => {
    try {
      const q = query(collection(db, "lostItems"), where("status", "==", "lost"));
      const snapshot = await getDocs(q);

      list.innerHTML = "";

      if (snapshot.empty) {
        list.innerHTML = "<p>ยังไม่มีรายการของหาย</p>";
        return;
      }

      // เรียงล่าสุดขึ้นก่อน (เรียงฝั่ง client กันปัญหาต้องสร้าง composite index)
      const docs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

      docs.forEach((data) => {
        const imageHTML = data.imageUrl
          ? `<img src="${data.imageUrl}" alt="${data.item}" style="width:150px; height:150px; object-fit:cover; border-radius:10px;">`
          : '';

        list.innerHTML += `
          <div class="card">
            <div class="item">
              ${imageHTML}
              <div>
                <h3>${data.item || 'ไม่ระบุชื่อสิ่งของ'}</h3>
                <p>${data.detail || ''}</p>
                <p><span class="meta-label">สถานที่</span>${data.place || 'ไม่ระบุสถานที่'}</p>
                <p><span class="meta-label">ติดต่อ</span>${data.contact || 'ไม่มีข้อมูลติดต่อ'}</p>
                <p><span class="meta-label">ผู้แจ้ง</span>${data.reporterName || 'ไม่ระบุชื่อ'}</p>
              </div>
            </div>
          </div>
        `;
      });
    } catch (err) {
      console.error("Error fetching docs: ", err);
      list.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ</p>";
    }
  };

  loadLostItems();
}
