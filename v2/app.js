'use strict';

/* =========================================================
   Tastebook v2 — same features and data as v1, new look.
   Shares the 'tastebook' IndexedDB database with v1, so both
   versions show the same ratings on the same site.
   ========================================================= */

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const fmt = v => (v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1));
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const niceDate = iso => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const firstGrapheme = s => {
  s = (s || '').trim();
  if (!s) return '';
  if (window.Intl && Intl.Segmenter) { for (const { segment } of new Intl.Segmenter().segment(s)) return segment; }
  return [...s][0];
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const UI = {
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v18M3 12h18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
};

const TINTS = ['#E9A68C', '#E8C27D', '#A8CBA2', '#9DC4D3', '#B9AEE0', '#E3A7C0', '#D9C3A5', '#EDE6DE'];
// earlier colour choices (v1 pastels / grey) map onto the new muted palette
const OLD_TINTS = { '#FFD3DA': 0, '#FFE0C2': 0, '#FFF0B3': 1, '#D4F0C6': 2, '#C9E8F5': 3, '#DAD3FA': 4, '#F7D0EC': 5, '#E9DCCD': 6,
  '#F5C6CE': 5, '#F6D9B8': 0, '#F1E6A8': 1, '#C9E6BD': 2, '#BFDDEE': 3, '#D2CAF3': 4, '#EEC6E2': 5 };
const SUGGESTED = ['Taste', 'Flavor', 'Texture', 'Sweetness', 'Price / value', 'Visual appeal', 'Portion size', 'Freshness', 'Temperature', 'Thickness', 'Crust', 'Sauce', 'Service'];
const defaultCounts = name => !/price|value|cost|service/i.test(name);

/* Category icon: v2 uses drawn icons; falls back to the v1 emoji (shown in grey). */
function iconKey(c) {
  if (c?.icon && FOOD_ICONS[c.icon]) return c.icon;
  return EMOJI_TO_ICON[c?.emoji] || null;
}
function iconHTML(c) {
  const k = iconKey(c);
  if (k) return `<span class="icon"><svg viewBox="0 0 64 64">${FOOD_ICONS[k].svg}</svg></span>`;
  return `<span class="icon emoji">${esc(c?.emoji || '🍽️')}</span>`;
}
function tintOf(c) {
  if (!c) return TINTS[0];
  if (TINTS.includes(c.color)) return c.color;
  if (c.color in OLD_TINTS) return TINTS[OLD_TINTS[c.color]];
  const i = Math.max(0, S.cats.findIndex(x => x.id === c.id));
  return TINTS[i % (TINTS.length - 1)];
}
const tintStyle = c => `style="--tint:${tintOf(c)}"`;

/* ---------- storage (IndexedDB) ---------- */
let db;
function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('tastebook', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('categories', { keyPath: 'id' });
      d.createObjectStore('ratings', { keyPath: 'id' });
      d.createObjectStore('photos');
      d.createObjectStore('meta');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
const store = (name, mode = 'readonly') => db.transaction(name, mode).objectStore(name);
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbAll = s => req(store(s).getAll());
const dbGet = (s, k) => req(store(s).get(k));
const dbPut = (s, v, k) => req(store(s, 'readwrite').put(v, k));
const dbDel = (s, k) => req(store(s, 'readwrite').delete(k));
const dbClear = s => req(store(s, 'readwrite').clear());

/* ---------- state ---------- */
const S = { cats: [], ratings: [], profile: { name: '' }, photoURLs: new Map(), sort: {} };

async function loadState() {
  S.cats = (await dbAll('categories')).sort((a, b) => a.createdAt - b.createdAt);
  S.ratings = await dbAll('ratings');
  S.profile = (await dbGet('meta', 'profile')) || { name: '' };
  try { S.sort = JSON.parse(localStorage.getItem('tb2-sort') || '{}'); } catch { S.sort = {}; }
}

const catById = id => S.cats.find(c => c.id === id);
const catRatings = id => S.ratings.filter(r => r.categoryId === id);
const ratingOverall = r => mean(r.scores.filter(s => s.counts).map(s => s.value));
const catOverall = id => mean(catRatings(id).map(ratingOverall).filter(v => v != null));
const greetName = () => {
  const n = (S.profile.name || '').trim();
  return !n || n === 'My Tastebook' ? 'there' : n.split(/\s+/)[0];
};

async function photoURL(id) {
  if (S.photoURLs.has(id)) return S.photoURLs.get(id);
  const blob = await dbGet('photos', id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  S.photoURLs.set(id, url);
  return url;
}
function forgetPhotoURL(id) {
  const u = S.photoURLs.get(id);
  if (u) { URL.revokeObjectURL(u); S.photoURLs.delete(id); }
}
async function hydratePhotos(root) {
  for (const img of $$('img[data-photo]', root)) {
    const u = await photoURL(img.dataset.photo);
    if (u) img.src = u;
  }
}

/* ---------- UI bits ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
function stars(v) {
  const pct = v == null ? 0 : Math.max(0, Math.min(100, v * 10));
  const row = UI.star.repeat(5);
  return `<div class="stars" aria-label="${v == null ? 'No ratings yet' : `${fmt(v / 2)} out of 5 stars`}">
    <div class="row base">${row}</div><div class="fill" style="width:${pct}%"><div class="row">${row}</div></div></div>`;
}
function dots(v) {
  let h = '';
  for (let i = 1; i <= 10; i++) {
    const cls = v == null ? '' : v >= i ? 'on' : v >= i - 0.5 ? 'half' : '';
    h += `<i class="${cls}"></i>`;
  }
  return `<div class="dots" aria-hidden="true">${h}</div>`;
}
const checkbox = (checked, attrs = '', label = '') =>
  `<label class="sq" aria-label="Count toward overall"><input type="checkbox" ${checked ? 'checked' : ''} ${attrs}>${label ? `<span>${label}</span>` : ''}<span class="box"></span></label>`;

function ratingCard(r, showCat) {
  const c = catById(r.categoryId);
  const o = ratingOverall(r);
  const sub = [showCat ? c?.name : '', r.item, r.location, niceDate(r.date)].filter(Boolean).map(esc).join(' · ');
  return `<button class="rcard" data-action="view-rating" data-id="${r.id}">
    ${r.hasPhoto ? `<img class="thumb" data-photo="${r.id}" alt="">` : ''}
    <div class="rc-main">
      <div class="rc-title">${esc(r.restaurant || 'Unnamed spot')}</div>
      <div class="rc-sub">${sub}</div>
      ${dots(o)}
    </div>
    <div class="rc-score ${o == null ? 'none' : ''}">${fmt(o)}</div>
  </button>`;
}

/* ---------- sorting ---------- */
const byRecent = (a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt;
function byScore(dir) {
  return (a, b) => {
    const x = ratingOverall(a), y = ratingOverall(b);
    if (x == null && y == null) return byRecent(a, b);
    if (x == null) return 1;
    if (y == null) return -1;
    return (y - x) * dir || byRecent(a, b);
  };
}

/* =========================================================
   Screens
   ========================================================= */
const app = $('#app');

function render() {
  const m = location.hash.match(/^#\/c\/(.+)$/);
  if (m) renderCategory(decodeURIComponent(m[1]));
  else renderHome();
}

function renderHome() {
  const places = new Set(S.ratings.map(r => (r.restaurant || '').trim().toLowerCase()).filter(Boolean)).size;
  const recent = [...S.ratings].sort(byRecent).slice(0, 5);

  app.innerHTML = `
    <div class="top-tools"><button class="round-btn" data-action="settings" aria-label="Profile and settings">${UI.gear}</button></div>
    <header class="greet">
      <p class="hello">Hello ${esc(greetName())}</p>
      <p class="sub">Feeling hungry?</p>
    </header>
    <button class="avatar-big" data-action="settings" aria-label="Your profile">${AVATAR_SVG}</button>
    <p class="stat-line">${plural(S.cats.length, 'food')} · ${plural(S.ratings.length, 'rating')} · ${plural(places, 'place')}</p>

    <h2 class="prompt">What would you like to rate today?</h2>
    <form class="add-bar" id="add-bar" autocomplete="off">
      <input id="add-name" type="text" placeholder="Add a new category..." maxlength="40" enterkeyhint="go">
      <button type="submit" aria-label="Add category">${UI.plus}</button>
    </form>

    <div class="grid2">
      ${S.cats.map(c => {
        const avg = catOverall(c.id);
        return `<a class="tile" href="#/c/${encodeURIComponent(c.id)}" ${tintStyle(c)} aria-label="${esc(c.name)}">
          ${avg != null ? `<span class="tile-score">${fmt(avg)}</span>` : ''}
          ${iconHTML(c)}
          <span class="tile-label">${esc(c.name)}</span>
        </a>`;
      }).join('')}
    </div>
    ${S.cats.length ? '' : `<p class="empty"><b>Nothing here yet</b>Type a food above — like “Strawberry smoothie” — and tap +.</p>`}

    ${recent.length ? `<p class="section-cap">Recently rated</p><div class="list">${recent.map(r => ratingCard(r, true)).join('')}</div>` : ''}
  `;

  $('#add-bar').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#add-name').value.trim();
    $('#add-name').blur();
    openCategoryEditor(null, v);
  });
  hydratePhotos(app);
}

function renderCategory(id) {
  const c = catById(id);
  if (!c) { location.hash = ''; return; }
  const rs = catRatings(id);
  const avg = catOverall(id);
  const sort = S.sort[id] || 'recent';
  const places = new Set(rs.map(r => (r.restaurant || '').trim().toLowerCase()).filter(Boolean)).size;
  const best = [...rs].sort(byScore(1))[0];
  const qAvgs = c.qualities.map(q => ({
    q, avg: mean(rs.map(r => r.scores.find(s => s.qid === q.id)).filter(Boolean).map(s => s.value)),
  }));

  let listHTML;
  if (!rs.length) {
    listHTML = `<p class="empty"><b>No ratings yet</b>Tap “New rating” the next time you try one.</p>`;
  } else if (sort === 'location') {
    const groups = new Map();
    for (const r of rs) {
      const label = (r.location || '').trim();
      const key = label.toLowerCase();
      if (!groups.has(key)) groups.set(key, { label: label || 'No location', items: [] });
      groups.get(key).items.push(r);
    }
    listHTML = [...groups.entries()].sort(([a], [b]) => (!a) - (!b) || a.localeCompare(b)).map(([, g]) => {
      const gAvg = mean(g.items.map(ratingOverall).filter(v => v != null));
      return `<div class="group-head">${esc(g.label)}<span>${g.items.length} · avg ${fmt(gAvg)}</span></div>
        <div class="list">${g.items.sort(byScore(1)).map(r => ratingCard(r)).join('')}</div>`;
    }).join('');
  } else {
    const sorted = [...rs].sort(sort === 'top' ? byScore(1) : sort === 'low' ? byScore(-1) : byRecent);
    listHTML = `<div class="list">${sorted.map(r => ratingCard(r)).join('')}</div>`;
  }

  app.innerHTML = `
    <div class="nav">
      <a class="round-btn" href="#" aria-label="Back">${UI.back}</a>
      <button class="round-btn" data-action="edit-cat" data-id="${c.id}" aria-label="Edit category">${UI.edit}</button>
    </div>
    <div class="big-circle" ${tintStyle(c)}>${iconHTML(c)}</div>
    <h1 class="cat-title">${esc(c.name)}</h1>
    <p class="avg-line">Average rating: <b>${fmt(avg)}</b>${avg != null ? ' / 10' : ''}</p>
    ${stars(avg)}
    <p class="meta-line">${plural(rs.length, 'rating')} · ${plural(places, 'place')}${best && ratingOverall(best) != null ? ` · Best: ${esc(best.restaurant)}` : ''}</p>

    <button class="new-card" data-action="new-rating" data-id="${c.id}">
      <span class="caps">New rating</span>
      <span class="plus-circle">${UI.plus}</span>
    </button>

    ${rs.length ? `<div class="panel" style="margin-top:14px">
      <p class="panel-cap">Average by quality</p>
      ${qAvgs.map(({ q, avg }) => `
        <div class="bar-row ${q.counts === false ? 'off' : ''}">
          <span class="label">${esc(q.name)}${q.counts === false ? '<small>not in score</small>' : ''}</span>
          <span class="bar"><i style="width:${avg == null ? 0 : avg * 10}%"></i></span>
          <span class="num">${fmt(avg)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${rs.length > 1 ? `<div class="sort" role="tablist">
      <span class="pill label">Sort by</span>
      ${[['recent', 'Recent'], ['top', 'Favorites'], ['low', 'Lowest'], ['location', 'Location']].map(([k, l]) =>
        `<button role="tab" class="pill ${sort === k ? 'on' : ''}" data-action="sort" data-sort="${k}" data-id="${c.id}">${l}</button>`).join('')}
    </div>` : '<div style="height:16px"></div>'}

    ${listHTML}
  `;
  hydratePhotos(app);
}

/* =========================================================
   Sheets
   ========================================================= */
function openSheet({ title, mid, body, saveLabel, onSave, cancelLabel = 'Cancel', mount }) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-head">
        <button class="link" data-close>${esc(cancelLabel)}</button>
        <div class="mid">${mid || ''}</div>
        ${onSave ? `<button class="link strong" data-save>${esc(saveLabel || 'Save')}</button>` : '<span></span>'}
      </header>
      <div class="sheet-body"><div class="sheet-panel"><p class="sheet-title">${esc(title)}</p>${body}</div></div>
    </section>`;
  document.body.appendChild(wrap);
  document.body.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));

  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => {
      wrap.remove();
      if (!$('.sheet-wrap')) document.body.classList.remove('locked');
    }, 320);
  };
  $('[data-close]', wrap).onclick = close;
  if (onSave) {
    const btn = $('[data-save]', wrap);
    btn.onclick = async () => {
      btn.disabled = true;
      try { if ((await onSave()) !== false) close(); }
      catch (e) { console.error(e); toast('Something went wrong saving'); }
      finally { btn.disabled = false; }
    };
  }
  mount?.(wrap, close);
  return { wrap, close };
}

/* ---------- category editor ---------- */
function openCategoryEditor(existing, prefillName = '') {
  const d = existing ? structuredClone(existing) : {
    id: uid(), name: prefillName, emoji: '🍽️', icon: 'plate', color: TINTS[S.cats.length % (TINTS.length - 1)], qualities: [], createdAt: Date.now(),
  };
  if (existing && !d.icon) d.icon = iconKey(d) || '';
  if (existing) d.color = tintOf(existing);
  if (!existing && prefillName) {
    // guess an icon from the name
    const n = prefillName.toLowerCase();
    const guess = [['smoothie', 'smoothie'], ['juice', 'smoothie'], ['shake', 'smoothie'], ['bubble', 'bubbletea'], ['boba', 'bubbletea'],
      ['coffee', 'coffee'], ['latte', 'coffee'], ['cinnamon', 'roll'], ['scroll', 'roll'], ['donut', 'donut'], ['doughnut', 'donut'],
      ['cookie', 'cookie'], ['cake', 'cake'], ['cupcake', 'cupcake'], ['ice cream', 'icecream'], ['gelato', 'icecream'], ['pie', 'pie'],
      ['tart', 'pie'], ['taco', 'taco'], ['burrito', 'taco'], ['fries', 'fries'], ['chips', 'fries'], ['hot dog', 'hotdog'],
      ['sandwich', 'sandwich'], ['toastie', 'sandwich'], ['ramen', 'noodles'], ['noodle', 'noodles'], ['pho', 'noodles'], ['pasta', 'noodles'],
      ['sushi', 'sushi'], ['chicken', 'chicken'], ['wing', 'chicken'], ['egg', 'egg'], ['breakfast', 'egg'], ['croissant', 'bread'],
      ['bread', 'bread'], ['bagel', 'bread'], ['cheese', 'cheese'], ['strawberr', 'strawberry'], ['cocktail', 'cocktail'], ['margarita', 'cocktail'],
      ['salad', 'bowl'], ['bowl', 'bowl'], ['burger', 'burger'], ['pizza', 'pizza']];
    const hit = guess.find(([w]) => n.includes(w));
    if (hit) { d.icon = hit[1]; d.emoji = FOOD_ICONS[hit[1]].emoji; }
  }

  const body = `
    <div class="preview" id="pv" ${tintStyle(d)}>${iconHTML(d)}</div>
    <input id="f-name" type="text" placeholder="Name of food, e.g. Hamburgers..." value="${esc(d.name)}" maxlength="40" autocomplete="off">

    <p class="field-cap">Icon</p>
    <div class="icon-grid" id="icon-grid" style="--tint:${d.color}">${Object.entries(FOOD_ICONS).map(([k, v]) =>
      `<button type="button" class="icon-opt ${k === d.icon ? 'on' : ''}" data-icon="${k}" aria-label="${esc(v.label)}"><svg class="icon" viewBox="0 0 64 64">${v.svg}</svg></button>`).join('')}</div>
    <div class="emoji-row">Or use any emoji instead <input id="f-emoji" type="text" maxlength="12" placeholder="🙂" autocomplete="off"></div>

    <p class="field-cap">Icon colour</p>
    <div class="swatches">${TINTS.map(col => `<button type="button" class="swatch ${col === d.color ? 'on' : ''}" style="--c:${col}" data-color="${col}" aria-label="Colour"></button>`).join('')}</div>

    <p class="field-cap">Qualities you'll rate <small>■ = counts in score</small></p>
    <p class="hint">Untick the box for things you just want to remember, like price.</p>
    <ul class="q-list" id="q-list"></ul>
    <div class="q-add"><input id="q-new" class="inp" type="text" placeholder="Add a quality..." maxlength="30" autocomplete="off" enterkeyhint="done"><button type="button" class="btn" id="q-add">Add</button></div>
    <div class="chips" id="q-chips"></div>
    ${existing ? `<button type="button" class="btn danger" id="cat-del">Delete this category</button>` : ''}
  `;

  openSheet({
    title: existing ? 'Edit category' : 'New category',
    body,
    saveLabel: existing ? 'Save' : 'Create',
    onSave: async () => {
      d.name = $('#f-name').value.trim();
      d.qualities = d.qualities.map(q => ({ ...q, name: q.name.trim() })).filter(q => q.name);
      if (!d.name) { toast('Give it a name first'); $('#f-name').focus(); return false; }
      if (!d.qualities.length) { toast('Add at least one quality to rate'); return false; }
      if (d.icon && FOOD_ICONS[d.icon]) d.emoji = FOOD_ICONS[d.icon].emoji; // keeps v1 showing a sensible icon
      await dbPut('categories', d);
      const i = S.cats.findIndex(c => c.id === d.id);
      if (i >= 0) S.cats[i] = d; else S.cats.push(d);
      if (existing) render();
      else location.hash = `#/c/${encodeURIComponent(d.id)}`;
      toast(existing ? 'Saved' : `${d.name} added`);
    },
    mount: (wrap, close) => {
      const pv = $('#pv', wrap), qList = $('#q-list', wrap), chips = $('#q-chips', wrap);
      const drawPreview = () => { pv.innerHTML = iconHTML(d); pv.style.setProperty('--tint', d.color); $('#icon-grid', wrap).style.setProperty('--tint', d.color); };

      const drawQualities = () => {
        qList.innerHTML = d.qualities.map(q => `
          <li class="q-row" data-qid="${q.id}">
            <input type="text" value="${esc(q.name)}" maxlength="30" data-qname aria-label="Quality name">
            ${checkbox(q.counts !== false, 'data-qcount', 'Counts')}
            <button type="button" class="q-del" data-qdel aria-label="Remove">${UI.x}</button>
          </li>`).join('');
        const have = new Set(d.qualities.map(q => q.name.trim().toLowerCase()));
        chips.innerHTML = SUGGESTED.filter(s => !have.has(s.toLowerCase()))
          .map(s => `<button type="button" class="pill" data-chip="${esc(s)}">+ ${esc(s)}</button>`).join('');
      };
      const addQuality = name => {
        name = name.trim();
        if (!name) return;
        if (d.qualities.some(q => q.name.trim().toLowerCase() === name.toLowerCase())) { toast('Already added'); return; }
        d.qualities.push({ id: uid(), name, counts: defaultCounts(name) });
        drawQualities();
      };
      drawQualities();
      if (!existing) ['Flavor', 'Texture', 'Value (price)', 'Visual appeal'].forEach(addQuality);

      $('#icon-grid', wrap).addEventListener('click', e => {
        const b = e.target.closest('[data-icon]');
        if (!b) return;
        d.icon = b.dataset.icon;
        d.emoji = FOOD_ICONS[d.icon].emoji;
        $$('.icon-opt', wrap).forEach(x => x.classList.toggle('on', x === b));
        drawPreview();
      });
      $('#f-emoji', wrap).addEventListener('input', e => {
        const g = firstGrapheme(e.target.value);
        if (!g) return;
        d.emoji = g;
        d.icon = EMOJI_TO_ICON[g] || '';
        $$('.icon-opt', wrap).forEach(x => x.classList.toggle('on', x.dataset.icon === d.icon));
        drawPreview();
      });
      $$('.swatch', wrap).forEach(s => s.addEventListener('click', () => {
        d.color = s.dataset.color;
        $$('.swatch', wrap).forEach(x => x.classList.toggle('on', x === s));
        drawPreview();
      }));

      qList.addEventListener('input', e => {
        const q = d.qualities.find(x => x.id === e.target.closest('[data-qid]')?.dataset.qid);
        if (q && e.target.matches('[data-qname]')) q.name = e.target.value;
      });
      qList.addEventListener('change', e => {
        const q = d.qualities.find(x => x.id === e.target.closest('[data-qid]')?.dataset.qid);
        if (q && e.target.matches('[data-qcount]')) q.counts = e.target.checked;
      });
      qList.addEventListener('click', e => {
        const del = e.target.closest('[data-qdel]');
        if (!del) return;
        const id = del.closest('[data-qid]').dataset.qid;
        d.qualities = d.qualities.filter(q => q.id !== id);
        drawQualities();
      });
      chips.addEventListener('click', e => { const c = e.target.closest('[data-chip]'); if (c) addQuality(c.dataset.chip); });
      const qNew = $('#q-new', wrap);
      $('#q-add', wrap).onclick = () => { addQuality(qNew.value); qNew.value = ''; qNew.focus(); };
      qNew.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addQuality(qNew.value); qNew.value = ''; } });

      const del = $('#cat-del', wrap);
      if (del) del.onclick = async () => {
        const n = catRatings(d.id).length;
        if (!confirm(`Delete “${existing.name}”${n ? ` and its ${plural(n, 'rating')}` : ''}? This can't be undone.`)) return;
        for (const r of catRatings(d.id)) { await dbDel('ratings', r.id); await dbDel('photos', r.id); forgetPhotoURL(r.id); }
        await dbDel('categories', d.id);
        S.ratings = S.ratings.filter(r => r.categoryId !== d.id);
        S.cats = S.cats.filter(c => c.id !== d.id);
        close();
        location.hash = '';
        render();
        toast('Category deleted');
      };
    },
  });
}

