// ==========================================================
// lightbox.js — คลิกรูปใน .item เพื่อเปิดดูรูปเต็มจอ
// ใช้กับ lost.html, found.html, admin.html
// ==========================================================
function ensureOverlay() {
  let overlay = document.getElementById("imgLightbox");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "imgLightbox";
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.88);
    display:none; align-items:center; justify-content:center;
    z-index:9999; cursor:zoom-out; padding:24px;
  `;

  const img = document.createElement("img");
  img.id = "imgLightboxImg";
  img.style.cssText = "max-width:92%; max-height:92%; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.5);";
  overlay.appendChild(img);

  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.style.display = "none";
  });

  document.body.appendChild(overlay);
  return overlay;
}

document.addEventListener("click", (e) => {
  const img = e.target.closest(".item img");
  if (!img) return;
  const overlay = ensureOverlay();
  document.getElementById("imgLightboxImg").src = img.src;
  overlay.style.display = "flex";
});
