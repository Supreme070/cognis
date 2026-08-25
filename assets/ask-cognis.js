// Ask Cognis — site concierge widget. Floating button + chat panel that answers
// visitor questions from the site's own content via /api/ask (AI Search backed).
// Self-contained: injects its own styles; no dependencies.
(function () {
  if (window.__askCognis) return;
  window.__askCognis = true;

  var css = [
    '#cgask-btn{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:10px;background:#131313;color:#D6FD70;border:none;border-radius:100px;padding:14px 20px;font-family:"Plus Jakarta Sans",Inter,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.4px;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,0.25);transition:transform .2s cubic-bezier(.19,1,.22,1)}',
    '#cgask-btn:hover{transform:scale(0.96)}',
    '#cgask-btn svg{width:20px;height:20px;display:block}',
    '#cgask-panel{position:fixed;right:20px;bottom:86px;z-index:9999;width:min(390px,calc(100vw - 40px));height:min(560px,calc(100vh - 120px));background:#fff;border:1px solid #E6E6E6;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.28);display:none;flex-direction:column;overflow:hidden;font-family:"Plus Jakarta Sans",Inter,sans-serif}',
    '#cgask-panel.open{display:flex}',
    '#cgask-head{background:#131313;color:#fff;padding:16px 18px;display:flex;align-items:center;gap:10px}',
    '#cgask-head svg{width:22px;height:22px}',
    '#cgask-head .t{font-size:15px;font-weight:600}',
    '#cgask-head .s{font-size:11px;color:rgba(255,255,255,0.55);margin-top:1px}',
    '#cgask-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;line-height:1;padding:4px}',
    '#cgask-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F7F7F5}',
    '.cgask-m{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}',
    '.cgask-m.user{align-self:flex-end;background:#131313;color:#fff;border-bottom-right-radius:4px}',
    '.cgask-m.bot{align-self:flex-start;background:#fff;border:1px solid #E6E6E6;color:#131313;border-bottom-left-radius:4px}',
    '.cgask-m.bot a{color:#131313;font-weight:600}',
    '.cgask-m.think{align-self:flex-start;color:#7B7B7B;font-size:13px;background:none;padding:4px 2px}',
    '#cgask-form{display:flex;gap:8px;padding:12px;border-top:1px solid #E6E6E6;background:#fff}',
    '#cgask-in{flex:1;border:1px solid #E6E6E6;border-radius:100px;padding:11px 16px;font-size:14px;font-family:inherit;outline:none}',
    '#cgask-in:focus{border-color:#131313}',
    '#cgask-send{background:#D6FD70;color:#131313;border:none;border-radius:100px;padding:0 18px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}',
    '#cgask-send:disabled{opacity:.5;cursor:default}',
    '@media (max-width:539px){#cgask-panel{right:10px;bottom:80px}}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var MARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M 42.66 12.34 A 22 22 0 1 0 42.66 35.66 L 33.19 31.71 A 12 12 0 1 1 33.19 16.29 Z"></path><rect x="36" y="19" width="10" height="10" fill="#D6FD70"></rect></svg>';

  var btn = document.createElement('button');
  btn.id = 'cgask-btn';
  btn.setAttribute('aria-label', 'Ask Cognis');
  btn.innerHTML = MARK + '<span>Ask Cognis</span>';

  var panel = document.createElement('div');
  panel.id = 'cgask-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask Cognis chat');
  panel.innerHTML =
    '<div id="cgask-head">' + MARK +
      '<div><div class="t">Ask Cognis</div><div class="s">Answers from our services, work, and thinking</div></div>' +
      '<button id="cgask-close" aria-label="Close">&times;</button></div>' +
    '<div id="cgask-msgs"></div>' +
    '<form id="cgask-form"><input id="cgask-in" type="text" maxlength="500" placeholder="e.g. Can you deploy AI agents for a bank?" autocomplete="off"><button id="cgask-send" type="submit">Ask</button></form>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('#cgask-msgs');
  var input = panel.querySelector('#cgask-in');
  var send = panel.querySelector('#cgask-send');

  function add(cls, html) {
    var d = document.createElement('div');
    d.className = 'cgask-m ' + cls;
    if (cls === 'bot') d.innerHTML = html; else d.textContent = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Minimal markdown: links + bold; everything else escaped.
  function render(s) {
    var h = esc(s);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
    return h;
  }

  var greeted = false;
  function open() {
    panel.classList.add('open');
    if (!greeted) {
      greeted = true;
      add('bot', 'Hi! Ask me anything about Cognis Group: what we do, our products, or how to get started.');
    }
    input.focus();
  }
  btn.addEventListener('click', function () { panel.classList.contains('open') ? panel.classList.remove('open') : open(); });
  panel.querySelector('#cgask-close').addEventListener('click', function () { panel.classList.remove('open'); });

  panel.querySelector('#cgask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    add('user', q);
    var think = add('think', 'Thinking…');
    send.disabled = true;
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    }).then(function (r) { return r.json(); }).then(function (d) {
      think.remove();
      var answer = (d && d.answer) || 'Sorry, I could not find an answer to that. You can reach the team at info@cognis.group.';
      add('bot', render(answer) + '<br><br><a href="/contact/">Talk to the team →</a>');
    }).catch(function () {
      think.remove();
      add('bot', 'Something went wrong on my side. Please try again, or write to <a href="mailto:info@cognis.group">info@cognis.group</a>.');
    }).finally(function () { send.disabled = false; input.focus(); });
  });
})();