/* ---------- photos ---------- */
function compressImage(file, max = 1400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not read photo'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read photo')); };
    img.src = url;
  });
}

/* ---------- rating editor ---------- */
function openRatingEditor(cat, existing) {
  const d = existing ? structuredClone(existing) : {
    id: uid(), categoryId: cat.id, restaurant: '', location: '', item: '', date: todayISO(),
    scores: [], notes: '', hasPhoto: false, createdAt: Date.now(),
  };
  const scores = cat.qualities.map(q => {
    const s = d.scores.find(x => x.qid === q.id);
    return s ? { ...s, name: q.name } : { qid: q.id, name: q.name, value: 5, counts: q.counts !== false };
  });
  for (const s of d.scores) if (!cat.qualities.some(q => q.id === s.qid)) scores.push(s);
  d.scores = scores;

  let newPhoto = null, removePhoto = false;
  const uniq = key => [...new Set(S.ratings.map(r => (r[key] || '').trim()).filter(Boolean))].sort();

  const body = `
    <div class="stack">
      <input id="r-name" type="text" list="dl-rest" placeholder="Restaurant Name..." value="${esc(d.restaurant)}" autocomplete="off" maxlength="60">
      <input id="r-loc" type="text" list="dl-loc" placeholder="Location..." value="${esc(d.location)}" autocomplete="off" maxlength="60">
      <input id="r-item" type="text" list="dl-item" placeholder="Menu item name..." value="${esc(d.item || '')}" autocomplete="off" maxlength="60">
      <label class="date-row">Date<input id="r-date" type="date" value="${esc(d.date)}"></label>
    </div>
    <datalist id="dl-rest">${uniq('restaurant').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-loc">${uniq('location').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-item">${uniq('item').map(v => `<option value="${esc(v)}">`).join('')}</datalist>

    <label class="photo-pick ${d.hasPhoto ? 'has' : ''}" id="photo-pick">
      <img id="photo-img" alt="">
      <span class="photo-empty"><span class="caps">Add photo</span><span class="plus-circle">${UI.plus}</span></span>
      <button type="button" class="photo-remove" id="photo-remove">Remove</button>
      <input type="file" accept="image/*" id="photo-input" class="visually-hidden">
    </label>

    <p class="how">How was it?</p>
    <p class="hint">Ticked boxes count toward the overall score.</p>
    ${d.scores.map((s, i) => `
      <div class="rate ${s.counts ? '' : 'off'}" data-i="${i}">
        <div class="rate-top">
          <span class="rate-name">${esc(s.name)}<span class="val"><span data-val>${fmt(s.value)}</span>/10</span></span>
          ${checkbox(s.counts, 'data-count')}
        </div>
        <div class="rate-box"><input type="range" class="slider" min="0" max="10" step="0.5" value="${s.value}" style="--p:${s.value * 10}%" aria-label="${esc(s.name)} score"></div>
      </div>`).join('')}

    <p class="field-cap">Notes</p>
    <textarea id="r-notes" rows="3" placeholder="Anything to remember?">${esc(d.notes)}</textarea>
    ${existing ? `<button type="button" class="btn danger" id="r-del">Delete this rating</button>` : ''}
  `;

  openSheet({
    title: existing ? `Edit ${cat.name} rating` : `New ${cat.name} rating`,
    mid: `<div class="live"><strong id="live-val">–</strong><span id="live-note">overall</span></div>`,
    body,
    onSave: async () => {
      d.restaurant = $('#r-name').value.trim();
      d.location = $('#r-loc').value.trim();
      d.item = $('#r-item').value.trim();
      d.date = $('#r-date').value || todayISO();
      d.notes = $('#r-notes').value.trim();
      if (!d.restaurant) { toast('Add the restaurant name'); $('#r-name').focus(); return false; }
      if (newPhoto) { await dbPut('photos', newPhoto, d.id); d.hasPhoto = true; forgetPhotoURL(d.id); }
      else if (removePhoto) { await dbDel('photos', d.id); d.hasPhoto = false; forgetPhotoURL(d.id); }
      await dbPut('ratings', d);
      const i = S.ratings.findIndex(r => r.id === d.id);
      if (i >= 0) S.ratings[i] = d; else S.ratings.push(d);
      render();
      const o = ratingOverall(d);
      toast(o != null ? `Saved · ${fmt(o)}/10` : 'Saved');
    },
    mount: (wrap, close) => {
      const liveVal = $('#live-val', wrap), liveNote = $('#live-note', wrap);
      const updateLive = () => {
        const counted = d.scores.filter(s => s.counts).length;
        liveVal.textContent = fmt(ratingOverall(d));
        liveNote.textContent = counted === d.scores.length ? 'overall' : `overall · ${counted} of ${d.scores.length}`;
      };
      updateLive();

      $$('.rate', wrap).forEach(el => {
        const s = d.scores[+el.dataset.i];
        const slider = $('.slider', el);
        slider.addEventListener('input', () => {
          s.value = +slider.value;
          slider.style.setProperty('--p', `${s.value * 10}%`);
          $('[data-val]', el).textContent = fmt(s.value);
          updateLive();
        });
        $('[data-count]', el).addEventListener('change', e => {
          s.counts = e.target.checked;
          el.classList.toggle('off', !s.counts);
          updateLive();
        });
      });

      const pick = $('#photo-pick', wrap), img = $('#photo-img', wrap), input = $('#photo-input', wrap);
      if (d.hasPhoto) photoURL(d.id).then(u => { if (u) img.src = u; });
      input.addEventListener('change', async () => {
        const f = input.files?.[0];
        if (!f) return;
        try {
          newPhoto = await compressImage(f);
          removePhoto = false;
          img.src = URL.createObjectURL(newPhoto);
          pick.classList.add('has');
        } catch (e) { toast(e.message); }
        input.value = '';
      });
      $('#photo-remove', wrap).addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        newPhoto = null; removePhoto = true;
        img.removeAttribute('src');
        pick.classList.remove('has');
      });

      const del = $('#r-del', wrap);
      if (del) del.onclick = async () => {
        if (!confirm(`Delete this rating from ${existing.restaurant || 'this place'}?`)) return;
        await dbDel('ratings', d.id); await dbDel('photos', d.id); forgetPhotoURL(d.id);
        S.ratings = S.ratings.filter(r => r.id !== d.id);
        close(); render(); toast('Rating deleted');
      };
    },
  });
}

