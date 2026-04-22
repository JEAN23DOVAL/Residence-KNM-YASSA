// ════════════════════════════════════════════════════════════════
// 🚀 SERVICE WORKER & ADVANCED CACHE MANAGEMENT
// ════════════════════════════════════════════════════════════════

// Enregistrer le Service Worker pour multi-layer caching
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('service-worker.js', {
        scope: '/'
      });
      console.log('✅ Service Worker v2.0 registered - Multi-layer caching active');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('🔄 Service Worker updated - Image/Font/Icon caching enhanced');
            // Notify user
            notifyUserOfUpdate();
          }
        });
      });

      // Check for updates every 6 hours
      setInterval(() => {
        registration.update();
      }, 6 * 60 * 60 * 1000);
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
};

/**
 * Monitor cache performance
 */
const monitorCacheHealth = async () => {
  if (!('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    const stats = {};
    
    let totalSize = 0;
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
      totalSize += keys.length;
    }
    
    console.log('📊 Cache Health:', stats, `(Total: ${totalSize} items)`);
    
    // Warn if cache gets too large
    if (totalSize > 500) {
      console.warn('⚠️ Cache size growing - Consider cleanup');
    }
  } catch (error) {
    // Silently fail if indexedDB not available
  }
};

/**
 * Notify user of cache updates
 */
function notifyUserOfUpdate() {
  // Only show on second visit
  if (sessionStorage.getItem('visitCount') === null) {
    sessionStorage.setItem('visitCount', '1');
    return;
  }

  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #25d366;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  msg.textContent = '🔄 Resources updated - Refresh for latest!';
  document.body.appendChild(msg);
  
  setTimeout(() => msg.remove(), 4000);
}

// Enregistrer le SW au chargement
registerServiceWorker();

// Monitor cache health après le chargement
window.addEventListener('load', () => {
  setTimeout(monitorCacheHealth, 2000);
});

