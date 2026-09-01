/* ═══════════════════════════════════════════════════════════
   VITÀVIE — main.js
   Navbar · Mobile Menu · Smooth Scroll · Scroll Reveal
   Stagger · Counter · Parallax · FAQ · Tabs
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── SMART NAVBAR — hide on scroll-down, reveal on scroll-up ── */
  const navbar = document.getElementById('navbar');

  if (navbar) {
    let lastScrollY = 0;
    let ticking = false;
    const SCROLL_THRESHOLD = 8; // dead-zone to prevent jitter

    function handleNavbarScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      // Always show at very top of page
      if (currentScrollY <= 48) {
        navbar.classList.remove('scrolled', 'nav-hidden');
        lastScrollY = currentScrollY;
        return;
      }

      // Add scrolled class for background blur
      navbar.classList.add('scrolled');

      // Don't hide when mobile menu is open
      const mobileMenuOpen = document.getElementById('mobileMenu');
      if (mobileMenuOpen && mobileMenuOpen.classList.contains('open')) {
        lastScrollY = currentScrollY;
        return;
      }

      // Only act when scroll exceeds dead-zone threshold
      if (Math.abs(delta) > SCROLL_THRESHOLD) {
        if (delta > 0) {
          // Scrolling DOWN → hide
          navbar.classList.add('nav-hidden');
        } else {
          // Scrolling UP → show
          navbar.classList.remove('nav-hidden');
        }
        lastScrollY = currentScrollY;
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          handleNavbarScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    handleNavbarScroll();
  }


  /* ── MOBILE MENU ──────────────────────────────────────── */
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  function openMenu() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
    mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }


  /* ── SMOOTH SCROLL ────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = navbar ? navbar.getBoundingClientRect().height : 72;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
    });
  });


  /* ── SCROLL REVEAL (Intersection Observer) ────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el    = entry.target;
          const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          if (prefersReducedMotion) {
            el.classList.add('revealed');
          } else {
            setTimeout(function () { el.classList.add('revealed'); }, delay);
          }
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }


  /* ── STAGGERED GRID CHILDREN ──────────────────────────── */
  // Finds grids marked [data-stagger] and animates their
  // direct children in sequence when the grid scrolls into view.
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    document.querySelectorAll('[data-stagger]').forEach(function (grid) {
      var children = Array.from(grid.children);
      children.forEach(function (child, i) {
        child.setAttribute('data-stagger-child', '');
        child.style.setProperty('--stagger-i', i);
      });

      var staggerObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Array.from(entry.target.children).forEach(function (child) {
            child.classList.add('revealed');
          });
          staggerObs.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

      staggerObs.observe(grid);
    });
  }


  /* ── STAT COUNTER ANIMATION ───────────────────────────── */
  function animateCounter(el, target, duration) {
    var start = performance.now();
    function tick(now) {
      var elapsed  = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3); // ease out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  }

  var statEl = document.querySelector('.about__stat-number');
  if (statEl && !prefersReducedMotion) {
    var numNode  = statEl.childNodes[0]; // the text node "7"
    var numValue = parseInt(numNode && numNode.textContent.trim(), 10);
    if (!isNaN(numValue)) {
      var counted = false;
      var counterObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !counted) {
          counted = true;
          numNode.textContent = '0';
          animateCounter({ get textContent() { return numNode.textContent; }, set textContent(v) { numNode.textContent = v; } }, numValue, 1200);
          counterObs.disconnect();
        }
      }, { threshold: 0.5 });
      counterObs.observe(statEl);
    }
  }


  /* ── HERO PARALLAX (desktop only) ─────────────────────── */
  if (!prefersReducedMotion && window.innerWidth >= 900) {
    var heroPh = document.querySelector('.hero__image-frame .ph--hero');
    if (heroPh) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          heroPh.style.transform = 'translateY(' + (scrollY * 0.10) + 'px)';
          ticking = false;
        });
      }, { passive: true });
    }
  }


  /* ── FAQ ACCORDION ────────────────────────────────────── */
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    var btn    = item.querySelector('.faq-item__q');
    var answer = item.querySelector('.faq-item__a');
    if (!btn || !answer) return;

    answer.style.overflow   = 'hidden';
    answer.style.transition = 'max-height 480ms cubic-bezier(0.16, 1, 0.3, 1)';
    answer.style.maxHeight  = null;

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      faqItems.forEach(function (other) {
        var ob = other.querySelector('.faq-item__q');
        var oa = other.querySelector('.faq-item__a');
        if (ob && oa && ob !== btn) {
          ob.setAttribute('aria-expanded', 'false');
          oa.hidden = true;
          oa.style.maxHeight = null;
        }
      });

      if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        answer.style.maxHeight = null;
      } else {
        answer.hidden = false;
        requestAnimationFrame(function () {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        });
      }
    });
  });


  /* ── TAB SWITCHER ─────────────────────────────────────── */
  function initTabGroup(navEl) {
    var buttons = navEl.querySelectorAll('[role="tab"]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          b.classList.remove('tab-btn--active', 'brand-tab-btn--active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add(navEl.classList.contains('brand-tab-nav') ? 'brand-tab-btn--active' : 'tab-btn--active');
        btn.setAttribute('aria-selected', 'true');

        var targetId = btn.getAttribute('data-tab');
        var section  = navEl.closest('section');
        if (!section) return;
        section.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
          var isTarget = panel.id === targetId;
          panel.hidden = !isTarget;
          panel.classList.toggle('tab-panel--active', isTarget);
          if (isTarget) { panel.offsetHeight; } // layout recalc
        });
      });
    });
  }

  document.querySelectorAll('[role="tablist"]').forEach(initTabGroup);

  // Connect wellness menu cards to tab switching
  document.querySelectorAll('.wellness-menu-card[data-tab]').forEach(function (card) {
    card.addEventListener('click', function () {
      var tabId = card.getAttribute('data-tab');
      var correspondingBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      if (correspondingBtn) {
        correspondingBtn.click();
        correspondingBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });


  /* ── ACTIVE NAV LINK (scroll spy) ─────────────────────── */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    var scrollY = window.scrollY + 130;
    sections.forEach(function (section) {
      var id = section.getAttribute('id');
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(function (link) {
          link.classList.toggle('nav-link--active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  if (navLinks.length && sections.length) {
    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

})();
