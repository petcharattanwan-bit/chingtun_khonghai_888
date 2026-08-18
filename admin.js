// ==========================================================
// admin.js — ใช้กับ admin-login.html และ admin.html
// ==========================================================
import { db, auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---------------------------------------------------------
// ส่วนที่ 1: admin-login.html — ฟอร์มเข้าสู่ระบบ
// ---------------------------------------------------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists()) window.location.href = "admin.html";
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const errorEl = document.getElementById("loginError");

    errorEl.style.display = "none";
    loginBtn.innerText = "กำลังเข้าสู่ระบบ...";
    loginBtn.disabled = true;

    try {
      const cred = await signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value);

      const adminDoc = await getDoc(doc(db, "admins", cred.user.uid));
      if (!adminDoc.exists()) {
        await signOut(auth);
        errorEl.innerText = "บัญชีนี้ไม่มีสิทธิ์เข้าหลังบ้าน";
        errorEl.style.display = "block";
        return;
      }

      window.location.href = "admin.html";
    } catch (err) {
      console.error(err);
      errorEl.innerText = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      errorEl.style.display = "block";
    } finally {
      loginBtn.innerText = "เข้าสู่ระบบ";
      loginBtn.disabled = false;
    }
  });
}

// ---------------------------------------------------------
// ส่วนที่ 2: admin.html — แดชบอร์ด (รายการของหาย + ผู้ใช้งาน)
// ---------------------------------------------------------
const adminList = document.getElementById("adminList");

if (adminList) {
  const adminEmailEl = document.getElementById("adminEmail");
  const logoutBtn = document.getElementById("logoutBtn");
  const tabItemsBtn = document.getElementById("tabItemsBtn");
  const tabUsersBtn = document.getElementById("tabUsersBtn");
  const usersPanel = document.getElementById("usersPanel");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "admin-login.html";
      return;
    }

    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      window.location.href = "admin-login.html";
      return;
    }

    adminEmailEl.innerText = "เข้าสู่ระบบในชื่อ: " + user.email;
    loadAllItems();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "admin-login.html";
    });
  }

  // ---- สลับแท็บ ----
  if (tabItemsBtn && tabUsersBtn) {
    tabItemsBtn.addEventListener("click", () => {
      tabItemsBtn.classList.add("active");
      tabUsersBtn.classList.remove("active");
      adminList.style.display = "block";
      usersPanel.style.display = "none";
    });

    tabUsersBtn.addEventListener("click", () => {
      tabUsersBtn.classList.add("active");
      tabItemsBtn.classList.remove("active");
      adminList.style.display = "none";
      usersPanel.style.display = "block";
      loadAllUsers();
    });
  }

  // ---- แท็บ: รายการของหาย/พบแล้ว ----
  async function loadAllItems() {
    try {
      const q = query(collection(db, "lostItems"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      adminList.innerHTML = "";

      if (snapshot.empty) {
        adminList.innerHTML = "<p>ยังไม่มีรายการในระบบ</p>";
        return;
      }

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
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
              <p><span class="meta-label">ผู้แจ้ง</span>${data.reporterName || 'ไม่ระบุชื่อ'}</p>
              <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
                <button class="toggle-btn btn-outline" data-id="${id}" data-found="${isFound}">
                  ${isFound ? 'เปลี่ยนเป็นยังหาย' : 'ทำเครื่องหมายว่าพบแล้ว'}
                </button>
                <button class="delete-btn btn-danger" data-id="${id}">ลบรายการ</button>
              </div>
            </div>
          </div>
        `;
        adminList.appendChild(row);
      });

      document.querySelectorAll(".toggle-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const currentlyFound = btn.dataset.found === "true";
          try {
            btn.disabled = true;
            await updateDoc(doc(db, "lostItems", id), {
              status: currentlyFound ? "lost" : "found"
            });
            loadAllItems();
          } catch (err) {
            console.error(err);
            alert("อัปเดตสถานะไม่สำเร็จ: " + err.message);
            btn.disabled = false;
          }
        });
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (!confirm("ยืนยันการลบรายการนี้? ลบแล้วไม่สามารถกู้คืนได้")) return;
          try {
            btn.disabled = true;
            await deleteDoc(doc(db, "lostItems", id));
            loadAllItems();
          } catch (err) {
            console.error(err);
            alert("ลบไม่สำเร็จ: " + err.message);
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      console.error(err);
      adminList.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ</p>";
    }
  }

  // ---- แท็บ: ผู้ใช้งานทั้งหมด (ไม่ต้องเข้า Firebase Console) ----
  async function loadAllUsers() {
    if (usersPanel.dataset.loaded === "true") return;
    usersPanel.innerHTML = "<p>กำลังโหลดข้อมูล...</p>";

    try {
      const q = query(collection(db, "users"), orderBy("lastLogin", "desc"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        usersPanel.innerHTML = "<p>ยังไม่มีผู้ใช้งานเข้าสู่ระบบ</p>";
        return;
      }

      let rows = "";
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const type = u.isAnonymous ? "ไม่ระบุตัวตน" : "บัญชีอีเมล";
        const identity = u.isAnonymous ? "-" : (u.email || "-");
        const lastLogin = u.lastLogin?.toDate
          ? u.lastLogin.toDate().toLocaleString("th-TH")
          : "-";

        rows += `
          <tr>
            <td>${identity}</td>
            <td>${type}</td>
            <td>${lastLogin}</td>
            <td style="font-size:0.78rem; color:var(--text-muted);">${u.uid}</td>
          </tr>
        `;
      });

      usersPanel.innerHTML = `
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>อีเมล</th>
                <th>ประเภทบัญชี</th>
                <th>เข้าสู่ระบบล่าสุด</th>
                <th>UID</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
      usersPanel.dataset.loaded = "true";
    } catch (err) {
      console.error(err);
      usersPanel.innerHTML = "<p>โหลดข้อมูลผู้ใช้ไม่สำเร็จ</p>";
    }
  }
}
