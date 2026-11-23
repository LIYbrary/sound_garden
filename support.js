/* LIYbrary "Support us" panel, shared by the LIYbrary apps (keep the copies identical).
   Put <button type="button" data-support>…</button> anywhere, then load this script with:
     data-app="App name"  data-package="Android package ID"  data-paypal="donation URL (optional)"
   A grown-up check comes first, as the panel leads outside the app.
   Google Play rules followed here:
   - Ratings: ask openly, offer nothing in return, and ask everyone (not only happy users).
   - Donations: inside a Play app, links to outside payment are only allowed for registered charities,
     so the PayPal option shows on the website only. "Rate on Google Play" shows inside the Android app only,
     where the listing is known to exist.
   Rating nudge: apps call LIY.done() when someone finishes something (a round, a puzzle). Inside the Android app only,
   a small card may then ask for a rating, at most 3 times ever, never before the 4th finish or the 2nd day,
   30 days apart, and never again after "Rate". It asks everyone the same way, with no reward.
   Add ?liy-play=1 to the address once to try the Android-app behaviour in a browser. */
(() => {
  const me = document.currentScript, d = me.dataset;
  const APP = d.app || document.title, PKG = d.package, PAYPAL = d.paypal, GATE = d.gate !== 'off';
  const STORE = PKG ? 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(PKG) : '';
  const PAGE = location.origin + location.pathname;

  // Opened from the Google Play app: Android reports it as the referrer on launch. Remember it on this device.
  let inPlayApp = false;
  try {
    if (document.referrer.startsWith('android-app://') || /[?&]liy-play=1/.test(location.search)) localStorage.setItem('liy-play-app', '1');
    inPlayApp = localStorage.getItem('liy-play-app') === '1';
  } catch (e) { inPlayApp = document.referrer.startsWith('android-app://'); }

  const css = document.createElement('style');
  css.textContent = `
.liy-dlg{border:0;border-radius:22px;padding:24px;max-width:360px;width:calc(100% - 32px);color:#26344a;background:#fff;box-shadow:0 18px 50px #0003;font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
.liy-dlg::backdrop{background:#17112e80}
.liy-dlg h3{margin:0 0 6px;font-size:1.3rem}
.liy-dlg p{margin:0 0 14px;color:#5d6475}
.liy-q{font-size:1.6rem;font-weight:800;color:#26344a!important}
.liy-dlg input{width:100%;font:inherit;font-size:1.4rem;padding:10px;border:2px solid #cad2e5;border-radius:12px;text-align:center}
.liy-err{min-height:1.4em;margin:6px 0 0!important;color:#c4532f!important;font-weight:700}
.liy-opts{display:grid;gap:10px;margin:4px 0 14px}
.liy-opt{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:2px solid #e6e9f2;border-radius:16px;background:#f7f8fc;color:#26344a;font:inherit;text-align:left;text-decoration:none;cursor:pointer}
.liy-opt:hover{border-color:#b9c4ea}
.liy-opt span:first-child{font-size:1.6rem}
.liy-opt b{display:block}
.liy-opt small{color:#5d6475}
.liy-row{display:flex;gap:10px;justify-content:center}
.liy-btn{border:0;border-radius:99px;padding:11px 20px;font:inherit;font-weight:700;cursor:pointer;background:#eef0f6;color:#26344a}
.liy-btn.go{background:#3654bd;color:#fff}
.liy-dlg :focus-visible,.liy-card :focus-visible{outline:3px solid #ffb703;outline-offset:2px}
.liy-card{position:fixed;z-index:9999;left:50%;bottom:16px;width:min(440px,calc(100% - 24px));display:flex;align-items:center;gap:12px;padding:12px 12px 12px 16px;
  border-radius:18px;background:#fff;color:#26344a;box-shadow:0 10px 34px #0003;font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  translate:-50% 0;animation:liy-in .35s ease-out}
.liy-card p{flex:1;margin:0}
.liy-card .liy-btn{padding:9px 14px;white-space:nowrap}
.liy-card .x{background:none;padding:6px 8px;color:#5d6475}
@keyframes liy-in{from{opacity:0;transform:translateY(16px)}}
@media (prefers-reduced-motion:reduce){.liy-card{animation:none}}`;
  document.head.append(css);

  const dlg = document.createElement('dialog');
  dlg.className = 'liy-dlg';
  dlg.setAttribute('aria-labelledby', 'liy-title');
  document.body.append(dlg);
  let answer = 0;

  function gate(then = panel) {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    answer = a * b;
    dlg.innerHTML = `<form method="dialog"><h3 id="liy-title">For grown-ups</h3><p>Ways to support ${esc(APP)} lead outside the app. Please solve:</p>
      <p class="liy-q">${a} × ${b} = ?</p><input inputmode="numeric" autocomplete="off" aria-label="Answer">
      <p class="liy-err" role="alert"></p><div class="liy-row"><button class="liy-btn" value="cancel" formnovalidate>Cancel</button><button class="liy-btn go" value="go">Continue</button></div></form>`;
    dlg.querySelector('.go').onclick = e => {
      e.preventDefault();
      if (+dlg.querySelector('input').value.trim() === answer) then();
      else dlg.querySelector('.liy-err').textContent = 'That’s not quite right.';
    };
  }

  function panel() {
    const opts = [];
    if (inPlayApp && PKG) opts.push(`<a class="liy-opt" target="_blank" rel="noopener" href="https://play.google.com/store/apps/details?id=${encodeURIComponent(PKG)}">
      <span aria-hidden="true">⭐</span><span><b>Rate it on Google Play</b><small>Tell us honestly what works and what doesn’t. Every rating helps us improve it.</small></span></a>`);
    opts.push(`<button type="button" class="liy-opt" data-share><span aria-hidden="true">💬</span><span><b>Tell a friend</b><small>Share ${esc(APP)} with a family or teacher who might like it.</small></span></button>`);
    if (!inPlayApp && PAYPAL) opts.push(`<a class="liy-opt" target="_blank" rel="noopener" href="${esc(PAYPAL)}">
      <span aria-hidden="true">💛</span><span><b>Chip in</b><small>Optional, via PayPal. ${esc(APP)} stays free for everyone.</small></span></a>`);
    dlg.innerHTML = `<h3 id="liy-title">Thanks for using ${esc(APP)}!</h3><p>It’s free, with no ads. ${inPlayApp ? 'Your honest rating is the best feedback we can get.' : 'Here’s how you can help it grow.'}</p>
      <div class="liy-opts">${opts.join('')}</div><div class="liy-row"><button type="button" class="liy-btn" data-close>Close</button></div>`;
    dlg.querySelector('[data-close]').onclick = () => dlg.close();
    const share = dlg.querySelector('[data-share]');
    share.onclick = async () => {
      const data = { title: APP, text: `${APP}, a free learning app from LIYbrary`, url: PAGE };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(PAGE); share.querySelector('small').textContent = 'Link copied. Paste it in a message.'; }
      } catch (e) { if (e && e.name !== 'AbortError') share.querySelector('small').textContent = PAGE; }
    };
    dlg.querySelector('.liy-opt')?.focus();
  }

  // ---- Rating nudge after a finished task ----
  const KEY = 'liy-rate';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch (e) { return {} } };
  const keep = st => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch (e) {} };
  const DAY = 864e5;
  let card = null;
  function done() {
    if (!inPlayApp || !STORE || card) return;
    const st = load(), now = Date.now();
    st.first = st.first || now; st.tasks = (st.tasks || 0) + 1; st.asks = st.asks || 0;
    keep(st);
    if (st.rated || st.asks >= 3 || st.tasks < 4 || now - st.first < DAY || now < (st.next || 0)) return;
    setTimeout(showCard, 1500); // let the "well done" moment land first
  }
  function later() {
    const st = load(); st.asks = (st.asks || 0) + 1; st.next = Date.now() + 30 * DAY; keep(st); hideCard();
  }
  function rate() {
    const st = load(); st.rated = 1; keep(st); hideCard();
    const go = () => { dlg.close(); window.open(STORE, '_blank', 'noopener') };
    if (GATE) { gate(go); dlg.showModal(); dlg.querySelector('input')?.focus() } else window.open(STORE, '_blank', 'noopener');
  }
  function showCard() {
    if (card || dlg.open) return;
    card = document.createElement('div');
    card.className = 'liy-card'; card.setAttribute('role', 'status');
    card.innerHTML = `<p>${GATE ? '<b>Grown-ups:</b> ' : ''}Got a moment? Rate <b>${esc(APP)}</b> on Google Play. Good or bad, it helps us improve.</p>
      <button type="button" class="liy-btn go">Rate</button><button type="button" class="liy-btn x" aria-label="Not now">Not now</button>`;
    card.querySelector('.go').onclick = rate;
    card.querySelector('.x').onclick = later;
    document.body.append(card);
    card.timer = setTimeout(later, 20000); // fades away on its own, counted as "not now"
  }
  function hideCard() { if (card) { clearTimeout(card.timer); card.remove(); card = null } }
  window.LIY = { done };

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-support]')) return;
    gate();
    dlg.showModal();
    dlg.querySelector('input')?.focus();
  });
})();
