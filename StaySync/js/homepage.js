/**
 * SyncStay — THE MERIDIAN GRAND HOTEL
 * Public Homepage Interactions, Image Fallback, Scroll Reveal & Form Validation
 */

(function () {
  'use strict';

  /**
   * 1. EXISTING LOGIN ROUTE CONFIGURATION
   * Change this path if your existing login page uses a different filename or route
   * (e.g., 'login.html', '/login', or 'app.html').
   */
  const LOGIN_PAGE_URL = 'login.html';

  document.addEventListener('DOMContentLoaded', () => {
    initLucideIcons();
    initEntryLoader();
    initLoginLinks();
    initImageFallbacks();
    initStickyNavbar();
    initMobileNavigation();
    initScrollSpy();
    initScrollReveal();
    initContactFormValidation();
    initCopyrightYear();
  });

  /**
   * Initialize Lucide Minimalist Icons
   */
  function initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Smoothly dismiss the initial brand loading overlay
   */
  function initEntryLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    const hideLoader = () => {
      loader.classList.add('is-hidden');
    };

    setTimeout(hideLoader, 450);
  }

  /**
   * Ensure all Employee Login triggers point to the configured existing login page
   */
  function initLoginLinks() {
    const loginLinks = document.querySelectorAll('.js-login-link');
    loginLinks.forEach((link) => {
      link.setAttribute('href', LOGIN_PAGE_URL);
    });
  }

  /**
   * Local Image Asset Preferencing with Automatic High-Resolution Hotel Fallbacks
   */
  function initImageFallbacks() {
    const images = document.querySelectorAll('img[data-fallback]');
    images.forEach((img) => {
      const applyFallback = () => {
        const fallbackUrl = img.getAttribute('data-fallback');
        if (fallbackUrl && img.src !== fallbackUrl) {
          img.src = fallbackUrl;
        }
      };

      img.addEventListener('error', applyFallback, { once: true });

      // Handle case where image failed before event listener attached
      if (img.complete && img.naturalWidth === 0) {
        applyFallback();
      }
    });
  }

  /**
   * Sticky Navbar Scroll Transition
   */
  function initStickyNavbar() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /**
   * Responsive Mobile Navigation Drawer
   */
  function initMobileNavigation() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!toggleBtn || !drawer) return;

    const closeMenu = () => {
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    };

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        toggleBtn.classList.add('is-active');
        toggleBtn.setAttribute('aria-expanded', 'true');
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
      }
    });

    // Close drawer when clicking any mobile navigation link
    const mobileLinks = drawer.querySelectorAll('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  /**
   * Active Navigation Link Highlight on Scroll
   */
  function initScrollSpy() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.primary-nav .nav-link');
    if (!sections.length || !navLinks.length) return;

    const onScroll = () => {
      const scrollPosition = window.scrollY + 140;

      sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPosition >= top && scrollPosition < top + height) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * Subtle Scroll Reveal Animations using IntersectionObserver
   */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  /**
   * Frontend Contact Form Validation & Demo Feedback
   */
  function initContactFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    const errorName = document.getElementById('error-name');
    const errorEmail = document.getElementById('error-email');
    const errorMessage = document.getElementById('error-message');
    const feedbackBox = document.getElementById('form-feedback');

    const clearErrors = () => {
      [nameInput, emailInput, messageInput].forEach((input) => {
        if (input) input.classList.remove('has-error');
      });
      [errorName, errorEmail, errorMessage].forEach((err) => {
        if (err) err.textContent = '';
      });
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearErrors();

      if (feedbackBox) {
        feedbackBox.hidden = true;
        feedbackBox.textContent = '';
      }

      let isValid = true;

      if (!nameInput.value.trim()) {
        nameInput.classList.add('has-error');
        errorName.textContent = 'Please enter your full name.';
        isValid = false;
      }

      if (!emailInput.value.trim()) {
        emailInput.classList.add('has-error');
        errorEmail.textContent = 'Please enter your email address.';
        isValid = false;
      } else if (!isValidEmail(emailInput.value.trim())) {
        emailInput.classList.add('has-error');
        errorEmail.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      if (!messageInput.value.trim()) {
        messageInput.classList.add('has-error');
        errorMessage.textContent = 'Please enter a short message.';
        isValid = false;
      }

      if (!isValid) return;

      const senderName = nameInput.value.trim();
      form.reset();

      if (feedbackBox) {
        feedbackBox.textContent = `Thank you, ${senderName}. Your inquiry has been recorded in this demo preview for The Meridian Grand Hotel.`;
        feedbackBox.hidden = false;
      }
    });
  }

  /**
   * Dynamic Footer Year
   */
  function initCopyrightYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }
})();