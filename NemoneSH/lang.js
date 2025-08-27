const translations = {
    fa: {
        site_title: "جواد بهرامی",
        home: "خانه",
        activities: "فعالیت‌ها",
        honors: "افتخارات",
        skills: "مهارت‌ها",
        contact: "راه ارتباطی"
    },
    en: {
        site_title: "Javad Bahrami",
        home: "Home",
        activities: "Activities",
        honors: "Honors",
        skills: "Skills",
        contact: "Contact"
    },
    ar: {
        site_title: "جواد بهرامي",
        home: "الصفحة الرئيسية",
        activities: "أنشطة",
        honors: "التكريمات",
        skills: "المهارات",
        contact: "طريقة الاتصال"
    }
};

function setLanguage(lang) {
    if (!translations[lang]) lang = "fa"; // fallback به فارسی
    document.documentElement.lang = lang; // تغییر تگ html lang
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = translations[lang][key];
    });
}

// اجرای خودکار در بار اول
document.addEventListener("DOMContentLoaded", () => {
    let userLang = (navigator.language || navigator.userLanguage || "fa").slice(0, 2);
    if (!translations[userLang]) {
        userLang = "fa"; // fallback
    }
    setLanguage(userLang);
});