document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════
  // 🚀 INITIALIZE LAZY LOADING FOR ON-DEMAND RESOURCE CACHING
  // ═══════════════════════════════════════════════════════════════
  if (typeof LazyResourceLoader !== 'undefined') {
    const lazyLoader = new LazyResourceLoader({
      threshold: 0.1,           // Start loading when 10% visible
      rootMargin: '50px',       // Prefetch 50px before entering viewport
      maxConcurrent: 3          // Max 3 concurrent downloads
    });

    lazyLoader.init();

    // Watch for dynamically added content (e.g., Swiper slides)
    const dynamicLoader = new DynamicLazyLoader(lazyLoader);
    dynamicLoader.watchDynamicContent();

    // Expose for debugging
    window.lazyLoader = lazyLoader;
    console.log('✅ Lazy Resource Loader active - Only loading visible content');
  }

  // Load Header and Footer dynamically
  const loadIncludes = async () => {
    try {
      // Fetch Header
      const headerRes = await fetch('assets/includes/header.html');
      if (headerRes.ok) {
        document.getElementById('header-placeholder').innerHTML = await headerRes.text();
        initHeaderLogic();
      }

      // Fetch Footer
      const footerRes = await fetch('assets/includes/footer.html');
      if (footerRes.ok) {
        document.getElementById('footer-placeholder').innerHTML = await footerRes.text();
        initFooterLogic();
      }
    } catch (error) {
      console.error("Error loading includes:", error);
    }
  };

  const initHeaderLogic = () => {
    const headerWrapper = document.querySelector('.header-wrapper');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    const menuIcon = mobileToggle ? mobileToggle.querySelector('i') : null;

    // Sticky Header Scroll Effect
    window.addEventListener('scroll', () => {
      if (headerWrapper) {
        if (window.scrollY > 50) {
          headerWrapper.classList.add('scrolled');
        } else {
          headerWrapper.classList.remove('scrolled');
        }
      }
      updateActiveLink();
    });

    // Mobile Menu Toggle
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('nav-open');
        headerWrapper.classList.toggle('menu-active');
        
        // Toggle icon between bars and times (close)
        if (navLinks.classList.contains('nav-open')) {
          menuIcon.classList.remove('fa-bars');
          menuIcon.classList.add('fa-xmark');
        } else {
          menuIcon.classList.remove('fa-xmark');
          menuIcon.classList.add('fa-bars');
        }
      });
    }

    // Close menu when clicking a link
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('nav-open')) {
          navLinks.classList.remove('nav-open');
          headerWrapper.classList.remove('menu-active');
          if (menuIcon) {
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
          }
        }
      });
    });

    // Highlight current page
    updateActiveLink();
  };

  const initFooterLogic = () => {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  };

  // Determine active link based on current page (not sections)
  const updateActiveLink = () => {
    // Obtenir le chemin actuel (ex: /index.html, /appartements.html)
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      const link = item.querySelector('.nav-link');
      if (link) {
        const href = link.getAttribute('href');
        // Extraire le nom du fichier du href
        const linkPage = href.split('/').pop();
        
        if (linkPage === currentPage) {
          item.classList.add('active');
        }
      }
    });
  };

  // Initialize
  loadIncludes();

  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-quart',
      once: false,
      mirror: true,
      offset: 120
    });
  }

  // Initialize Swiper for testimonials
  if (typeof Swiper !== 'undefined') {
    const testiSwiper = new Swiper('.testi-swiper', {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 30,
      centeredSlides: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true
      },
      navigation: {
        nextEl: '.testi-next',
        prevEl: '.testi-prev'
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30
        }
      },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      }
    });
  }

  // Initialize Swiper for unit galleries (apartments page)
  if (typeof Swiper !== 'undefined') {
    // Main unit swipers (galleries)
    const mainUnitSwipers = document.querySelectorAll('.unit-swiper:not(.unit-thumb-swiper)');
    const swiperInstances = {};
    
    mainUnitSwipers.forEach((swiperElement, index) => {
      const wrapper = swiperElement.closest('.unit-swiper-wrap');
      const thumbGallery = wrapper?.querySelector('.unit-thumb-swiper');
      const thumbSwiperInstance = thumbGallery?.swiper;
      
      const mainSwiper = new Swiper(swiperElement, {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: {
          el: swiperElement.querySelector('.swiper-pagination'),
          clickable: true
        },
        navigation: {
          nextEl: swiperElement.querySelector('.swiper-button-next'),
          prevEl: swiperElement.querySelector('.swiper-button-prev')
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false
        },
        on: {
          init: function() {
            // Sync thumbnail on init
            if (thumbSwiperInstance) {
              thumbSwiperInstance.slideTo(this.realIndex);
            }
          },
          slideChange: function() {
            // Sync thumbnail on slide change
            if (thumbSwiperInstance) {
              thumbSwiperInstance.slideTo(this.realIndex);
            }
          }
        }
      });
      
      swiperInstances[`main-${index}`] = mainSwiper;
      
      // Thumbnail click handling
      if (thumbSwiperInstance) {
        thumbGallery.querySelectorAll('.swiper-slide').forEach((slide, slideIndex) => {
          slide.addEventListener('click', () => {
            mainSwiper.slideTo(slideIndex);
          });
        });
      }
    });
    
    // Thumbnail swipers (initialize separately)
    const thumbUnitSwipers = document.querySelectorAll('.unit-thumb-swiper');
    thumbUnitSwipers.forEach((thumbElement, index) => {
      new Swiper(thumbElement, {
        slidesPerView: 'auto',
        spaceBetween: 8,
        freeMode: true,
        watchSlidesProgress: true
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // E-COMMERCE STYLE GALLERY INITIALIZATION
    // ═══════════════════════════════════════════════════════════════
    const ecommerceMains = document.querySelectorAll('.gallery-main-swiper');
    ecommerceMains.forEach((mainGallery, index) => {
      const showCaseWrapper = mainGallery.closest('.unit-showcase');
      const thumbGallery = showCaseWrapper?.querySelector('.gallery-thumb-swiper');
      
      // Initialize thumbnail swiper first
      let thumbSwiper = null;
      if (thumbGallery) {
        thumbSwiper = new Swiper(thumbGallery, {
          slidesPerView: 'auto',
          spaceBetween: 8,
          freeMode: false,
          watchSlidesProgress: true,
          speed: 0,
          noSwiping: true
        });
      }
      
      // Find navigation and pagination elements relative to this mainGallery
      const paginationEl = mainGallery.querySelector('.swiper-pagination');
      const nextEl = mainGallery.querySelector('.swiper-button-next');
      const prevEl = mainGallery.querySelector('.swiper-button-prev');
      
      // Initialize main swiper with thumbs sync
      const mainSwiper = new Swiper(mainGallery, {
        loop: false,
        slidesPerView: 1,
        spaceBetween: 0,
        pagination: paginationEl ? {
          el: paginationEl,
          clickable: true,
          type: 'bullets'
        } : undefined,
        navigation: (nextEl || prevEl) ? {
          nextEl: nextEl,
          prevEl: prevEl
        } : undefined,
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        thumbs: thumbSwiper ? {
          swiper: thumbSwiper,
          autoScrollOffset: 0,
          slideThumbActiveClass: 'swiper-slide-thumb-active'
        } : undefined,
        on: {
          init: function() {
            // Set first thumbnail as active
            if (thumbSwiper) {
              thumbSwiper.slideTo(0);
              const firstThumb = thumbGallery.querySelectorAll('.thumb-slide')[0];
              if (firstThumb) {
                firstThumb.classList.add('swiper-slide-thumb-active');
              }
            }
          },
          slideChange: function() {
            // Update thumbnail active state and scroll
            if (thumbSwiper) {
              thumbSwiper.slideTo(this.realIndex);
            }
          }
        }
      });

      // Click on thumbnails to navigate main gallery
      if (thumbGallery) {
        thumbGallery.querySelectorAll('.thumb-slide').forEach((thumb, slideIndex) => {
          thumb.addEventListener('click', () => {
            mainSwiper.slideTo(slideIndex);
          });
        });
      }
    });
  }

  // --- TABS / FILTER LOGIC FOR ROOMS ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const roomCards = document.querySelectorAll('.filter-item');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        // Add to current
        btn.classList.add('active');

        const filter = btn.getAttribute('data-target');

        roomCards.forEach(card => {
          // Reset inline styles for smooth transition
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          
          if (filter === 'all') {
            card.style.display = 'block';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
          } else {
            if (card.classList.contains(filter)) {
              card.style.display = 'block';
              setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
            } else {
              card.style.opacity = '0';
              card.style.transform = 'scale(0.8)';
              setTimeout(() => { card.style.display = 'none'; }, 300); // Wait for transition
            }
          }
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // APARTMENTS PAGE ADVANCED FEATURES
  // ═══════════════════════════════════════════════════════════════

  // 1. PARALLAX EFFECT for hero sections
  const initParallax = () => {
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    window.addEventListener('scroll', () => {
      parallaxElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const scrollPercentage = (window.innerHeight - rect.top) / window.innerHeight;
        const yOffset = scrollPercentage * 30; // Parallax depth
        el.style.transform = `translateY(${yOffset}px)`;
      });
    }, { passive: true });
  };
  initParallax();

  // 2. QUICK NAV Smooth active state + scroll behavior
  const initQuickNav = () => {
    const qnavBtns = document.querySelectorAll('.qnav-btn');
    const unitSections = document.querySelectorAll('.unit-section');
    
    const updateQNavActive = () => {
      const scrollPos = window.scrollY + 150;
      
      unitSections.forEach(section => {
        const sectionId = section.getAttribute('id');
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          qnavBtns.forEach(btn => btn.classList.remove('active'));
          const activeBtn = document.querySelector(`.qnav-btn[href="#${sectionId}"]`);
          if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    };

    qnavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        qnavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    window.addEventListener('scroll', updateQNavActive, { passive: true });
  };
  initQuickNav();

  // 3. VIDEO PLACEHOLDER interactions
  const initVideoPlaceholders = () => {
    const videoPlaceholders = document.querySelectorAll('.unit-video-placeholder');
    
    videoPlaceholders.forEach(placeholder => {
      placeholder.addEventListener('click', () => {
        // Smooth feedback
        placeholder.style.transform = 'scale(0.98)';
        setTimeout(() => {
          placeholder.style.transform = '';
        }, 100);
        
        // Could open a modal video here
        console.log('Video Modal would open here');
      });
    });
  };
  initVideoPlaceholders();

  // 4. AMENITY GROUP ANIMATIONS
  const initAmenityAnimations = () => {
    const amenityPills = document.querySelectorAll('.amenity-pill');
    
    // Stagger animation on page load
    amenityPills.forEach((pill, index) => {
      pill.style.animation = `none`;
      pill.style.opacity = '0';
      pill.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        pill.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        pill.style.opacity = '1';
        pill.style.transform = 'translateY(0)';
      }, 50 + index * 30);
    });
  };
  
  // Call after AOS initialization
  setTimeout(initAmenityAnimations, 1000);

  // 5. CTA BUTTON ANIMATIONS on hover
  const initCTAAnimations = () => {
    const ctaButtons = document.querySelectorAll('[href*="wa.me"]');
    
    ctaButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.letterSpacing = 'inherit';
      });
    });
  };
  initCTAAnimations();

  // 6. SMOOTH REVEAL ANIMATIONS for sections
  const initRevealAnimations = () => {
    const unitSections = document.querySelectorAll('.unit-section');
    
    const revealOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const revealOnScroll = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, revealOptions);
    
    unitSections.forEach(section => {
      section.style.opacity = '0.8';
      section.style.transform = 'translateY(20px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      revealOnScroll.observe(section);
    });
  };
  initRevealAnimations();

  // 7. DYNAMIC HERO BACKGROUND adjust based on device
  const initHeroOptimization = () => {
    const aptsHero = document.querySelector('.apts-hero-bg');
    if (aptsHero && window.innerHeight < 600) {
      document.querySelector('.apts-hero').style.minHeight = '70vh';
    }
  };
  initHeroOptimization();

  // 8. SMOOTH SCROLL for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 9. PERFOMANCE: Lazy load images with IntersectionObserver
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
  }

  // ─────────────────────────────────────────
  // Services Page Enhancements
  // ─────────────────────────────────────────
  function initServiceCardAnimations() {
    const cards = document.querySelectorAll('.service-card-premium');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'all .3s cubic-bezier(.34,1.56,.64,1)';
        const icon = this.querySelector('.service-icon-box');
        if (icon) {
          icon.style.transition = 'all .3s ease';
        }
      });
    });
  }

  function initServiceScrollCTA() {
    const ctas = document.querySelectorAll('[data-scroll-to]');
    if (!ctas.length) return;

    ctas.forEach(cta => {
      cta.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = cta.getAttribute('data-scroll-to');
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Initialize services page features
  if (document.querySelector('.services-hero')) {
    initServiceCardAnimations();
    initServiceScrollCTA();
  }

  // ─────────────────────────────────────────
  // Gallery Page Enhancements
  // ─────────────────────────────────────────
  function initGalleryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        
        // Filter items
        galleryItems.forEach(item => {
          if (filter === '*') {
            item.style.display = 'block';
            item.style.animation = 'fadeInModal .3s ease';
          } else {
            if (item.classList.contains(filter.substring(1))) {
              item.style.display = 'block';
              item.style.animation = 'fadeInModal .3s ease';
            } else {
              item.style.display = 'none';
            }
          }
        });
      });
    });
  }

  function initGalleryLightbox() {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const modalTitle = document.getElementById('gallery-modal-title');
    const modalDesc = document.getElementById('gallery-modal-desc');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const closeBtn = document.querySelector('.gallery-modal-close');
    const prevBtn = document.querySelector('.gallery-modal-prev');
    const nextBtn = document.querySelector('.gallery-modal-next');
    const backdrop = document.querySelector('.gallery-modal-backdrop');

    if (!modal || !galleryItems.length) return;

    let currentIndex = 0;

    // Open modal on item click
    galleryItems.forEach((item, index) => {
      const zoomBtn = item.querySelector('.gallery-zoom-btn');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
          currentIndex = index;
          openModal(index);
        });
      }
    });

    // Close modal
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Navigate
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      openModal(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      openModal(currentIndex);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') prevBtn.click();
      if (e.key === 'ArrowRight') nextBtn.click();
      if (e.key === 'Escape') closeModal();
    });

    function openModal(index) {
      const item = galleryItems[index];
      const img = item.querySelector('img');
      const info = item.querySelector('.gallery-info');

      modalImg.src = img.getAttribute('data-src') || img.src;
      modalTitle.textContent = info.querySelector('h3').textContent;
      modalDesc.textContent = info.querySelector('p').textContent;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Initialize gallery features
  if (document.querySelector('.gallery-hero')) {
    initGalleryFilters();
    initGalleryLightbox();
  }

  // Initialize contact form
  if (document.querySelector('.contact-form')) {
    initContactForm();
  }

});

