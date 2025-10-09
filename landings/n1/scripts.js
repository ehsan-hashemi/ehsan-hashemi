/* Main script
   - Theme toggle with localStorage
   - Google Translate language switch and dir control
   - Portfolio loader from works.json (sorted by id desc)
   - Accessible lightbox modal
   - Order form validation + Google Forms submit (fetch + fallback)
*/

(function () {
  const docEl = document.documentElement;

  // Theme toggle
  const THEME_KEY = 'theme';
  const themeToggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light') {
    docEl.classList.add('light');
  }

  themeToggleBtn?.addEventListener('click', () => {
    docEl.classList.toggle('light');
    const isLight = docEl.classList.contains('light');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  });

  // Language switch via Google Translate
  const langButtons = document.querySelectorAll('[data-lang]');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-lang') || 'fa';
      setLanguage(target);
    });
  });

  /**
   * Set language using Google Translate widget and update dir
   * - Google combo element appears after widget loads: .goog-te-combo
   * - We simulate user selection and dispatch change event
   */
  function setLanguage(langCode) {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change'));
    }
    // Update dir based on language
    const rtlLangs = new Set(['fa', 'ar', 'ur', 'ps']);
    const dir = rtlLangs.has(langCode) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', langCode);

    // For visual alignment in LTR, we can flip some layout if needed (kept minimal)
  }

  // Portfolio: load works.json and render cards
  const worksGrid = document.getElementById('worksGrid');
  const worksCountEl = document.getElementById('worksCount');
  const sortSelect = document.getElementById('sortSelect');

  fetch('works.json')
    .then(r => r.json())
    .then(data => {
      // Ensure array and sort by id desc initially
      const works = Array.isArray(data) ? data.slice() : [];
      let current = sortWorks(works, 'id-desc');
      renderWorks(current);
      updateCount(current.length);

      sortSelect.addEventListener('change', () => {
        current = sortWorks(works, sortSelect.value);
        renderWorks(current);
        updateCount(current.length);
      });
    })
    .catch(err => {
      console.error('Error loading works.json:', err);
      worksGrid.innerHTML = '<p class="muted">خطا در بارگذاری نمونه‌کارها.</p>';
    });

  function sortWorks(list, mode) {
    const sorted = list.slice();
    if (mode === 'id-asc') {
      sorted.sort((a, b) => Number(a.id) - Number(b.id));
    } else {
      // Default: id-desc (نزولی) — تاکید: id بزرگتر جلوتر نمایش داده شود
      sorted.sort((a, b) => Number(b.id) - Number(a.id));
    }
    return sorted;
  }

  function updateCount(n) {
    if (worksCountEl) worksCountEl.textContent = String(n);
  }

  function renderWorks(items) {
    worksGrid.innerHTML = '';
    const frag = document.createDocumentFragment();

    items.forEach(item => {
      const card = createCard(item);
      frag.appendChild(card);
    });

    worksGrid.appendChild(frag);
  }

  function createCard(work) {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('tabindex', '0'); // focusable for keyboard

    // Media wrapper
    const media = document.createElement('div');
    media.className = 'card-media';

    const img = document.createElement('img');
    img.src = work.image;
    img.alt = work.title || 'نمونه‌کار';
    img.loading = 'lazy';
    // Optional srcset: use same image at 1x and assume larger could exist
    img.srcset = `${work.image} 1x`;
    img.sizes = '(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw';

    media.appendChild(img);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    const titleEl = document.createElement('h3');
    titleEl.className = 'card-title';
    titleEl.textContent = work.title || '';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn primary';
    viewBtn.type = 'button';
    viewBtn.setAttribute('aria-label', `نمایش: ${work.title}`);
    viewBtn.innerHTML = `<i class="ri-eye-line" aria-hidden="true"></i> <span>نمایش</span>`;

    actions.appendChild(viewBtn);
    overlay.appendChild(titleEl);
    overlay.appendChild(actions);

    // Click handlers for opening lightbox
    const open = () => openLightbox(work.image, work.title);
    media.addEventListener('click', open);
    viewBtn.addEventListener('click', open);
    // Keyboard support: Enter opens
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    card.appendChild(media);
    card.appendChild(overlay);
    return card;
  }

  // Lightbox logic
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImage');
  const lbTitle = document.getElementById('lightboxTitle');
  let lastFocusedEl = null;

  function openLightbox(src, title) {
    lbImg.src = src;
    lbImg.alt = title || '';
    lbTitle.textContent = title || '';
    lastFocusedEl = document.activeElement;

    lightbox.setAttribute('aria-hidden', 'false');
    // Trap focus inside
    const closeBtn = lightbox.querySelector('.lightbox-close');
    closeBtn?.focus();
    document.addEventListener('keydown', onLightboxKey);
    lightbox.addEventListener('click', onLightboxClick);
  }

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onLightboxKey);
    lightbox.removeEventListener('click', onLightboxClick);
    // Restore focus
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  function onLightboxKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    }
    // Basic focus trap: cycle with Tab
    if (e.key === 'Tab') {
      const focusables = lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
  }

  function onLightboxClick(e) {
    const target = e.target;
    if (target && (target.dataset.close === 'true' || target.closest('[data-close="true"]'))) {
      closeLightbox();
    }
  }

  // Order form submit to Google Forms
  const ORDER_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLScOy0P6NRXcB6q8Ud-FlJVmTqcwbDidilgq282BEVxA4WAyXQ/formResponse';
  const orderForm = document.getElementById('orderForm');
  const statusEl = document.getElementById('formStatus');
  const fallbackForm = document.getElementById('fallbackForm');
  const openGoogleFormLink = document.getElementById('openGoogleForm');

  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    // Client-side validation
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();

    const errors = [];
    if (!fullName) errors.push('نام و نام خانوادگی را وارد کنید.');
    if (!phone || !isValidPhone(phone)) errors.push('شماره تلفن معتبر وارد کنید.');
    if (!description) errors.push('توضیحات سفارش را وارد کنید.');

    if (errors.length) {
      setStatus('error', errors.join(' '));
      return;
    }

    // Try fetch POST first (may be blocked by CORS depending on browser)
    try {
      const formData = new FormData();
      formData.append('entry.1779351425', fullName);
      formData.append('entry.612053626', phone);
      formData.append('entry.420437738', title);
      formData.append('entry.946057571', description);

      const resp = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors', // allow fire-and-forget
        body: formData
      });

      // With no-cors, status is opaque; assume success if no error thrown
      setStatus('success', 'اطلاعات شما ثبت شد و به زودی با شما تماس گرفته می‌شود.');
      orderForm.reset();
    } catch (err) {
      console.warn('Fetch submission failed, switching to fallback:', err);
      // Fallback: submit hidden HTML form (will open new tab due to target="_blank")
      document.getElementById('ff_fullName').value = fullName;
      document.getElementById('ff_phone').value = phone;
      document.getElementById('ff_title').value = title;
      document.getElementById('ff_description').value = description;

      try {
        fallbackForm.submit();
        setStatus('success', 'ارسال از طریق فرم گوگل انجام شد. در صورت عدم نمایش، روی لینک «فرم اصلی گوگل» کلیک کنید.');
        orderForm.reset();
      } catch (err2) {
        setStatus('error', 'خطا در ارسال فرم. لطفاً فرم اصلی گوگل را در تب جدید باز کنید.');
        openGoogleFormLink.focus();
      }
    }
  });

  function isValidPhone(str) {
    // Flexible check: digits, optional +, 8-15 digits
    const cleaned = str.replace(/\s|-/g, '');
    return /^(\+)?\d{8,15}$/.test(cleaned);
  }

  function clearStatus() {
    statusEl.className = 'status';
    statusEl.textContent = '';
  }

  function setStatus(type, text) {
    statusEl.className = `status ${type}`;
    statusEl.textContent = text;
  }

  // Notes for users about CORS behavior (added once page loads)
  document.addEventListener('DOMContentLoaded', () => {
    // Enhance backup Google Form link with prefill parameters
    const link = document.getElementById('openGoogleForm');
    if (link) {
      link.addEventListener('click', (e) => {
        // Pre-fill with current form values when opening
        const fullName = encodeURIComponent(document.getElementById('fullName').value || '');
        const phone = encodeURIComponent(document.getElementById('phone').value || '');
        const title = encodeURIComponent(document.getElementById('title').value || '');
        const description = encodeURIComponent(document.getElementById('description').value || '');
        const url = `https://docs.google.com/forms/d/e/1FAIpQLScOy0P6NRXcB6q8Ud-FlJVmTqcwbDidilgq282BEVxA4WAyXQ/viewform?usp=pp_url&entry.1779351425=${fullName}&entry.612053626=${phone}&entry.420437738=${title}&entry.946057571=${description}`;
        link.setAttribute('href', url);
      });
    }
  });

})();