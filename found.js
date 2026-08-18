// ==========================================================
// found.js — ใช้กับ found.html แสดงรายการของที่ถูกทำเครื่องหมายว่า "พบแล้ว" จาก admin
// ==========================================================
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const list = document.getElementById("foundList");

if (list) {
  const loadFoundItems = async () => {
    try {
      const q = query(collection(db, "lostItems"), where("status", "==", "found"));
      const snapshot = await getDocs(q);

      list.innerHTML = "";

      if (snapshot.empty) {
        list.innerHTML = "<p>ยังไม่มีรายการของที่พบแล้ว</p>";
        return;
      }

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
                <p><span class="meta-label">พบที่</span>${data.place || 'ไม่ระบุสถานที่'}</p>
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

  loadFoundItems();
}
