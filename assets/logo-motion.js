// Cognis brand motion: logo reveal — ring sweeps in, keystone snaps (Brand Guidelines V1.0 §6).
// Plays once per session on first load; never loops; static under prefers-reduced-motion.
(function () {
  var KEY = 'cgLogoRevealPlayed';
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
  } catch (e) { return; }
  var css = '.cg-mark-hero path{transform-box:fill-box;transform-origin:50% 50%;animation:cgRingIn 1.6s cubic-bezier(0.22,1,0.36,1) both}' +
    '.cg-mark-hero rect{transform-box:fill-box;transform-origin:50% 50%;animation:cgKeyIn 0.9s cubic-bezier(0.34,1.56,0.64,1) 1.15s both}' +
    '@keyframes cgRingIn{from{transform:rotate(-110deg);opacity:0}30%{opacity:1}to{transform:rotate(0deg);opacity:1}}' +
    '@keyframes cgKeyIn{from{transform:scale(0)}60%{transform:scale(1.28)}to{transform:scale(1)}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
