const themeBtn = document.getElementById("themeBtn");

// โหลดค่าที่เคยบันทึก (ค่าเริ่มต้นของเว็บคือโทนมืด)
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    document.body.classList.add("light");
    if (themeBtn) themeBtn.innerText = "โหมดมืด";
} else {
    if (themeBtn) themeBtn.innerText = "โหมดสว่าง";
}

// เปลี่ยนโหมดและบันทึก
if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light");

        if (document.body.classList.contains("light")) {
            localStorage.setItem("theme", "light");
            themeBtn.innerText = "โหมดมืด";
        } else {
            localStorage.setItem("theme", "dark");
            themeBtn.innerText = "โหมดสว่าง";
        }
    });
}
