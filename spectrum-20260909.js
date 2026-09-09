/* VoxelBox / Spectrum. Native scrolling, real work, small purposeful interactions. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const header = $('[data-top]');
  const menu = $('.top-nav');
  const toggle = $('.nav-toggle');
  menu.id = 'primary-navigation';
  toggle.setAttribute('aria-controls', menu.id);
  const closeMenu = () => {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) {
      closeMenu(); toggle.focus();
    }
  });
  matchMedia('(min-width:901px)').addEventListener('change', closeMenu);

  // Each window stays independently movable. The shuffle button also works with a keyboard.
  const playground = $('.window-playground');
  const windows = $$('.project-window');
  let layer = windows.length;
  const notice = document.createElement('span');
  notice.className = 'sr-only';
  notice.setAttribute('aria-live', 'polite');
  playground.append(notice);
  const limit = (value, min, max) => Math.min(max, Math.max(min, value));
  windows.forEach((card, i) => {
    const handle = $('.window-bar', card);
    const title = $('b', handle).textContent.split(' / ')[0];
    let x = 0, y = 0, drag = null;
    handle.tabIndex = 0;
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', `${title} preview. Use arrow keys to move; Enter to bring forward.`);
    const move = (nextX, nextY) => {
      const maxX = Math.max(12, playground.clientWidth * .13);
      const maxY = Math.max(25, playground.clientHeight * .18);
      x = limit(nextX, -maxX, maxX);
      y = limit(nextY, -maxY, maxY);
      card.style.setProperty('--dx', `${x}px`);
      card.style.setProperty('--dy', `${y}px`);
    };
    const front = () => { card.style.zIndex = ++layer; };
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, startX: x, startY: y, id: e.pointerId };
      handle.setPointerCapture(e.pointerId);
      card.classList.add('dragging');
      front();
    });
    handle.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      move(drag.startX + e.clientX - drag.x, drag.startY + e.clientY - drag.y);
    });
    const end = () => { drag = null; card.classList.remove('dragging'); };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', end);
    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 25 : 10;
      const delta = {ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
      if (delta) { e.preventDefault(); front(); move(x + delta[0], y + delta[1]); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); front(); }
      else if (e.key === 'Home') { e.preventDefault(); move(0, 0); }
    });
    card.addEventListener('focusin', front);
    card.spectrumMove = move;
    card.spectrumTitle = title;
  });
  let shuffleIndex = 0;
  $('.shuffle-windows').addEventListener('click', () => {
    const poses = [[-12, -10, -8], [12, 20, 7], [0, -5, -2]];
    windows.forEach((card, i) => {
      const pose = poses[(i + shuffleIndex) % poses.length];
      card.spectrumMove(pose[0], pose[1]);
      card.style.setProperty('--angle', `${pose[2]}deg`);
    });
    const active = windows[shuffleIndex % windows.length];
    active.style.zIndex = ++layer;
    notice.textContent = `${active.spectrumTitle} is now the front preview.`;
    shuffleIndex++;
  });
  window.addEventListener('resize', () => windows.forEach(card => card.spectrumMove(0, 0)), {passive:true});

  // One frame per scroll event; nothing loops while the page is idle.
  const asterisk = $('.play-asterisk');
  const playroom = $('.playroom');
  let frame = false;
  const onScroll = () => {
    if (frame || reduced.matches) return;
    frame = true;
    requestAnimationFrame(() => {
      const rect = playroom.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        asterisk.style.setProperty('--spin', `${(innerHeight - rect.top) * .06}deg`);
      }
      frame = false;
    });
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  reduced.addEventListener('change', () => {
    if (reduced.matches) asterisk.style.removeProperty('--spin');
    else onScroll();
  });
  onScroll();

  const fetchJSON = async url => {
    const response = await fetch(url, {cache:'no-store', signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Feed unavailable');
    return response.json();
  };
  const safeURL = value => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  };
  fetchJSON('https://demos.voxelbox.org/portfolio.json').then(data => {
    if (!Array.isArray(data.sites)) return;
    $('[data-stat="sites"]').textContent = String(data.sites.length);
    const sites = data.sites.filter(site => site && !/game/i.test(String(site.kind || '')) && safeURL(site.url))
      .sort((a,b) => String(b.updated || '').localeCompare(String(a.updated || ''))).slice(0,8);
    if (!sites.length) return;
    const rows = sites.map((site, i) => {
      const row = document.createElement('a');
      row.href = safeURL(site.url); row.target = '_blank'; row.rel = 'noopener noreferrer';
      const index = document.createElement('span'); index.textContent = String(i + 1).padStart(2, '0');
      const title = document.createElement('b'); title.textContent = String(site.title || site.slug || 'Live project').split(/\s[–—-]\s/)[0];
      const label = document.createElement('span'); label.textContent = 'Explore ↗';
      row.append(index, title, label); return row;
    });
    $('[data-live-projects]').replaceChildren(...rows);
  }).catch(() => { /* The static project links remain useful when the feed is unavailable. */ });
  fetchJSON('https://status.voxelbox.org/api/public/status').then(data => {
    const up = data?.summary?.up, total = data?.summary?.total;
    if (!Number.isFinite(up) || !Number.isFinite(total) || total <= 0 || up < 0 || up > total) return;
    $('[data-stat-val]').textContent = `${up}/${total}`;
  }).catch(() => { /* Unknown is shown as an em dash, never as an invented healthy count. */ });

  if (!storage.get('vb_cookie_consent')) {
    const bar = document.createElement('aside');
    bar.className = 'cookie-banner';
    bar.setAttribute('aria-label', 'Site storage preferences');
    bar.innerHTML = '<p>We use site storage to remember your preferences. Read our <a href="/privacy">privacy policy</a>.</p><div class="cookie-actions"><button type="button" data-consent="accept">Accept</button><button type="button" data-consent="decline">Decline</button></div>';
    bar.addEventListener('click', e => {
      const button = e.target.closest('[data-consent]');
      if (!button) return;
      storage.set('vb_cookie_consent', button.dataset.consent);
      bar.remove();
    });
    document.body.append(bar);
  }
})();