/* ────────────────────────────────────────────────────
   CONTACT FORM HANDLING
──────────────────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\+\-\(\)]{9,}$/;

  // Validate individual field
  function validateField(field) {
    const type = field.type || field.tagName.toLowerCase();
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
      return false;
    }

    if (type === 'email' && value && !emailRegex.test(value)) {
      return false;
    }

    if (field.name === 'phone' && value && !phoneRegex.test(value)) {
      return false;
    }

    if (type === 'checkbox' && field.required && !field.checked) {
      return false;
    }

    return true;
  }

  // Validate entire form
  function validateForm() {
    const fields = form.querySelectorAll('input, select, textarea');
    let isValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        field.style.borderColor = '#e3001d';
        isValid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    return isValid;
  }

  // Clear error on input
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.style.borderColor) {
        field.style.borderColor = '';
      }
    });
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showMessage('Veuillez remplir tous les champs correctement.', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const formData = new FormData(form);

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
      // Build form data
      const data = {
        nom: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        sujet: formData.get('subject'),
        message: formData.get('message'),
        timestamp: new Date().toLocaleString('fr-FR')
      };

      // For demo: Just save to localStorage to show the form works
      // In production, send this data to your backend server
      const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
      submissions.push(data);
      localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

      showMessage('Merci ! Votre message a été enregistré. Nous vous contactons très bientôt.', 'success');
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('Une erreur s\'est produite. Veuillez réessayer via WhatsApp.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Show message function
  function showMessage(text, type) {
    let messageDiv = form.querySelector('.form-message');
    
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.className = `form-message ${type}`;
      form.appendChild(messageDiv);
    }

    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      messageDiv.style.transition = 'opacity .3s ease';
      setTimeout(() => {
        messageDiv.style.display = 'none';
        messageDiv.style.opacity = '1';
      }, 300);
    }, 5000);
  }
}
