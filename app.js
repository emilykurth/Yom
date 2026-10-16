'use strict';

/* =========================================================
   Tastebook — rate the same food across different places.
   Everything is stored on the phone in IndexedDB.
   ========================================================= */

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const fmt = v => (v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1));
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const hue = v => (v == null ? 0 : Math.round(Math.max(0, Math.min(10, v)) * 12)); // 0 red → 120 green
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

const ICON = {
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
};

const FOOD_EMOJI = ['🍓', '🥤', '🧋', '🍕', '🍔', '🌭', '🍟', '🌮', '🌯', '🥙', '🥪', '🍗', '🍖', '🥓', '🍳', '🥞', '🧇', '🥐', '🥯', '🍞', '🥨', '🧀', '🥗', '🍜', '🍝', '🍲', '🍛', '🍣', '🍱', '🍙', '🥟', '🍤', '🥘', '🍩', '🍪', '🧁', '🍰', '🎂', '🥧', '🍫', '🍬', '🍦', '🍨', '🍧', '☕', '🍵', '🧃', '🍺', '🍷', '🍸', '🍹', '🥛', '🍎', '🍌', '🍉', '🍑', '🥭', '🍍', '🫐', '🥑', '🌶️', '🍿', '🥥', '🍋'];
const COLORS = ['#FFD3DA', '#FFE0C2', '#FFF0B3', '#D4F0C6', '#C9E8F5', '#DAD3FA', '#F7D0EC', '#E9DCCD'];
const SUGGESTED = ['Taste', 'Texture', 'Sweetness', 'Price / value', 'Visual appeal', 'Portion size', 'Freshness', 'Temperature', 'Thickness', 'Crust', 'Sauce', 'Service'];
const defaultCounts = name => !/price|value|cost|service/i.test(name);

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
const S = { cats: [], ratings: [], profile: { name: 'My Tastebook' }, photoURLs: new Map(), sort: {} };

async function loadState() {
  S.cats = (await dbAll('categories')).sort((a, b) => a.createdAt - b.createdAt);
  S.ratings = await dbAll('ratings');
  S.profile = (await dbGet('meta', 'profile')) || { name: 'My Tastebook' };
  try { S.sort = JSON.parse(localStorage.getItem('tb-sort') || '{}'); } catch { S.sort = {}; }
}

const catById = id => S.cats.find(c => c.id === id);
const catRatings = id => S.ratings.filter(r => r.categoryId === id);
const ratingOverall = r => mean(r.scores.filter(s => s.counts).map(s => s.value));
const catOverall = id => mean(catRatings(id).map(ratingOverall).filter(v => v != null));

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

