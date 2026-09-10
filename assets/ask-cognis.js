// Ask Cognis — site concierge widget. Floating button + chat panel that answers
// visitor questions from the site's own content via /api/ask (AI Search backed),
// remembers the conversation, and hands the visitor to the team when it
// cannot help (/api/ask/handoff). Self-contained: injects its own styles.
(function () {
  if (window.__askCognis) return;
  window.__askCognis = true;

  var TURNSTILE_SITEKEY = '0x4AAAAAAEt_895eebFcoMJF';
  var MAX_HISTORY = 8;
  var STARTERS = ['What do you do?', 'How does an engagement start?', 'Do you train teams to use AI?', 'Can you build AI agents for a bank?'];
  var TITLES = {
    '/': 'Home', '/our-services/': 'Our services', '/our-services/ai-strategy-advisory/': 'AI Strategy & Advisory',
    '/our-services/ai-training-workforce-development/': 'AI Training & Workforce Development',
    '/our-services/ai-agent-automation-engineering/': 'AI Agent & Automation Engineering', '/products/': 'Products',
    '/case-studies/': 'Case studies', '/how-we-work/': 'How we work', '/why-cognis/': 'Why Cognis', '/faq/': 'FAQ',
    '/contact/': 'Contact', '/about-us/': 'About us', '/careers/': 'Careers', '/blog/': 'Insights',
    '/ai-consulting-nigeria/': 'AI consulting in Nigeria', '/ai-consulting-south-africa/': 'AI consulting in South Africa',
    '/ndpa-compliant-ai/': 'NDPA-compliant AI', '/best-ai-consulting-firms-africa/': 'Buyer’s guide'
  };

  var css = [
    '#cgask-btn{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:10px;background:#131313;color:#D6FD70;border:none;border-radius:100px;padding:14px 20px;font-family:"Plus Jakarta Sans",Inter,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.4px;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,0.25);transition:transform .2s cubic-bezier(.19,1,.22,1)}',
    '#cgask-btn:hover{transform:scale(0.96)}',
    '#cgask-btn svg{width:20px;height:20px;display:block}',
    '#cgask-panel{position:fixed;right:20px;bottom:86px;z-index:9999;width:min(400px,calc(100vw - 40px));height:min(600px,calc(100vh - 120px));background:#fff;border:1px solid #E6E6E6;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.28);display:none;flex-direction:column;overflow:hidden;font-family:"Plus Jakarta Sans",Inter,sans-serif}',
    '#cgask-panel.open{display:flex}',
    '#cgask-head{background:#131313;color:#fff;padding:14px 18px;display:flex;align-items:center;gap:10px}',
    '#cgask-head svg{width:22px;height:22px;flex:none}',
    '#cgask-head .t{font-size:15px;font-weight:600}',
    '#cgask-head .s{font-size:11px;color:rgba(255,255,255,0.55);margin-top:1px}',
    '#cgask-human{margin-left:auto;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;font-size:11px;font-weight:600;border-radius:100px;padding:6px 10px;cursor:pointer;font-family:inherit;white-space:nowrap}',
    '#cgask-human:hover{background:rgba(255,255,255,0.16)}',
    '#cgask-close{background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;line-height:1;padding:4px 0 4px 8px}',
    '#cgask-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F7F7F5}',
    '.cgask-m{max-width:88%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}',
    '.cgask-m.user{align-self:flex-end;background:#131313;color:#fff;border-bottom-right-radius:4px}',
    '.cgask-m.bot{align-self:flex-start;background:#fff;border:1px solid #E6E6E6;color:#131313;border-bottom-left-radius:4px}',
    '.cgask-m.bot a{color:#131313;font-weight:600}',
    '.cgask-m.think{align-self:flex-start;color:#7B7B7B;font-size:13px;background:none;padding:4px 2px}',
    '.cgask-src{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
    '.cgask-src a{font-size:12px;font-weight:600;color:#131313;background:#F2F2F2;border-radius:100px;padding:5px 10px;text-decoration:none}',
    '.cgask-src a:hover{background:#D6FD70}',
    '.cgask-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.cgask-chips button{background:#fff;border:1px solid #E6E6E6;border-radius:100px;padding:7px 12px;font-size:12.5px;font-family:inherit;color:#131313;cursor:pointer}',
    '.cgask-chips button:hover{border-color:#131313}',
    '.cgask-card{align-self:stretch;background:#fff;border:1px solid #E6E6E6;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}',
    '.cgask-card p{margin:0;font-size:13.5px;line-height:1.5;color:#131313}',
    '.cgask-card input{border:1px solid #E6E6E6;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;outline:none;width:100%;box-sizing:border-box}',
    '.cgask-card input:focus{border-color:#131313}',
    '.cgask-card .row{display:flex;gap:8px;align-items:center;justify-content:space-between}',
    '.cgask-card button{background:#131313;color:#D6FD70;border:none;border-radius:100px;padding:10px 16px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}',
    '.cgask-card button:disabled{opacity:.5;cursor:default}',
    '.cgask-card .dismiss{background:none;color:#7B7B7B;font-weight:500;padding:6px 4px}',
    '.cgask-card .err{color:#B42318;font-size:12.5px}',
    '.cgask-card .ts{min-height:65px}',
    '#cgask-form{display:flex;gap:8px;padding:12px;border-top:1px solid #E6E6E6;background:#fff}',
    '#cgask-in{flex:1;border:1px solid #E6E6E6;border-radius:100px;padding:11px 16px;font-size:14px;font-family:inherit;outline:none;min-width:0}',
    '#cgask-in:focus{border-color:#131313}',
    '#cgask-send{background:#D6FD70;color:#131313;border:none;border-radius:100px;padding:0 18px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}',
    '#cgask-send:disabled{opacity:.5;cursor:default}',
    '#cgask-foot{font-size:10.5px;color:#7B7B7B;text-align:center;padding:0 12px 10px;background:#fff}',
    '@media (max-width:539px){#cgask-panel{right:10px;bottom:80px}#cgask-human{display:none}}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var MARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M 42.66 12.34 A 22 22 0 1 0 42.66 35.66 L 33.19 31.71 A 12 12 0 1 1 33.19 16.29 Z"></path><rect x="36" y="19" width="10" height="10" fill="#D6FD70"></rect></svg>';

  var btn = document.createElement('button');
  btn.id = 'cgask-btn';
  btn.setAttribute('aria-label', 'Ask Cognis');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = MARK + '<span>Ask Cognis</span>';

  var panel = document.createElement('div');
  panel.id = 'cgask-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask Cognis chat');
  panel.innerHTML =
    '<div id="cgask-head">' + MARK +
      '<div><div class="t">Ask Cognis</div><div class="s">AI assistant · answers from our website</div></div>' +
      '<button id="cgask-human" type="button">Talk to a person</button>' +
      '<button id="cgask-close" aria-label="Close">&times;</button></div>' +
    '<div id="cgask-msgs" aria-live="polite"></div>' +
    '<form id="cgask-form"><input id="cgask-in" type="text" maxlength="500" placeholder="Ask about our services, products or how to start" autocomplete="off" aria-label="Your question"><button id="cgask-send" type="submit">Ask</button></form>' +
    '<div id="cgask-foot">Answers come from cognis.group and may contain mistakes. For anything important, talk to a person.</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('#cgask-msgs');
  var input = panel.querySelector('#cgask-in');
  var send = panel.querySelector('#cgask-send');

  // Conversation memory for this tab (sent to the server for follow-up questions).
  var history = [];
  var sid = '';
  try {
    history = JSON.parse(sessionStorage.getItem('cgask-history') || '[]');
    sid = sessionStorage.getItem('cgask-sid') || '';
  } catch (e) {}
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    try { sessionStorage.setItem('cgask-sid', sid); } catch (e) {}
  }
  function remember(role, content) {
    history.push({ role: role, content: content });
    history = history.slice(-MAX_HISTORY);
    try { sessionStorage.setItem('cgask-history', JSON.stringify(history)); } catch (e) {}
  }

  function add(cls, html) {
    var d = document.createElement('div');
    d.className = 'cgask-m ' + cls;
    if (cls === 'bot') d.innerHTML = html; else d.textContent = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  // Minimal markdown: bold + links; everything else escaped.
  function render(s) {
    var h = esc(s);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
    return h;
  }
  function titleFor(url) {
    var p = url.replace(/^https?:\/\/[^/]+/, '');
    if (TITLES[p]) return TITLES[p];
    var seg = p.replace(/\/$/, '').split('/').pop() || 'Read more';
    seg = seg.replace(/-/g, ' ');
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }
  function sourcesHtml(list) {
    if (!list || !list.length) return '';
    var seen = {}, out = '';
    for (var i = 0; i < list.length; i++) {
      var u = list[i].replace(/^https?:\/\/(www\.)?cognis\.group/, '');
      if (!u || seen[u] || u === location.pathname) continue;
      seen[u] = 1;
      out += '<a href="' + esc(u) + '">' + esc(titleFor(u)) + ' →</a>';
    }
    return out ? '<div class="cgask-src">' + out + '</div>' : '';
  }

  // ---- Handoff to a person (email capture, protected by Turnstile) ----
  var handoffShown = false, tsLoading = false;
  function loadTurnstile(cb) {
    if (window.turnstile) return cb();
    if (!tsLoading) {
      tsLoading = true;
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    }
    var tries = 0;
    (function wait() { if (window.turnstile) return cb(); if (tries++ < 100) setTimeout(wait, 100); })();
  }
  function showHandoff(lastQuestion, intro) {
    if (handoffShown) { var ex = msgs.querySelector('.cgask-card'); if (ex) { ex.scrollIntoView({ block: 'end' }); ex.querySelector('input[type=email]').focus(); } return; }
    handoffShown = true;
    var card = document.createElement('div');
    card.className = 'cgask-card';
    card.innerHTML =
      '<p>' + esc(intro || 'Want a person to pick this up? Leave your email and a senior team member will reply within two business days.') + '</p>' +
      '<input type="text" name="name" placeholder="Your name (optional)" maxlength="120" autocomplete="name" aria-label="Your name">' +
      '<input type="email" name="email" placeholder="Your work email" maxlength="320" autocomplete="email" required aria-label="Your email">' +
      '<div class="ts" aria-label="Human check"></div>' +
      '<div class="err" hidden></div>' +
      '<div class="row"><button type="button" class="go">Send to the team</button><button type="button" class="dismiss">No thanks</button></div>';
    msgs.appendChild(card);
    msgs.scrollTop = msgs.scrollHeight;
    var token = '', widgetId = null;
    loadTurnstile(function () {
      try {
        widgetId = turnstile.render(card.querySelector('.ts'), { sitekey: TURNSTILE_SITEKEY, size: 'flexible', theme: 'light', action: 'chat-handoff',
          callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; }, 'error-callback': function () { token = ''; } });
      } catch (e) {}
    });
    var err = card.querySelector('.err');
    card.querySelector('.dismiss').addEventListener('click', function () { card.remove(); handoffShown = false; input.focus(); });
    card.querySelector('.go').addEventListener('click', function () {
      var email = card.querySelector('input[type=email]').value.trim();
      var name = card.querySelector('input[name=name]').value.trim();
      if (!email || email.indexOf('@') < 1) { err.hidden = false; err.textContent = 'Please enter a valid email address.'; return; }
      if (!token && window.turnstile) { err.hidden = false; err.textContent = 'Please complete the human check first.'; return; }
      var go = card.querySelector('.go'); go.disabled = true; err.hidden = true;
      fetch('/api/ask/handoff', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, name: name, question: lastQuestion || '', transcript: history, page: location.pathname, sid: sid, turnstile: token }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (x.ok && x.d && x.d.ok) {
          card.remove();
          add('bot', 'Thanks' + (name ? ', ' + esc(name) : '') + '. A senior member of the team has your question and will reply to <strong>' + esc(email) + '</strong> within two business days.');
          remember('assistant', 'Handoff sent: the team will reply by email within two business days.');
        } else {
          go.disabled = false; err.hidden = false; err.textContent = (x.d && x.d.error) || 'That did not go through. Please try again or email info@cognis.group.';
          if (widgetId !== null && window.turnstile) { try { turnstile.reset(widgetId); } catch (e) {} token = ''; }
        }
      }).catch(function () { go.disabled = false; err.hidden = false; err.textContent = 'That did not go through. Please try again or email info@cognis.group.'; });
    });
  }

  var greeted = false;
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      if (history.length) {
        for (var i = 0; i < history.length; i++) add(history[i].role === 'user' ? 'user' : 'bot', history[i].role === 'user' ? history[i].content : render(history[i].content));
      } else {
        add('bot', 'Hi, I’m Cognis Group’s AI assistant. Ask me anything about what we do, our products, or how to get started — or tap <strong>Talk to a person</strong> any time.');
        var chips = document.createElement('div');
        chips.className = 'cgask-chips';
        STARTERS.forEach(function (q) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
          b.addEventListener('click', function () { chips.remove(); ask(q); });
          chips.appendChild(b);
        });
        msgs.appendChild(chips);
      }
    }
    input.focus();
  }
  function close() { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
  panel.querySelector('#cgask-close').addEventListener('click', close);
  panel.querySelector('#cgask-human').addEventListener('click', function () { showHandoff(lastUserQuestion(), 'Happy to connect you. Leave your email and a senior team member will reply within two business days.'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) { close(); btn.focus(); } });

  function lastUserQuestion() { for (var i = history.length - 1; i >= 0; i--) if (history[i].role === 'user') return history[i].content; return ''; }

  function ask(q) {
    add('user', q);
    var prior = history.slice();
    remember('user', q);
    var think = add('think', 'Thinking…');
    send.disabled = true;
    fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, history: prior, page: location.pathname, sid: sid }) })
    .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
    .then(function (x) {
      think.remove();
      var d = x.d || {};
      var answer = d.answer || 'I don’t have a reliable answer to that yet. I can have a senior team member reply within two business days — leave your email below.';
      add('bot', render(answer) + sourcesHtml(d.sources));
      remember('assistant', answer);
      if ((d.escalate || !d.answer) && !d.limited) showHandoff(q);
    }).catch(function () {
      think.remove();
      add('bot', 'Something went wrong on my side. You can leave your email below and a person will reply, or write to <a href="mailto:info@cognis.group">info@cognis.group</a>.');
      showHandoff(q);
    }).finally(function () { send.disabled = false; input.focus(); });
  }

  panel.querySelector('#cgask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    var chips = msgs.querySelector('.cgask-chips'); if (chips) chips.remove();
    ask(q);
  });
})();
