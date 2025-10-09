document.addEventListener('DOMContentLoaded', () => {
    // Initialize all functionalities
    initThemeSwitcher();
    loadPortfolio();
    initFormSubmission();
    initLanguageSwitcher();
});

/**
 * Theme Switcher Logic
 * - Toggles between 'light' and 'dark' themes.
 * - Saves the user's preference in localStorage.
 */
function initThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * Portfolio Loader
 * - Fetches portfolio data from works.json.
 * - Sorts items by ID in descending order.
 * - Renders portfolio cards on the page.
 */
async function loadPortfolio() {
    try {
        const response = await fetch('works.json');
        if (!response.ok) throw new Error('Network response was not ok.');
        const works = await response.json();
        
        // Sort by ID descending
        works.sort((a, b) => b.id - a.id);

        const portfolioGrid = document.getElementById('portfolio-grid');
        portfolioGrid.innerHTML = works.map(work => `
            <div class="portfolio-card" data-image="${work.image}" data-title="${work.title}" tabindex="0" role="button" aria-label="نمایش نمونه کار: ${work.title}">
                <img src="${work.image}" alt="${work.title}" loading="lazy">
                <div class="card-content">
                    <h3>${work.title}</h3>
                </div>
            </div>
        `).join('');

        initLightbox(); // Initialize lightbox after cards are loaded

    } catch (error) {
        console.error('Failed to load portfolio:', error);
        document.getElementById('portfolio-grid').innerHTML = '<p>خطا در بارگذاری نمونه‌کارها.</p>';
    }
}

/**
 * Lightbox Logic
 * - Handles opening and closing the image modal.
 * - Accessible via keyboard (Enter on card, Esc to close).
 */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const closeBtn = document.getElementById('lightbox-close');
    const overlay = document.querySelector('.lightbox-overlay');
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    
    const openLightbox = (image, title) => {
        lightboxImage.src = image;
        lightboxImage.alt = title;
        lightboxTitle.textContent = title;
        lightbox.style.display = 'flex';
        lightbox.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    };

    const closeLightbox = () => {
        lightbox.style.display = 'none';
        lightbox.setAttribute('aria-hidden', 'true');
    };

    portfolioCards.forEach(card => {
        card.addEventListener('click', () => {
            openLightbox(card.dataset.image, card.dataset.title);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                openLightbox(card.dataset.image, card.dataset.title);
            }
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', closeLightbox);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'flex') {
            closeLightbox();
        }
    });
}

/**
 * Google Form Submission Logic
 * - Handles client-side validation.
 * - Submits data to a Google Form endpoint using a hidden iframe to bypass CORS issues.
 */
function initFormSubmission() {
    const form = document.getElementById('order-form');
    const formStatus = document.getElementById('form-status');
    const submitBtn = form.querySelector('.submit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!validateForm(form)) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ارسال...';
        
        // This is the CORS workaround using a hidden iframe.
        // We set a global flag to be checked by the iframe's onload event.
        window.submitted = true;
        
        // We don't use fetch() directly due to CORS. Instead, we submit the form
        // to a hidden iframe, which works around the restriction.
        form.action = "https://docs.google.com/forms/d/e/1FAIpQLScOy0P6NRXcB6q8Ud-FlJVmTqcwbDidilgq282BEVxA4WAyXQ/formResponse";
        form.method = "POST";
        form.target = "hidden_iframe";
        form.submit();
    });

    // This global function is called from the iframe's onload attribute in index.html
    window.handleFormSuccess = () => {
        showStatusMessage('اطلاعات شما با موفقیت ثبت شد. به زودی با شما تماس می‌گیریم.', 'success');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'ارسال سفارش';
        window.submitted = false; // Reset the flag
    };
    
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('invalid');
            } else {
                field.classList.remove('invalid');
            }
        });
        
        const phoneField = form.querySelector('input[type="tel"]');
        const phoneRegex = /^(09\d{9})$/; // Simple Iranian mobile number regex
        if (phoneField.value && !phoneRegex.test(phoneField.value.trim())) {
            isValid = false;
            phoneField.classList.add('invalid');
            showStatusMessage('لطفاً یک شماره تلفن معتبر وارد کنید (مثال: 09123456789).', 'error');
        } else {
            phoneField.classList.remove('invalid');
        }
        
        if (!isValid && !formStatus.textContent.includes('تلفن')) {
           showStatusMessage('لطفاً تمام فیلدهای ستاره‌دار را پر کنید.', 'error');
        }
        
        return isValid;
    }

    function showStatusMessage(message, type) {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
        setTimeout(() => {
            formStatus.textContent = '';
            formStatus.className = 'form-status';
        }, 5000);
    }
}

/**
 * Google Translate Widget Logic
 * - Hooks into custom buttons to change the language.
 * - Sets the document direction (LTR/RTL) based on the selected language.
 */
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'fa', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
}

function initLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const htmlEl = document.documentElement;

    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = btn.dataset.lang;
            const currentLang = getCookie('googtrans') ? getCookie('googtrans').split('/')[2] : 'fa';
            
            if (currentLang === lang) return; // Do nothing if language is already selected

            // Set the cookie that Google Translate reads
            document.cookie = `googtrans=/fa/${lang}; path=/`;
            
            // Set document direction
            if (lang === 'en') {
                htmlEl.dir = 'ltr';
                htmlEl.lang = 'en';
            } else {
                htmlEl.dir = 'rtl';
                htmlEl.lang = lang;
            }
            
            location.reload(); // Reload the page for the change to take effect
        });
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Dynamically add the Google Translate script to the head
const googleTranslateScript = document.createElement('script');
googleTranslateScript.type = 'text/javascript';
googleTranslateScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
document.head.appendChild(googleTranslateScript);