/* ---------- little UI bits ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
const badge = v => `<span class="badge ${v == null ? 'none' : ''}" style="--h:${hue(v)}">${fmt(v)}</span>`;
function ring(v) {
  const r = 50, C = 2 * Math.PI * r, p = v == null ? 0 : v / 10;
  return `<div class="ring-wrap ${v == null ? 'none' : ''}" style="--h:${hue(v)}">
    <svg class="ring" viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${r}"/>
    <circle class="ring-fg" cx="60" cy="60" r="${r}" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
    <div class="ring-label"><strong>${fmt(v)}</strong><span>out of 10</span></div></div>`;
}
const checkbox = (checked, label, attrs = '') =>
  `<label class="counts"><input type="checkbox" ${checked ? 'checked' : ''} ${attrs}><span class="box">${ICON.check}</span><span>${label}</span></label>`;

function ratingRow(r, showCat) {
  const c = catById(r.categoryId) || { emoji: '🍽️', name: '' };
  const bits = [showCat ? c.name : '', r.location, niceDate(r.date)].filter(Boolean).map(esc).join(' · ');
  return `<button class="row" data-action="view-rating" data-id="${r.id}">
    <span class="thumb">${r.hasPhoto ? `<img data-photo="${r.id}" alt="">` : esc(c.emoji)}</span>
    <span class="row-main"><span class="row-title">${esc(r.restaurant || 'Unnamed spot')}</span><span class="row-sub">${bits}</span></span>
    ${badge(ratingOverall(r))}
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
  const name = S.profile.name || 'My Tastebook';
  const initial = firstGrapheme(name).toUpperCase() || '★';

  app.innerHTML = `
    <header>
      <div class="profile">
        <button class="avatar" data-action="settings" aria-label="Profile and settings">${esc(initial)}</button>
        <div class="who"><p class="eyebrow">Tastebook</p><h1>${esc(name)}</h1></div>
        <button class="icon-btn" data-action="settings" aria-label="Settings">${ICON.gear}</button>
      </div>
      <div class="stats">
        <div class="stat"><strong>${S.cats.length}</strong><span>Categories</span></div>
        <div class="stat"><strong>${S.ratings.length}</strong><span>Ratings</span></div>
        <div class="stat"><strong>${places}</strong><span>Places</span></div>
      </div>
    </header>

    <section>
      <h2 class="section-title">My foods</h2>
      ${S.cats.length ? '' : `<div class="empty-card"><strong>Start with something you love</strong>Make a category like “Strawberry smoothie”, pick the qualities you care about, then rate every one you try.</div>`}
      <div class="grid">
        ${S.cats.map(c => {
          const n = catRatings(c.id).length, avg = catOverall(c.id);
          return `<a class="tile" href="#/c/${encodeURIComponent(c.id)}">
            <span class="tile-icon" style="--c:${c.color}">${esc(c.emoji)}</span>
            <span class="tile-name">${esc(c.name)}</span>
            <span class="tile-meta">${avg != null ? `★ ${fmt(avg)} · ${n}` : 'No ratings yet'}</span>
          </a>`;
        }).join('')}
        <button class="tile add" data-action="new-cat">
          <span class="tile-icon">${ICON.plus}</span>
          <span class="tile-name">New category</span>
        </button>
      </div>
    </section>

    ${recent.length ? `<section><h2 class="section-title">Recently rated</h2><div class="list">${recent.map(r => ratingRow(r, true)).join('')}</div></section>` : ''}
  `;
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

  const qAvgs = c.qualities.map(q => {
    const vals = rs.map(r => r.scores.find(s => s.qid === q.id)).filter(Boolean).map(s => s.value);
    return { q, avg: mean(vals) };
  });

  let listHTML = '';
  if (!rs.length) {
    listHTML = `<div class="empty-card"><strong>No ratings yet</strong>Tap “Add rating” the next time you try one.</div>`;
  } else if (sort === 'location') {
    const groups = new Map();
    for (const r of rs) {
      const label = (r.location || '').trim();
      const key = label.toLowerCase();
      if (!groups.has(key)) groups.set(key, { label: label || 'No location', items: [] });
      groups.get(key).items.push(r);
    }
    const ordered = [...groups.entries()].sort(([a], [b]) => (!a) - (!b) || a.localeCompare(b));
    listHTML = ordered.map(([, g]) => {
      const gAvg = mean(g.items.map(ratingOverall).filter(v => v != null));
      return `<div class="group-head">${esc(g.label)}<span>${g.items.length} · avg ${fmt(gAvg)}</span></div>
        <div class="list">${g.items.sort(byScore(1)).map(r => ratingRow(r)).join('')}</div>`;
    }).join('');
  } else {
    const sorted = [...rs].sort(sort === 'top' ? byScore(1) : sort === 'low' ? byScore(-1) : byRecent);
    listHTML = `<div class="list">${sorted.map(r => ratingRow(r)).join('')}</div>`;
  }

  app.innerHTML = `
    <div class="nav">
      <a class="icon-btn" href="#" aria-label="Back">${ICON.back}</a>
      <button class="icon-btn" data-action="edit-cat" data-id="${c.id}" aria-label="Edit category">${ICON.edit}</button>
    </div>
    <div class="hero">
      <span class="tile-icon xl" style="--c:${c.color}">${esc(c.emoji)}</span>
      <h1>${esc(c.name)}</h1>
      <div class="hero-score">
        ${ring(avg)}
        <div class="hero-facts">
          <div><b>${rs.length}</b>${rs.length === 1 ? 'rating' : 'ratings'}</div>
          <div><b>${places}</b>${places === 1 ? 'place' : 'places'}</div>
        </div>
      </div>
      ${best && ratingOverall(best) != null ? `<p class="eyebrow">Best so far: ${esc(best.restaurant)} · ${fmt(ratingOverall(best))}</p>` : ''}
    </div>

    ${rs.length ? `<div class="breakdown">${qAvgs.map(({ q, avg }) => `
      <div class="bar-row ${q.counts === false ? 'off' : ''}" style="--h:${hue(avg)}">
        <span class="label">${esc(q.name)}${q.counts === false ? '<small>not in score</small>' : ''}</span>
        <span class="bar"><i style="width:${avg == null ? 0 : avg * 10}%"></i></span>
        <span class="num">${fmt(avg)}</span>
      </div>`).join('')}</div>` : '<div style="height:18px"></div>'}

    ${rs.length > 1 ? `<div class="seg" role="tablist">
      ${[['recent', 'Recent'], ['top', 'Highest'], ['low', 'Lowest'], ['location', 'Location']].map(([k, l]) =>
        `<button role="tab" class="${sort === k ? 'on' : ''}" data-action="sort" data-sort="${k}" data-id="${c.id}">${l}</button>`).join('')}
    </div>` : ''}

    ${listHTML}

    <button class="fab" data-action="new-rating" data-id="${c.id}">${ICON.plus}Add rating</button>
  `;
  hydratePhotos(app);
}

/* =========================================================
   Sheets (full-screen pop-ups)
   ========================================================= */
