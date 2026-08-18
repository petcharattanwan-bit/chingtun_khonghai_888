// ==========================================================
// profile.js — ใช้กับ profile.html ผู้ใช้ดู/แก้สถานะ/ลบโพสต์ของตัวเอง
// ==========================================================
import { db, auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const myPosts = document.getElementById("myPosts");
const profileBar = document.getElementById("profileBar");
const profileStatus = document.getElementById("profileStatus");
const logoutBtn = document.getElementById("profileLogoutBtn");

if (myPosts) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "profile.html");
      window.location.href = "login.html";
      return;
    }
    profileBar.style.display = "flex";
    profileStatus.innerText = user.isAnonymous
      ? "เข้าใช้งานแบบไม่ระบุตัวตน"
      : "เข้าสู่ระบบในชื่อ: " + user.email;
    loadMyPosts(user.uid);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }

  async function loadMyPosts(uid) {
    try {
      const q = query(collection(db, "lostItems"), where("reporterUid", "==", uid));
      const snapshot = await getDocs(q);

      myPosts.innerHTML = "";

      if (snapshot.empty) {
        myPosts.innerHTML = "<p>คุณยังไม่เคยแจ้งของหายไว้</p>";
        return;
      }

      const docs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

      docs.forEach((data) => {
        const isFound = data.status === "found";

        const imageHTML = data.imageUrl
          ? `<img src="${data.imageUrl}" alt="${data.item}" style="width:110px; height:110px; object-fit:cover; border-radius:8px;">`
          : '';

        const badge = isFound
          ? `<span class="badge badge-found">พบแล้ว</span>`
          : `<span class="badge badge-lost">ยังหาย</span>`;

        const row = document.createElement("div");
        row.className = "card";
        row.innerHTML = `
          <div class="item">
            ${imageHTML}
            <div style="flex:1;">
              <h3>${data.item || 'ไม่ระบุชื่อสิ่งของ'} ${badge}</h3>
              <p>${data.detail || ''}</p>
              <p><span class="meta-label">สถานที่</span>${data.place || 'ไม่ระบุสถานที่'}</p>
              <p><span class="meta-label">ติดต่อ</span>${data.contact || 'ไม่มีข้อมูลติดต่อ'}</p>
              <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
                <button class="my-toggle-btn btn-outline" data-id="${data.id}" data-found="${isFound}">
                  ${isFound ? 'เปลี่ยนเป็นยังหาย' : 'ทำเครื่องหมายว่าพบแล้ว'}
                </button>
                <button class="my-delete-btn btn-danger" data-id="${data.id}">ลบโพสต์นี้</button>
              </div>
            </div>
          </div>
        `;
        myPosts.appendChild(row);
      });

      document.querySelectorAll(".my-toggle-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const currentlyFound = btn.dataset.found === "true";
          try {
            btn.disabled = true;
            await updateDoc(doc(db, "lostItems", id), {
              status: currentlyFound ? "lost" : "found"
            });
            loadMyPosts(auth.currentUser.uid);
          } catch (err) {
            console.error(err);
            alert("อัปเดตสถานะไม่สำเร็จ: " + err.message);
            btn.disabled = false;
          }
        });
      });

      document.querySelectorAll(".my-delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (!confirm("ยืนยันลบโพสต์นี้? ลบแล้วไม่สามารถกู้คืนได้")) return;
          try {
            btn.disabled = true;
            await deleteDoc(doc(db, "lostItems", id));
            loadMyPosts(auth.currentUser.uid);
          } catch (err) {
            console.error(err);
            alert("ลบไม่สำเร็จ: " + err.message);
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      console.error(err);
      myPosts.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ</p>";
    }
  }
}
