document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Switcher ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- Language Switcher ---
    // This setup uses the Google Translate Widget.
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'fa',
            includedLanguages: 'fa,en,ar',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    // Helper to change language and document direction
    const changeLanguage = (lang) => {
        const iframe = document.querySelector('.goog-te-menu-frame');
        if (!iframe) return;
        
        const langLink = iframe.contentWindow.document.querySelector(`.goog-te-menu2-item span.text:contains(${lang})`);
        if (langLink) {
             langLink.click();
        }

        if (lang === 'English') {
            document.documentElement.dir = 'ltr';
        } else {
            document.documentElement.dir = 'rtl';
        }
        
        // Update active button style
        document.querySelectorAll('.lang-btn').forEach(btn => {
           btn.classList.remove('active');
        });
        document.querySelector(`.lang-btn[data-lang="${lang.substring(0,2).toLowerCase()}"]`).classList.add('active');
    };
    
    // Add Google Translate script dynamically
    const googleTranslateScript = document.createElement('script');
    googleTranslateScript.type = 'text/javascript';
    googleTranslateScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(googleTranslateScript);
    
    // Attach event listeners to our custom buttons
    document.querySelectorAll('.lang-btn').forEach(button => {
        button.addEventListener('click', () => {
            const langMap = { fa: 'Persian', en: 'English', ar: 'Arabic' };
            changeLanguage(langMap[button.dataset.lang]);
        });
    });

    // --- Portfolio Loading from JSON ---
    const portfolioGrid = document.getElementById('portfolio-grid');

    const loadPortfolio = async () => {
        try {
            const response = await fetch('works.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const works = await response.json();

            // Sort by ID descending
            works.sort((a, b) => b.id - a.id);

            portfolioGrid.innerHTML = works.map(work => `
                <div class="portfolio-card" data-image="${work.image}" data-title="${work.title}" role="button" tabindex="0">
                    <img src="${work.image}" alt="${work.title}" loading="lazy">
                    <div class="card-content">
                        <h3 class="card-title">${work.title}</h3>
                    </div>
                </div>
            `).join('');
            
            addPortfolioEventListeners();

        } catch (error) {
            portfolioGrid.innerHTML = '<p>خطا در بارگذاری نمونه‌کارها.</p>';
            console.error('Failed to load portfolio:', error);
        }
    };

    // --- Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxClose = document.getElementById('lightbox-close');

    const openLightbox = (image, title) => {
        lightboxImg.src = image;
        lightboxImg.alt = title;
        lightboxTitle.textContent = title;
        lightbox.style.display = 'flex';
        setTimeout(() => lightbox.classList.add('show'), 10); // For transition
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
        lightbox.setAttribute('aria-hidden', 'false');
    };

    const closeLightbox = () => {
        lightbox.classList.remove('show');
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
            lightbox.setAttribute('aria-hidden', 'true');
        }, 300); // Match transition duration
    };

    const addPortfolioEventListeners = () => {
        document.querySelectorAll('.portfolio-card').forEach(card => {
            card.addEventListener('click', () => {
                openLightbox(card.dataset.image, card.dataset.title);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(card.dataset.image, card.dataset.title);
                }
            });
        });
    };
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('show')) {
            closeLightbox();
        }
    });

    // --- Google Form Submission ---
    const orderForm = document.getElementById('order-form');
    const formStatus = document.getElementById('form-status');

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Basic validation
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const description = document.getElementById('description').value.trim();

        if (!name || !phone || !description) {
            showFormStatus('لطفاً فیلدهای الزامی را پر کنید.', 'error');
            return;
        }

        // Phone number validation (simple)
        if (!/^\d{10,14}$/.test(phone.replace(/[\s+()-]/g, ''))) {
            showFormStatus('لطفاً یک شماره تلفن معتبر وارد کنید.', 'error');
            return;
        }
        
        // Submit using the hidden iframe method to bypass CORS
        const formData = new FormData(orderForm);
        const actionURL = 'https://docs.google.com/forms/d/e/1FAIpQLScOy0P6NRXcB6q8Ud-FlJVmTqcwbDidilgq282BEVxA4WAyXQ/formResponse';
        
        // Create a temporary form to submit to the iframe
        const tempForm = document.createElement('form');
        tempForm.action = actionURL;
        tempForm.method = 'POST';
        tempForm.target = 'hidden_iframe';
        tempForm.style.display = 'none';

        for (const [key, value] of formData.entries()) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            tempForm.appendChild(input);
        }

        document.body.appendChild(tempForm);
        tempForm.submit();
        
        // Clean up
        document.body.removeChild(tempForm);
        
        showFormStatus('اطلاعات شما ثبت شد و به زودی با شما تماس گرفته می‌شود.', 'success');
        orderForm.reset();
        
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    });
    
    const showFormStatus = (message, type) => {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
    };

    // Initial Load
    loadPortfolio();
    // Set default active language button
    document.querySelector('.lang-btn[data-lang="fa"]').classList.add('active');

});