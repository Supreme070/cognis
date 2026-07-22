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
    els.forEach(function (el) {
      if (el.dataset.cuInit) return;
      var p = parse(el.textContent.trim());
      if (!p) return;
      el.dataset.cuInit = '1'; el.__cu = p;
      if (reduced) return;
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
          var t = Math.min(1, (now - start) / dur), v = p.target * ease(t);
          el.textContent = p.prefix + (p.decimals ? v.toFixed(p.decimals) : fmt(Math.round(v))) + p.suffix;
          if (t < 1) requestAnimationFrame(step); else el.textContent = done();
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { if (el.__cu) io.observe(el); });
  }

  function init() { keepAlive(); setInterval(keepAlive, 1000); setupReveal(); setupAppear(); setupCountUp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