function openSheet({ title, body, saveLabel, onSave, cancelLabel = 'Cancel', mount }) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-head">
        <button class="link" data-close>${esc(cancelLabel)}</button>
        <h3>${esc(title)}</h3>
        ${onSave ? `<button class="link strong" data-save>${esc(saveLabel || 'Save')}</button>` : '<span></span>'}
      </header>
      <div class="sheet-body">${body}</div>
    </section>`;
  document.body.appendChild(wrap);
  document.body.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));

  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => {
      wrap.remove();
      if (!$('.sheet-wrap')) document.body.classList.remove('locked');
    }, 300);
  };
  $('[data-close]', wrap).onclick = close;
  if (!onSave) $('.backdrop', wrap).onclick = close;
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
function openCategoryEditor(existing) {
  const d = existing ? structuredClone(existing) : {
    id: uid(), name: '', emoji: '🍓', color: COLORS[0], qualities: [], createdAt: Date.now(),
  };

  const body = `
    <div class="cat-preview"><span class="tile-icon xl" id="pv" style="--c:${d.color}">${esc(d.emoji)}</span></div>
    <label class="field"><span>Food type</span>
      <input id="f-name" type="text" placeholder="e.g. Strawberry smoothie" value="${esc(d.name)}" maxlength="40" autocomplete="off"></label>
    <div class="field"><span>Icon</span>
      <div class="emoji-grid" id="emoji-grid">${FOOD_EMOJI.map(e => `<button type="button" class="emoji ${e === d.emoji ? 'on' : ''}" data-emoji="${e}">${e}</button>`).join('')}</div>
      <label class="mini-field">Or type any emoji <input id="f-emoji" type="text" maxlength="12" placeholder="🙂" autocomplete="off"></label>
    </div>
    <div class="field"><span>Colour</span>
      <div class="swatches">${COLORS.map(col => `<button type="button" class="swatch ${col === d.color ? 'on' : ''}" style="--c:${col}" data-color="${col}" aria-label="Colour ${col}"></button>`).join('')}</div>
    </div>
    <div class="field"><span>What you'll rate it on</span>
      <p class="hint">Tick “Counts” for qualities that make up the overall score. Untick ones you just want to remember (like price).</p>
      <ul class="q-list" id="q-list"></ul>
      <div class="q-add"><input id="q-new" class="input" type="text" placeholder="Add a quality…" maxlength="30" autocomplete="off" enterkeyhint="done"><button type="button" class="btn small" id="q-add">Add</button></div>
      <div class="chips" id="q-chips"></div>
    </div>
    ${existing ? `<button type="button" class="btn danger block" id="cat-del">Delete this category</button>` : ''}
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
      await dbPut('categories', d);
      const i = S.cats.findIndex(c => c.id === d.id);
      if (i >= 0) S.cats[i] = d; else S.cats.push(d);
      if (existing) render();
      else location.hash = `#/c/${encodeURIComponent(d.id)}`;
      toast(existing ? 'Saved' : `${d.name} added`);
    },
    mount: (wrap, close) => {
      const pv = $('#pv', wrap);
      const qList = $('#q-list', wrap);
      const chips = $('#q-chips', wrap);

      const drawQualities = () => {
        qList.innerHTML = d.qualities.map(q => `
          <li class="q-row" data-qid="${q.id}">
            <input type="text" value="${esc(q.name)}" maxlength="30" data-qname aria-label="Quality name">
            ${checkbox(q.counts !== false, 'Counts', 'data-qcount')}
            <button type="button" class="q-del" data-qdel aria-label="Remove">${ICON.x}</button>
          </li>`).join('');
        const have = new Set(d.qualities.map(q => q.name.trim().toLowerCase()));
        chips.innerHTML = SUGGESTED.filter(s => !have.has(s.toLowerCase()))
          .map(s => `<button type="button" class="chip" data-chip="${esc(s)}">${esc(s)}</button>`).join('');
      };
      const addQuality = name => {
        name = name.trim();
        if (!name) return;
        if (d.qualities.some(q => q.name.trim().toLowerCase() === name.toLowerCase())) { toast('Already added'); return; }
        d.qualities.push({ id: uid(), name, counts: defaultCounts(name) });
        drawQualities();
      };
      drawQualities();

      // Starter qualities for a brand-new category so it's quick to set up
      if (!existing) {
        ['Taste', 'Texture', 'Price / value', 'Visual appeal'].forEach(addQuality);
      }

      $('#emoji-grid', wrap).addEventListener('click', e => {
        const b = e.target.closest('[data-emoji]');
        if (!b) return;
        d.emoji = b.dataset.emoji;
        pv.textContent = d.emoji;
        $$('.emoji', wrap).forEach(x => x.classList.toggle('on', x === b));
      });
      $('#f-emoji', wrap).addEventListener('input', e => {
        const g = firstGrapheme(e.target.value);
        if (!g) return;
        d.emoji = g;
        pv.textContent = g;
        $$('.emoji', wrap).forEach(x => x.classList.toggle('on', x.dataset.emoji === g));
      });
      $$('.swatch', wrap).forEach(s => s.addEventListener('click', () => {
        d.color = s.dataset.color;
        pv.style.setProperty('--c', d.color);
        $$('.swatch', wrap).forEach(x => x.classList.toggle('on', x === s));
      }));

      qList.addEventListener('input', e => {
        const row = e.target.closest('[data-qid]');
        const q = d.qualities.find(x => x.id === row?.dataset.qid);
        if (!q) return;
        if (e.target.matches('[data-qname]')) q.name = e.target.value;
      });
      qList.addEventListener('change', e => {
        const row = e.target.closest('[data-qid]');
        const q = d.qualities.find(x => x.id === row?.dataset.qid);
        if (q && e.target.matches('[data-qcount]')) q.counts = e.target.checked;
      });
      qList.addEventListener('click', e => {
        const del = e.target.closest('[data-qdel]');
        if (!del) return;
        const id = del.closest('[data-qid]').dataset.qid;
        d.qualities = d.qualities.filter(q => q.id !== id);
        drawQualities();
      });
      chips.addEventListener('click', e => {
        const c = e.target.closest('[data-chip]');
        if (c) addQuality(c.dataset.chip);
      });
      const qNew = $('#q-new', wrap);
      $('#q-add', wrap).onclick = () => { addQuality(qNew.value); qNew.value = ''; qNew.focus(); };
      qNew.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addQuality(qNew.value); qNew.value = ''; }
      });

      const del = $('#cat-del', wrap);
      if (del) del.onclick = async () => {
        const n = catRatings(d.id).length;
        if (!confirm(`Delete “${existing.name}”${n ? ` and its ${n} rating${n === 1 ? '' : 's'}` : ''}? This can't be undone.`)) return;
        for (const r of catRatings(d.id)) {
          await dbDel('ratings', r.id);
          await dbDel('photos', r.id);
          forgetPhotoURL(r.id);
        }
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

/* ---------- photo handling ---------- */
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
    id: uid(), categoryId: cat.id, restaurant: '', location: '', date: todayISO(),
    scores: [], notes: '', hasPhoto: false, createdAt: Date.now(),
  };
  // Line the scores up with the category's current qualities; keep any old ones so nothing is lost.
  const scores = cat.qualities.map(q => {
    const s = d.scores.find(x => x.qid === q.id);
    return s ? { ...s, name: q.name } : { qid: q.id, name: q.name, value: 5, counts: q.counts !== false };
  });
  for (const s of d.scores) if (!cat.qualities.some(q => q.id === s.qid)) scores.push(s);
  d.scores = scores;

  let newPhoto = null;
  let removePhoto = false;
  const uniq = key => [...new Set(S.ratings.map(r => (r[key] || '').trim()).filter(Boolean))].sort();

  const body = `
    <div class="live"><span>Overall<small id="live-note"></small></span><span id="live-badge"></span></div>

    <label class="photo-pick ${d.hasPhoto ? 'has' : ''}" id="photo-pick">
      <img id="photo-img" alt="">
      <span class="photo-empty">${ICON.camera}Add a photo</span>
      <button type="button" class="photo-remove" id="photo-remove">Remove</button>
      <input type="file" accept="image/*" id="photo-input" class="visually-hidden">
    </label>

    <label class="field"><span>Restaurant / shop</span>
      <input id="r-name" type="text" list="dl-rest" placeholder="Where was it from?" value="${esc(d.restaurant)}" autocomplete="off" maxlength="60"></label>
    <label class="field"><span>Location</span>
      <input id="r-loc" type="text" list="dl-loc" placeholder="Suburb, street or city" value="${esc(d.location)}" autocomplete="off" maxlength="60"></label>
    <datalist id="dl-rest">${uniq('restaurant').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-loc">${uniq('location').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    <label class="field"><span>Date</span><input id="r-date" type="date" value="${esc(d.date)}"></label>

    <div class="field"><span>Your scores</span>
      ${d.scores.map((s, i) => `
        <div class="rate ${s.counts ? '' : 'off'}" data-i="${i}" style="--h:${hue(s.value)}">
          <div class="rate-top"><span class="rate-name">${esc(s.name)}</span><span class="rate-val"><span data-val>${fmt(s.value)}</span> <small>/ 10</small></span></div>
          <input type="range" class="slider" min="0" max="10" step="0.5" value="${s.value}" style="--p:${s.value * 10}%" aria-label="${esc(s.name)} score">
          <div class="rate-foot">${checkbox(s.counts, 'Count toward overall', 'data-count')}<span class="scale">0 · · · 10</span></div>
        </div>`).join('')}
    </div>

    <label class="field"><span>Notes</span><textarea id="r-notes" rows="3" placeholder="Anything to remember? e.g. ask for less ice">${esc(d.notes)}</textarea></label>
    ${existing ? `<button type="button" class="btn danger block" id="r-del">Delete this rating</button>` : ''}
  `;

  openSheet({
    title: existing ? 'Edit rating' : `New ${cat.name}`,
    body,
    onSave: async () => {
      d.restaurant = $('#r-name').value.trim();
      d.location = $('#r-loc').value.trim();
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
      const liveBadge = $('#live-badge', wrap), liveNote = $('#live-note', wrap);
      const updateLive = () => {
        const counted = d.scores.filter(s => s.counts).length;
        liveBadge.innerHTML = badge(ratingOverall(d));
        liveNote.textContent = counted === d.scores.length ? `from all ${counted} qualities` : `from ${counted} of ${d.scores.length} qualities`;
      };
      updateLive();

      $$('.rate', wrap).forEach(el => {
        const s = d.scores[+el.dataset.i];
        const slider = $('.slider', el);
        slider.addEventListener('input', () => {
          s.value = +slider.value;
          slider.style.setProperty('--p', `${s.value * 10}%`);
          el.style.setProperty('--h', hue(s.value));
          $('[data-val]', el).textContent = fmt(s.value);
          updateLive();
        });
        $('[data-count]', el).addEventListener('change', e => {
          s.counts = e.target.checked;
          el.classList.toggle('off', !s.counts);
          updateLive();
        });
      });

      // photo
      const pick = $('#photo-pick', wrap), img = $('#photo-img', wrap), input = $('#photo-input', wrap);
      if (d.hasPhoto) photoURL(d.id).then(u => { if (u) img.src = u; });
      input.addEventListener('change', async () => {
        const f = input.files?.[0];
        if (!f) return;
        try {
          newPhoto = await compressImage(f);
          removePhoto = false;
          if (img.src.startsWith('blob:') && !S.photoURLs.has(d.id)) URL.revokeObjectURL(img.src);
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
        await dbDel('ratings', d.id);
        await dbDel('photos', d.id);
        forgetPhotoURL(d.id);
        S.ratings = S.ratings.filter(r => r.id !== d.id);
        close();
        render();
        toast('Rating deleted');
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

  const body = `
    ${r.hasPhoto ? `<img class="detail-photo" data-photo="${r.id}" alt="Photo of the ${esc(c?.name || 'food')}">` : ''}
    <div class="detail-head">
      ${ring(o)}
      <div class="grow"><h2>${esc(r.restaurant)}</h2><p>${meta}</p><p>${esc(c?.emoji || '')} ${esc(c?.name || '')}</p></div>
    </div>
    <div class="breakdown" style="margin:0">
      ${r.scores.map(s => `
        <div class="bar-row ${s.counts ? '' : 'off'}" style="--h:${hue(s.value)}">
          <span class="label">${esc(s.name)}${s.counts ? '' : '<small>not in score</small>'}</span>
          <span class="bar"><i style="width:${s.value * 10}%"></i></span>
          <span class="num">${fmt(s.value)}</span>
        </div>`).join('')}
    </div>
    ${r.notes ? `<div class="notes">${esc(r.notes)}</div>` : ''}
    <div class="actions">
      <button class="btn ghost" id="d-edit">${ICON.edit}Edit</button>
      <button class="btn ghost" id="d-close">Done</button>
    </div>`;

  openSheet({
    title: c?.name || 'Rating',
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
  if (!confirm(`Replace everything on this phone with this backup?\n\n${data.categories.length} categories · ${data.ratings.length} ratings`)) return false;
  for (const s of ['categories', 'ratings', 'photos']) await dbClear(s);
  for (const c of data.categories) await dbPut('categories', c);
  for (const r of data.ratings) await dbPut('ratings', r);
  for (const [id, url] of Object.entries(data.photos || {})) {
    const blob = await (await fetch(url)).blob();
    await dbPut('photos', blob, id);
  }
  if (data.profile) await dbPut('meta', data.profile, 'profile');
  S.photoURLs.forEach(u => URL.revokeObjectURL(u));
  S.photoURLs.clear();
  await loadState();
  return true;
}

function openSettings() {
  const body = `
    <label class="field"><span>Your name</span><input id="s-name" type="text" value="${esc(S.profile.name)}" maxlength="40" autocomplete="off"></label>
    <div class="settings-group">
      <h4>Back up your ratings</h4>
      <p>Everything is saved on this phone only. Save a backup file now and then (to Files or iCloud Drive) so you never lose your ratings — it includes your photos.</p>
      <div class="row-btns">
        <button class="btn" id="s-export">Save backup</button>
        <label class="btn ghost">Restore<input type="file" accept="application/json,.json" id="s-import" class="visually-hidden"></label>
      </div>
    </div>
    <div class="settings-group">
      <h4>How scores work</h4>
      <p style="margin:0">Each rating's overall score is the average of the qualities you ticked “Count toward overall”. A category's score is the average of all its ratings' overall scores.</p>
    </div>`;

  openSheet({
    title: 'Profile',
    body,
    onSave: async () => {
      S.profile = { ...S.profile, name: $('#s-name').value.trim() || 'My Tastebook' };
      await dbPut('meta', S.profile, 'profile');
      render();
    },
    mount: (wrap, close) => {
      $('#s-export', wrap).onclick = () => exportBackup().catch(e => toast(e.message));
      $('#s-import', wrap).addEventListener('change', async e => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        try {
          if (await importBackup(f)) { close(); location.hash = ''; render(); toast('Backup restored'); }
        } catch (err) { toast(err.message); }
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
    case 'new-cat': openCategoryEditor(); break;
    case 'edit-cat': openCategoryEditor(catById(id)); break;
    case 'new-rating': openRatingEditor(catById(id)); break;
    case 'view-rating': openRatingDetail(id); break;
    case 'settings': openSettings(); break;
    case 'sort':
      S.sort[id] = el.dataset.sort;
      try { localStorage.setItem('tb-sort', JSON.stringify(S.sort)); } catch {}
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
    app.innerHTML = `<div class="empty-card"><strong>Couldn't open your data</strong>${esc(e.message)}. If you're in Private Browsing, switch it off and reload.</div>`;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
