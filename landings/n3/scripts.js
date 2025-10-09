/* scripts.js
   - خوانا و ماژولار
   - بارگذاری works.json، مدیریت لایت‌باکس، تم، ترجمه گوگل و ارسال فرم گوگل
*/

(() => {
  'use strict';

  const CONFIG = {
    worksJsonPath: 'works.json',
    googleFormEndpoint: 'https://docs.google.com/forms/d/e/1FAIpQLScOy0P6NRXcB6q8Ud-FlJVmTqcwbDidilgq282BEVxA4WAyXQ/formResponse',
    themeKey: 'km_theme',
    defaultLang: 'fa'
  };

  /* ---------- Utilities ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Theme (dark / light) ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.themeKey, theme);
    const btn = $('#theme-toggle-btn');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark');
  }
  function initTheme() {
    const saved = localStorage.getItem(CONFIG.themeKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
    $('#theme-toggle-btn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Load works.json (with fallback) ---------- */
  async function loadWorksJson() {
    try {
      const resp = await fetch(CONFIG.worksJsonPath, {cache: "no-store"});
      if (!resp.ok) throw new Error('Failed to fetch works.json');
      const data = await resp.json();
      return data;
    } catch (err) {
      // fallback to inline JSON in index.html (for file:// or blocked fetch)
      const fallback = $('#works-fallback');
      if (fallback) {
        try {
          return JSON.parse(fallback.textContent);
        } catch (e) {
          console.error('Fallback JSON parse error', e);
        }
      }
      console.error('Cannot load works.json:', err);
      return [];
    }
  }

  /* ---------- Render works ---------- */
  function makeWorkCard(work) {
    const card = document.createElement('article');
    card.className = 'work-card';
    card.setAttribute('role','listitem');
    card.setAttribute('tabindex','0');

    // markup
    card.innerHTML = `
      <img class="work-thumb" loading="lazy"
           src="${work.image}"
           alt="${escapeHtml(work.title)}"
           srcset="${work.image} 800w"
           >
      <div class="card-overlay" aria-hidden="true">
        <div class="card-meta">
          <div class="card-title">${escapeHtml(work.title)}</div>
          <button class="btn-show" data-id="${work.id}" type="button">نمایش</button>
        </div>
      </div>
    `;

    // click handlers: image or button opens lightbox
    card.querySelector('.work-thumb').addEventListener('click', () => openLightbox(work));
    card.querySelector('.btn-show').addEventListener('click', () => openLightbox(work));
    // keyboard: Enter opens
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openLightbox(work);
    });

    return card;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  async function renderWorks() {
    const grid = $('#works-grid');
    grid.innerHTML = '';
    const works = await loadWorksJson();
    // sort descending by id
    works.sort((a,b) => b.id - a.id);
    $('#works-count').textContent = `${works.length} مورد`;
    works.forEach(w => grid.appendChild(makeWorkCard(w)));
  }

  /* ---------- Lightbox (accessible) ---------- */
  const lb = {
    el: null,
    overlay: null,
    content: null,
    img: null,
    title: null,
    closeBtn: null,
    lastFocused: null,
    init() {
      this.el = $('#lightbox');
      this.overlay = $('.lb-overlay', this.el);
      this.content = $('.lb-content', this.el);
      this.img = $('.lb-image', this.el);
      this.title = $('.lb-title', this.el);
      this.closeBtn = $('.lb-close', this.el);

      // close handlers
      this.overlay.addEventListener('click', (e) => {
        if (e.target.dataset.close !== undefined) this.close();
      });
      this.closeBtn.addEventListener('click', () => this.close());

      // esc to close and trap focus
      document.addEventListener('keydown', (e) => {
        if (this.el.getAttribute('aria-hidden') === 'false') {
          if (e.key === 'Escape') this.close();
          if (e.key === 'Tab') this.trapFocus(e);
        }
      });
    },
    open(work) {
      this.lastFocused = document.activeElement;
      this.img.src = work.image;
      this.img.alt = work.title || '';
      this.title.textContent = work.title || '';
      this.el.setAttribute('aria-hidden', 'false');
      // set focus to close button
      this.closeBtn.focus();
    },
    close() {
      this.el.setAttribute('aria-hidden', 'true');
      if (this.lastFocused && typeof this.lastFocused.focus === 'function') this.lastFocused.focus();
    },
    trapFocus(e) {
      const focusable = this.el.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  };

  function openLightbox(work) {
    lb.open(work);
  }

  /* ---------- Google Translate integration ---------- */
  // We rely on Google Website Translator widget.
  // The widget creates a <select class="goog-te-combo"> we can control.
  window.googleTranslateElementInit = function() {
    try {
      /* global google */
      new google.translate.TranslateElement({
        pageLanguage: 'fa',
        includedLanguages: 'fa,en,ar',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
      // attach listener to the select once available
      attachTranslateSelectListener();
    } catch (e) {
      console.warn('Google Translate init failed', e);
    }
  };

  // Poll until the combo exists, then attach change listener
  function attachTranslateSelectListener() {
    const interval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        clearInterval(interval);
        combo.addEventListener('change', () => {
          const val = combo.value || combo.options[combo.selectedIndex].value;
          handleLanguageChange(val);
        });
      }
    }, 300);
  }

  // Our visible language buttons call this
  function selectGoogleTranslate(langCode) {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change'));
    } else {
      // If widget not loaded, at least set dir/lang for UI
      handleLanguageChange(langCode);
    }
  }

  function handleLanguageChange(langVal) {
    // langVal can be 'en', 'ar', 'fa', or 'en|fr' etc. We'll inspect start.
    const lang = (langVal || '').toLowerCase().split('|')[0];
    if (lang === 'en') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    } else if (lang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.lang = 'fa';
      document.documentElement.dir = 'rtl';
    }

    // update UI pressed states
    $$('.lang-btn').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.lang === (lang || CONFIG.defaultLang));
    });
  }

  function initLangButtons() {
    $$('.lang-btn').forEach(b => {
      b.addEventListener('click', () => {
        const lang = b.dataset.lang;
        selectGoogleTranslate(lang);
        // optimistic UI change
        handleLanguageChange(lang);
      });
    });
  }

  /* ---------- Order form handling (Google Forms submission + fallback) ---------- */
  function initFormHandling() {
    const form = $('#order-form');
    const statusEl = $('#form-status');
    const hiddenForm = $('#gf-hidden-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      updateStatus('', true);

      // validation (browser does some, but we add phone pattern and required checks)
      const name = $('#name').value.trim();
      const phone = $('#phone').value.trim();
      const title = $('#title').value.trim();
      const details = $('#details').value.trim();

      if (!name || !phone || !details) {
        updateStatus('لطفاً همه فیلدهای اجباری را پر کنید.', false);
        return;
      }
      const phoneOk = /^[0-9+\-\s()]{7,25}$/.test(phone);
      if (!phoneOk) {
        updateStatus('لطفاً شماره تلفن را به شکل معتبر وارد کنید (اعداد و + و - مجاز است).', false);
        return;
      }

      // prepare payload
      const params = new URLSearchParams();
      params.append('entry.1779351425', name);
      params.append('entry.612053626', phone);
      params.append('entry.420437738', title);
      params.append('entry.946057571', details);

      // try fetch POST (may fail due to CORS) — if fails, fallback to hidden form submit
      try {
        const resp = await fetch(CONFIG.googleFormEndpoint, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: params.toString()
        });

        if (resp.ok) {
          updateStatus('اطلاعات شما ثبت شد و به زودی با شما تماس گرفته می‌شود.', true);
          form.reset();
        } else {
          // likely CORS or redirect, fallback
          throw new Error('Non-OK response');
        }
      } catch (err) {
        // fallback: populate hidden form and submit it (this opens Google Form in a new tab)
        try {
          hiddenForm.querySelector('input[name="entry.1779351425"]').value = name;
          hiddenForm.querySelector('input[name="entry.612053626"]').value = phone;
          hiddenForm.querySelector('input[name="entry.420437738"]').value = title;
          hiddenForm.querySelector('textarea[name="entry.946057571"]').value = details;

          // submit hidden form (target="_blank") — user sees Google Form response page; treat as success
          hiddenForm.submit();

          updateStatus('اطلاعات ارسال شد. (به دلیل محدودیت‌های CORS، فرم گوگل در تب جدید باز شد.)', true);
          form.reset();
        } catch (e2) {
          console.error(e2);
          updateStatus('ارسال با خطا مواجه شد. لطفاً سپس دوباره تلاش کنید یا فرم اصلی را باز کنید.', false);
        }
      }
    });

    function updateStatus(text, ok) {
      if (!text) {
        statusEl.hidden = true;
        statusEl.textContent = '';
        return;
      }
      statusEl.hidden = false;
      statusEl.textContent = text;
      statusEl.style.color = ok ? '' : 'var(--muted)';
    }
  }

  /* ---------- Init everything ---------- */
  function initAll() {
    initTheme();
    initLangButtons();
    initFormHandling();
    lb.init();
    renderWorks();

    // initial language set
    handleLanguageChange(CONFIG.defaultLang);
  }

  // Start
  document.addEventListener('DOMContentLoaded', initAll);

})();