/* ---------- rating detail ---------- */
function openRatingDetail(id) {
  const r = S.ratings.find(x => x.id === id);
  if (!r) return;
  const c = catById(r.categoryId);
  const o = ratingOverall(r);
  const meta = [r.location, niceDate(r.date)].filter(Boolean).map(esc).join(' · ');

  const body = `<div class="detail-panel">
    ${r.hasPhoto ? `<img class="detail-photo" data-photo="${r.id}" alt="Photo">` : ''}
    <div class="detail-top">
      <div><h2>${esc(r.restaurant)}</h2>${r.item ? `<p>${esc(r.item)}</p>` : ''}<p>${meta}</p></div>
      <div class="rc-score ${o == null ? 'none' : ''}">${fmt(o)}</div>
    </div>
    ${dots(o)}
    ${r.scores.map(s => `
      <div class="bar-row ${s.counts ? '' : 'off'}">
        <span class="label">${esc(s.name)}${s.counts ? '' : '<small>not in score</small>'}</span>
        <span class="bar"><i style="width:${s.value * 10}%"></i></span>
        <span class="num">${fmt(s.value)}</span>
      </div>`).join('')}
    ${r.notes ? `<div class="notes">${esc(r.notes)}</div>` : ''}
    <div class="actions">
      <button class="btn ghost" id="d-edit">${UI.edit}Edit</button>
      <button class="btn" id="d-close">Done</button>
    </div></div>`;

  openSheet({
    title: c ? `${c.name} rating` : 'Rating',
    body,
    cancelLabel: 'Close',
    mount: (wrap, close) => {
      hydratePhotos(wrap);
      $('#d-close', wrap).onclick = close;
      $('#d-edit', wrap).onclick = () => { close(); if (c) setTimeout(() => openRatingEditor(c, r), 150); };
    },
  });
}

