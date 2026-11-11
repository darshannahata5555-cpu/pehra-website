/* =========================================================
   PEHRA — interactions & motion
   GSAP 3 + ScrollTrigger + Lenis smooth scroll
   ========================================================= */
(() => {
  'use strict';

  // ---- Config: things the store team may need to change ----
  const CONFIG = {
    trapPrice: 4499,
    buyUrl: 'https://trybloc.in/#bloc-trap-pro',
    sachetPrices: { 2: 599, 4: null } // TODO: set the 4-pack price; null keeps the label at ₹599
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inr = n => '₹' + n.toLocaleString('en-IN');
  const root = document.documentElement;

  /* ---------------------------------------------------------
     Images: fall back, or show a labelled placeholder slot
     --------------------------------------------------------- */
  $$('.media img').forEach(img => {
    const media = img.closest('.media');
    const fail = () => {
      const fb = img.dataset.fallback;
      if (fb && img.getAttribute('src') !== fb) { img.src = fb; return; }
      media.classList.add('is-missing');
    };
    img.addEventListener('error', fail);
    img.addEventListener('load', () => media.classList.remove('is-missing'));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  });

  /* ---------------------------------------------------------
     Interactions that don't need GSAP
     --------------------------------------------------------- */
  // Quantity + price
  let qty = 1;
  const qtyOut = $('[data-qty-value]');
  const priceEl = $('[data-price]');
  $$('[data-qty]').forEach(b => b.addEventListener('click', () => {
    qty = Math.min(20, Math.max(1, qty + Number(b.dataset.qty)));
    qtyOut.textContent = qty;
    priceEl.textContent = inr(CONFIG.trapPrice * qty);
    if (window.gsap) gsap.fromTo(priceEl, { y: 8, opacity: .4 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
  }));

  // Sachet pack toggle
  const addonPrice = $('.addon__price');
  $$('[data-pack]').forEach(b => b.addEventListener('click', () => {
    $$('[data-pack]').forEach(o => { o.classList.toggle('is-active', o === b); o.setAttribute('aria-checked', o === b); });
    const p = CONFIG.sachetPrices[b.dataset.pack];
    if (p) addonPrice.textContent = inr(p);
  }));

  // Gallery
  const mains = $$('[data-gal-main]');
  const thumbs = $$('[data-gal-thumb]');
  thumbs.forEach((t, i) => t.addEventListener('click', () => {
    mains.forEach((m, j) => m.classList.toggle('is-active', i === j));
    thumbs.forEach((b, j) => { b.classList.toggle('is-active', i === j); b.setAttribute('aria-selected', i === j); });
    if (window.gsap && !reduce) gsap.fromTo(mains[i].querySelector('img'), { scale: 1.08 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
  }));

  // Newsletter (TODO: connect to Shopify customer API / Klaviyo)
  const news = $('[data-news]');
  news && news.addEventListener('submit', e => {
    e.preventDefault();
    const input = news.querySelector('input');
    const msg = $('[data-news-msg]');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
    msg.textContent = "Thanks! You're on the list.";
    input.value = '';
  });

  // Mobile menu
  const burger = $('[data-burger]');
  const closeMenu = () => { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); };
  burger.addEventListener('click', () => {
    const open = !root.classList.contains('menu-open');
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  // FAQ accordion
  const setQA = (qa, open) => {
    const ans = $('.qa__a', qa);
    qa.classList.toggle('is-open', open);
    $('.qa__q', qa).setAttribute('aria-expanded', open);
    if (window.gsap && !reduce) {
      gsap.to(ans, { height: open ? 'auto' : 0, duration: .75, ease: 'expo.out', onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
      if (open) gsap.fromTo(ans.firstElementChild, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: .08, ease: 'power3.out' });
    } else {
      ans.style.height = open ? 'auto' : '0';
    }
  };
  $$('.qa').forEach(qa => $('.qa__q', qa).addEventListener('click', () => {
    const open = !qa.classList.contains('is-open');
    $$('.qa.is-open').forEach(o => o !== qa && setQA(o, false));
    setQA(qa, open);
  }));

  /* ---------------------------------------------------------
     Bail out gracefully if the animation libraries didn't load
     --------------------------------------------------------- */
  const preloader = $('.preloader');
  const finishLoading = () => { document.body.classList.remove('is-loading'); preloader && preloader.remove(); };
  if (!window.gsap || !window.ScrollTrigger) { finishLoading(); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // Anchor links
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: id === '#top' ? 0 : -8 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------------------------------------------------------
     Nav: solid on scroll, hide on scroll down, active section
     --------------------------------------------------------- */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-scrolled', y > 30);
    const delta = y - lastY;
    if (Math.abs(delta) > 6) {
      nav.classList.toggle('is-hidden', delta > 0 && y > 500 && !root.classList.contains('menu-open'));
      lastY = y;
    }
  };
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  $$('.nav__links a').forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
  });

  /* ---------------------------------------------------------
     Text splitting (word masks, keeps <em> etc.)
     --------------------------------------------------------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            const inner = document.createElement('span');
            outer.className = 'wm';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    walk(el);
    return $$('.wm > span', el);
  }

  /* ---------------------------------------------------------
     Reduced motion: show everything, keep state changes only
     --------------------------------------------------------- */
  if (reduce) {
    finishLoading();
    setupMechSteps();
    return;
  }

  /* ---------------------------------------------------------
     Preloader → hero intro
     --------------------------------------------------------- */
  const count = $('[data-count]');
  const fill = $('.preloader .logo--fill');

  function heroIntro() {
    const tl = gsap.timeline();
    const badgeNum = $('.hero__badge [data-counter]');
    const n = { v: 0 };
    tl.from('.hero h1 .line > span', { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: .09 })
      .fromTo('[data-hero-media]', { clipPath: 'inset(100% 0% 0% 0% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.5, ease: 'expo.inOut' }, 0)
      .from('[data-hero-media] img', { scale: 1.4, duration: 2, ease: 'expo.out' }, .25)
      .from('[data-hero-fade]', { y: 26, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08 }, .4)
      .from('[data-hero-badge]', { y: 30, opacity: 0, scale: .92, duration: 1.1, ease: 'back.out(1.5)', stagger: .14 }, 1)
      .to(n, { v: Number(badgeNum.dataset.counter), duration: 1.8, ease: 'power3.out', onUpdate: () => { badgeNum.textContent = Math.round(n.v); } }, 1.05);
    return tl;
  }

  const loader = { v: 0 };
  const startIntro = () => {
    const tl = gsap.timeline();
    tl.to(loader, {
        v: 100, duration: 1.5, ease: 'power2.inOut',
        onUpdate: () => { count.textContent = Math.round(loader.v); fill.style.clipPath = `inset(0 ${100 - loader.v}% 0 0)`; }
      })
      .to('.preloader__inner, .preloader__count, .preloader__tag', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' }, '+=.1')
      .to(preloader, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=.15')
      .add(() => { document.body.classList.remove('is-loading'); lenis && lenis.start(); }, '-=.55')
      .add(heroIntro(), '-=.8')
      .add(() => { preloader.remove(); ScrollTrigger.refresh(); });
  };
  // set hero badge to 0 before the curtain lifts
  $('.hero__badge [data-counter]').textContent = '0';
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1800))]).then(startIntro);

  // Hero parallax on scroll-out
  gsap.to('.hero__visual', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { yPercent: 12, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------------------------------------------------------
     Marquee with scroll-velocity boost
     --------------------------------------------------------- */
  const marquee = gsap.to('[data-marquee]', { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
      gsap.to(marquee, { timeScale: boost, duration: .2, overwrite: true, onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.2, ease: 'power2.out' }) });
    }
  });

  /* ---------------------------------------------------------
     Generic reveals
     --------------------------------------------------------- */
  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 118, duration: 1.15, ease: 'expo.out', stagger: .04, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  $$('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  $$('[data-stagger]').forEach(group => {
    gsap.from([...group.children], { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .1, clearProps: 'transform,opacity', scrollTrigger: { trigger: group, start: 'top 86%', once: true } });
  });

  // Problem cards: strike through the old solution's icon
  $$('.pcard').forEach((card, i) => ScrollTrigger.create({ trigger: card, start: 'top 80%', once: true, onEnter: () => setTimeout(() => card.classList.add('is-in'), 350 + i * 110) }));

  // Statement: words light up as you scroll
  const words = splitWords($('[data-words]'));
  gsap.fromTo(words, { opacity: .12 }, { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 50%', scrub: true } });

  // Count-up numbers
  $$('.stats [data-counter]').forEach(el => {
    const end = Number(el.dataset.counter);
    const o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  // Decorative rings breathe with scroll
  $$('[data-rings]').forEach(svg => gsap.fromTo(svg, { scale: .7, rotate: -20 }, { scale: 1.1, rotate: 20, ease: 'none', scrollTrigger: { trigger: svg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // SVG line icons draw themselves
  $$('[data-draw]').forEach(svg => {
    const shapes = $$('path, circle, rect, line, polyline', svg);
    shapes.forEach(s => { const l = s.getTotalLength(); s.style.strokeDasharray = l; s.style.strokeDashoffset = l; });
    ScrollTrigger.create({ trigger: svg, start: 'top 88%', once: true, onEnter: () => gsap.to(shapes, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: .15 }) });
  });

  // Comparison table
  gsap.from('[data-compare] tbody tr', { opacity: 0, duration: .8, ease: 'power2.out', stagger: .08, scrollTrigger: { trigger: '[data-compare]', start: 'top 82%', once: true } });
  gsap.from('[data-compare] .mark', { scale: 0, duration: .7, ease: 'back.out(2)', stagger: .025, scrollTrigger: { trigger: '[data-compare]', start: 'top 82%', once: true } });

  // Image reveals
  const clipReveal = (el, trigger = el) => {
    gsap.fromTo(el, { clipPath: 'inset(18% 8% 18% 8% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger, start: 'top 85%', once: true } });
    const img = el.querySelector('img');
    img && gsap.from(img, { scale: 1.3, duration: 2, ease: 'expo.out', scrollTrigger: { trigger, start: 'top 85%', once: true } });
  };
  clipReveal($('.gallery__main'));
  clipReveal($('.addon .media'));

  // Footer wordmark rises into place
  gsap.from('[data-footer-mark]', { yPercent: 100, ease: 'none', scrollTrigger: { trigger: '.footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------------------------------------------------------
     Breakpoint-specific choreography
     --------------------------------------------------------- */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    // --- The Silent Guardian: pinned product reveal ---
    const stage = $('[data-guardian]');
    const product = $('[data-g-product]');
    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 85%', end: 'top 10%', scrub: 1 } })
      .from('[data-g-title]', { y: 90, opacity: 0, stagger: .15, ease: 'power2.out' })
      .from(product, { scale: .55, y: 160, opacity: 0, ease: 'power2.out' }, 0);

    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=170%', pin: true, scrub: 1, anticipatePin: 1 } })
      .to(product.querySelector('.media'), { scale: 1.06, duration: 3, ease: 'none' }, 0)
      .from('[data-g-feat]', { opacity: 0, y: 46, duration: .6, stagger: .55, ease: 'power2.out' }, .15)
      .to({}, { duration: .6 });

    const float = gsap.to(product.querySelector('.media'), { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // --- Spaces: horizontal scroll ---
    const track = $('[data-spaces-track]');
    const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    const horiz = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '[data-spaces]', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.to('[data-spaces-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-spaces]', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    $$('.space:not(.space--intro)', track).forEach(card => {
      const img = card.querySelector('img');
      gsap.fromTo(img, { xPercent: -6, scale: 1.18 }, { xPercent: 6, scale: 1.18, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(card, { opacity: 0, y: 60, rotate: 2, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: horiz, start: 'left 105%', end: 'left 65%', scrub: true } });
    });

    // --- Mechanism frame reveal ---
    clipReveal($('.mech__frame'));

    return () => float.kill();
  });

  mm.add('(max-width: 900px)', () => {
    $$('[data-g-feat]').forEach(f => gsap.from(f, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%', once: true } }));
    gsap.from('[data-g-title]', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '[data-guardian]', start: 'top 85%', once: true } });
    clipReveal($('[data-g-product] .media'));
    $$('.space:not(.space--intro) .media, .mstep__mobile-media').forEach(m => clipReveal(m));
  });

  setupMechSteps();

  function setupMechSteps() {
    const steps = $$('[data-mech-step]');
    const medias = $$('[data-mech-media]');
    const dots = $$('.mech__dots i');
    const cap = $('[data-mech-caption]');
    const set = i => {
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      medias.forEach((m, j) => m.classList.toggle('is-active', j === i));
      dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
      cap.textContent = steps[i].dataset.caption;
    };
    steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onToggle: self => self.isActive && set(i) }));
    if (!reduce) gsap.to('[data-mech-rail]', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.mech__steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  }

  /* ---------------------------------------------------------
     Magnetic buttons (mouse only)
     --------------------------------------------------------- */
  if (matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .7, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: .7, ease: 'power3' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28);
        yTo((e.clientY - r.top - r.height / 2) * .38);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
