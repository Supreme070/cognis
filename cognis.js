/* Cognis static enhancements — scroll reveal, count-up, video loop. No framework. */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep hero/background videos looping (some browsers drop loop/muted).
  function keepAlive() {
    document.querySelectorAll('video').forEach(function (v) {
      if (!v.loop) v.loop = true;
      if (!v.muted) v.muted = true;
      if (v.ended) { try { v.currentTime = 0; } catch (e) {} }
      if (v.paused && v.readyState >= 2) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }

  function setupReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var EASE = 'cubic-bezier(.22,1,.36,1)';
    function splitWords(el) {
      if (el.dataset.cgSplit) return [];
      el.dataset.cgSplit = '1';
      var words = [];
      [].slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (p === '') return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'cgw'; s.textContent = p; words.push(s); frag.appendChild(s);
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName !== 'BR') { node.classList.add('cgw'); words.push(node); }
      });
      return words;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var words = e.target.__cgWords || [];
        words.forEach(function (w, i) {
          w.style.transition = 'opacity .6s ' + EASE + ' ' + (i * 0.04) + 's, transform .6s ' + EASE + ' ' + (i * 0.04) + 's';
          w.style.opacity = '1'; w.style.transform = 'none';
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    [].slice.call(document.querySelectorAll('h2, h3')).forEach(function (h) {
      var words = splitWords(h);
      if (!words.length) return;
      words.forEach(function (w) { w.style.display = 'inline-block'; w.style.opacity = '0'; w.style.transform = 'translateY(14px)'; w.style.willChange = 'opacity, transform'; });
      h.__cgWords = words;
      io.observe(h);
    });
  }

  function setupAppear() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0px)'; }, Number(el.dataset.stagger || 0));
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    var groups = {};
    [].slice.call(document.querySelectorAll('[data-appear]')).forEach(function (el) {
      var key = el.parentElement;
      groups.k = groups.k === key ? groups.k : key;
    });
    var idx = 0, lastParent = null;
    [].slice.call(document.querySelectorAll('[data-appear]')).forEach(function (el) {
      if (el.parentElement === lastParent) idx += 1; else { idx = 0; lastParent = el.parentElement; }
      el.dataset.stagger = String(idx * 90);
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      io.observe(el);
    });
  }

  function setupCountUp() {
    if (!('IntersectionObserver' in window)) return;
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    function parse(txt) {
      var m = txt.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
      if (!m) return null;
      var raw = m[2];
      return { prefix: m[1], suffix: m[3], target: parseFloat(raw.replace(/,/g, '')), decimals: raw.indexOf('.') > -1 ? (raw.split('.')[1] || '').length : 0 };
    }
    var els = [].slice.call(document.querySelectorAll('[data-countup]'));
    // An element clipped fully outside an overflow-hidden ancestor (e.g. the
    // about-us collage at mobile) will never intersect — leave it at its
    // final value instead of zeroing it forever.
    function clippedOut(el) {
      var r = el.getBoundingClientRect(), a = el.parentElement;
      while (a && a !== document.body) {
        var cs = window.getComputedStyle(a);
        if (cs.display === 'none') return true;
        // Only a truly clipping axis counts — auto/scroll ancestors can be
        // scrolled, so "outside" there just means below the fold.
        var b = a.getBoundingClientRect();
        var clipY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
        var clipX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
        if (clipY && (r.bottom < b.top || r.top > b.bottom)) return true;
        if (clipX && (r.right < b.left || r.left > b.right)) return true;
        a = a.parentElement;
      }
      return false;
    }
    els.forEach(function (el) {
      // NOTE: prerendered snapshots carry a stale data-cu-init="1" from the
      // dc-runtime pass — guard on an internal property so we still animate.
      if (el.__cuInit) return;
      var p = parse(el.textContent.trim());
      if (!p) return;
      el.__cuInit = true;
      if (reduced || clippedOut(el)) return;
      el.__cu = p;
      el.textContent = p.prefix + (p.decimals ? (0).toFixed(p.decimals) : '0') + p.suffix;
    });
    if (reduced) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, p = el.__cu; io.unobserve(el);
        if (!p) return;
        var dur = 1500, start = performance.now(), ease = function (t) { return 1 - Math.pow(1 - t, 3); };
        function done() { return p.prefix + (p.decimals ? p.target.toFixed(p.decimals) : fmt(p.target)) + p.suffix; }
        function step(now) {
          var t = Math.min(1, (now - start) / dur), v = Math.max(0, p.target * ease(t));
          el.textContent = p.prefix + (p.decimals ? v.toFixed(p.decimals) : fmt(Math.round(v) || 0)) + p.suffix;
          if (t < 1) requestAnimationFrame(step); else el.textContent = done();
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { if (el.__cu) io.observe(el); });
  }

  // Services accordion: dc-runtime drove this via React state (onMouseEnter/
  // onClick -> setState(activeSvc)); prerender froze the first card open and
  // dropped the handlers. Re-wire it in vanilla JS to match the original —
  // active card flex:1.78 + video visible, others flex:1 + video hidden.
  function setupServices() {
    var section = document.getElementById('services');
    if (!section) return;
    var cards = [].slice.call(section.querySelectorAll('div')).filter(function (d) {
      return /cursor:\s*pointer/.test(d.getAttribute('style') || '') && d.querySelector('video');
    });
    if (cards.length < 2) return;
    function activate(idx) {
      cards.forEach(function (card, i) {
        card.style.flex = (i === idx) ? '1.78 1 0%' : '1 1 0%';
        var v = card.querySelector('video');
        if (v && v.parentElement) v.parentElement.style.opacity = (i === idx) ? '1' : '0';
      });
    }
    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { activate(i); });
      card.addEventListener('click', function () { activate(i); });
    });
  }

  // Products page: React drove a top accent-line grow-in on card hover
  // (scaleX(0) -> scaleX(1)). Card lift is CSS; re-wire the line here.
  function setupProductHover() {
    var lines = [].slice.call(document.querySelectorAll('a div[style*="transform-origin: left"]'))
      .filter(function (d) { return /height:\s*4px/.test(d.getAttribute('style') || ''); });
    lines.forEach(function (line) {
      var card = line.closest('a');
      if (!card) return;
      card.addEventListener('mouseenter', function () { line.style.transform = 'scaleX(1)'; });
      card.addEventListener('mouseleave', function () { line.style.transform = 'scaleX(0)'; });
    });
  }

  // Services page: testimonials prev/next carousel (React translated the track
  // by 428px/card, clamped to n-3). Re-wire the buttons.
  function setupTestiCarousel() {
    var prev = document.querySelector('button[aria-label="Previous"]');
    var next = document.querySelector('button[aria-label="Next"]');
    var track = document.querySelector('div[style*="transition: transform 0.45s"][style*="translateX"]');
    if (!prev || !next || !track) return;
    var n = track.children.length;
    if (n < 2) return;
    var ti = 0;
    function render() {
      var i = ((ti % n) + n) % n;
      var shown = Math.max(0, Math.min(i, n - 3));
      track.style.transform = 'translateX(' + (shown * -428) + 'px)';
    }
    prev.addEventListener('click', function () { ti -= 1; render(); });
    next.addEventListener('click', function () { ti += 1; render(); });
  }

  // Mobile nav: the desktop header has no hamburger. Build one from the
  // existing header links; CSS (responsive.css) hides the desktop links and
  // shows this button under 900px.
  // Clean label: EXPLORE items expose a .t title (+ .d description); main
  // links wrap the label in a .cgRoll with two <b> copies (hover roll).
  function cgLabelOf(a) {
    var t = a.querySelector('.t');
    if (t) return (t.textContent || '').trim();
    var bold = a.querySelector('.cgRoll b') || a.querySelector('b');
    if (bold) return (bold.textContent || '').trim();
    var txt = (a.textContent || '').replace(/\s+/g, ' ').trim();
    var half = txt.length / 2;
    if (txt.length % 2 === 0 && txt.slice(0, half) === txt.slice(half)) return txt.slice(0, half);
    return txt;
  }

  function setupMobileNav() {
    if (document.querySelector('[data-cg-hamburger]')) return;
    // Pages can render the header twice (initial + sticky). Probe with links
    // that appear in EVERY header (the current page's own link may be active/
    // href-less, so don't rely on it). Mark ALL nav rows + all headers.
    var probes = [].slice.call(document.querySelectorAll('a[href="/our-services/"], a[href="/products/"], a[href="/about-us/"], a[href="/blog/"]'));
    if (!probes.length) return;
    var wraps = [], headers = [], color = '#131313';
    probes.forEach(function (a) {
      var wrap = a.parentElement;
      if (wrap && wraps.indexOf(wrap) < 0) { wraps.push(wrap); wrap.setAttribute('data-cg-navlinks', ''); color = window.getComputedStyle(a).color || color; }
      var h = wrap, g = 0, found = null;
      while (h && g++ < 8) { if (/space-between/.test(h.getAttribute('style') || '')) { found = h; break; } h = h.parentElement; }
      if (found && headers.indexOf(found) < 0) headers.push(found);
    });
    if (!headers.length && wraps[0]) headers = [wraps[0].parentElement];

    // Build the shared menu from every header link (dedup by href).
    var seen = {}, items = [];
    headers.forEach(function (h) {
      [].slice.call(h.querySelectorAll('a[href]')).forEach(function (a) {
        var href = a.getAttribute('href'), text = cgLabelOf(a);
        if (!href || href === '#' || !text || seen[href]) return;
        seen[href] = 1;
        items.push({ href: href, text: text, cta: /\/contact\/?$/.test(href) && /work with us/i.test(text) });
      });
    });
    if (!seen['/']) items.unshift({ href: '/', text: 'Home', cta: false });

    var menu = document.createElement('nav');
    menu.setAttribute('data-cg-menu', '');
    menu.innerHTML = items.map(function (it) {
      return '<a href="' + it.href + '"' + (it.cta ? ' class="cg-menu-cta"' : '') + '>' + it.text + '</a>';
    }).join('');
    document.body.appendChild(menu);

    function setBurgers(open) {
      [].slice.call(document.querySelectorAll('[data-cg-hamburger]')).forEach(function (b) {
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    }
    function toggle() {
      var open = menu.classList.toggle('cg-open');
      setBurgers(open);
      document.body.classList.toggle('cg-menu-lock', open);
    }
    // One hamburger per header (only the visible header's shows on mobile).
    headers.forEach(function (h) {
      var burger = document.createElement('button');
      burger.setAttribute('data-cg-hamburger', '');
      burger.setAttribute('aria-label', 'Open menu');
      burger.setAttribute('aria-expanded', 'false');
      // Color from a nav link inside THIS header (pages differ: dark hero
      // headers use white links, light headers use ink — and the footer must
      // never win).
      var probeLink = h.querySelector('[data-cg-navlinks] a') || h.querySelector('a[href]');
      burger.style.color = probeLink ? window.getComputedStyle(probeLink).color : color;
      burger.innerHTML = '<span></span><span></span><span></span>';
      burger.addEventListener('click', toggle);
      h.appendChild(burger);
    });
    [].slice.call(menu.querySelectorAll('a')).forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('cg-open'); setBurgers(false); document.body.classList.remove('cg-menu-lock'); });
    });
  }

  // Screen-aware hero: the 3D card ring is ~1240px wide by design. Scale it
  // continuously to the actual viewport (not a breakpoint jump) and shrink
  // the height it reserves to match — so the hero composition fits any
  // screen, like the reference template.
  function setupHeroScale() {
    var ring = document.querySelector('[style*="perspective: 3000px"]');
    if (!ring) return;
    var row = ring.closest('[style*="height: 230px"]');
    // The trust badge sits in flow right after the card ring; the cards float
    // ~140px below the ring's box, so without help they cover it. Find it once.
    var trust = null, divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      if ((divs[i].textContent || '').trim().indexOf('Trusted by organizations') === 0) { trust = divs[i]; break; }
    }
    function fit() {
      var w = document.documentElement.clientWidth || window.innerWidth;
      var s = Math.min(1, Math.max(0.34, w / 1240));
      if (s < 0.999) {
        ring.style.transform = 'scale(' + s.toFixed(3) + ')';
        ring.style.transformOrigin = 'center top';
        if (row) row.style.height = Math.round(230 * s) + 'px';
      } else {
        ring.style.transform = '';
        if (row) row.style.height = '230px'; // keep the reserved space; '' collapsed it
      }
      // Drop the trust badge clear of the floating cards' real bottom edge.
      if (trust) {
        trust.style.marginTop = '0px';
        var cardsBottom = row ? row.getBoundingClientRect().bottom : ring.getBoundingClientRect().bottom;
        var kids = ring.querySelectorAll('*');
        for (var k = 0; k < kids.length; k++) {
          var b = kids[k].getBoundingClientRect().bottom;
          if (b > cardsBottom) cardsBottom = b;
        }
        var gap = cardsBottom - trust.getBoundingClientRect().top;
        if (gap > 0) trust.style.marginTop = Math.round(gap + 24) + 'px';
      }
    }
    fit();
    window.addEventListener('resize', fit);
  }

  function init() { keepAlive(); setInterval(keepAlive, 1000); setupReveal(); setupAppear(); setupCountUp(); setupServices(); setupProductHover(); setupTestiCarousel(); setupMobileNav(); setupHeroScale(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