/* ---------- settings & backup ---------- */
function blobToDataURL(blob) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
}
async function exportBackup() {
  const photos = {};
  for (const r of S.ratings) {
    if (!r.hasPhoto) continue;
    const b = await dbGet('photos', r.id);
    if (b) photos[r.id] = await blobToDataURL(b);
  }
  const data = { app: 'tastebook', version: 1, exportedAt: new Date().toISOString(), profile: S.profile, categories: S.cats, ratings: S.ratings, photos };
  const file = new File([JSON.stringify(data)], `tastebook-backup-${todayISO()}.json`, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Tastebook backup' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error("That file isn't a Tastebook backup"); }
  if (data?.app !== 'tastebook' || !Array.isArray(data.categories) || !Array.isArray(data.ratings)) throw new Error("That file isn't a Tastebook backup");
  if (!confirm(`Replace everything on this phone with this backup?\n\n${plural(data.categories.length, 'category').replace('categorys', 'categories')} · ${plural(data.ratings.length, 'rating')}`)) return false;
  for (const s of ['categories', 'ratings', 'photos']) await dbClear(s);
  for (const c of data.categories) await dbPut('categories', c);
  for (const r of data.ratings) await dbPut('ratings', r);
  for (const [id, url] of Object.entries(data.photos || {})) await dbPut('photos', await (await fetch(url)).blob(), id);
  if (data.profile) await dbPut('meta', data.profile, 'profile');
  S.photoURLs.forEach(u => URL.revokeObjectURL(u));
  S.photoURLs.clear();
  await loadState();
  return true;
}

function openSettings() {
  const body = `<div class="settings">
    <input id="s-name" type="text" placeholder="Your name..." value="${esc(S.profile.name === 'My Tastebook' ? '' : S.profile.name)}" maxlength="40" autocomplete="off">
    <p class="field-cap">Backup</p>
    <p>Everything is saved on this phone only. Save a backup now and then (to Files or iCloud Drive) — it includes your photos.</p>
    <div class="actions">
      <button class="btn" id="s-export">Save backup</button>
      <label class="btn ghost">Restore<input type="file" accept="application/json,.json" id="s-import" class="visually-hidden"></label>
    </div>
    <p class="field-cap">How scores work</p>
    <p>A rating's overall score is the average of the qualities you ticked. A food's average is the average of all its ratings. Stars show the same average out of 5.</p>
  </div>`;

  openSheet({
    title: 'Profile',
    body,
    onSave: async () => {
      S.profile = { ...S.profile, name: $('#s-name').value.trim() };
      await dbPut('meta', S.profile, 'profile');
      render();
    },
    mount: (wrap, close) => {
      $('#s-export', wrap).onclick = () => exportBackup().catch(e => toast(e.message));
      $('#s-import', wrap).addEventListener('change', async e => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        try { if (await importBackup(f)) { close(); location.hash = ''; render(); toast('Backup restored'); } }
        catch (err) { toast(err.message); }
      });
    },
  });
}

/* =========================================================
   Wiring
   ========================================================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  switch (action) {
    case 'edit-cat': openCategoryEditor(catById(id)); break;
    case 'new-rating': openRatingEditor(catById(id)); break;
    case 'view-rating': openRatingDetail(id); break;
    case 'settings': openSettings(); break;
    case 'sort':
      S.sort[id] = el.dataset.sort;
      try { localStorage.setItem('tb2-sort', JSON.stringify(S.sort)); } catch {}
      renderCategory(id);
      break;
  }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

(async function start() {
  try {
    db = await openDB();
    await loadState();
    render();
    navigator.storage?.persist?.().catch(() => {});
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="empty"><b>Couldn't open your data</b>${esc(e.message)}. If you're in Private Browsing, switch it off and reload.</p>`;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
