'use strict';
/* =====================================================================
   Your People — a church's public page (the one renderer).
   Two shells load this file: /site/ (addressed as ?c=<join code>
   or ?s=<slug>) and the root 404.html, which is how a vanity
   address — yourpeople.church/<slug> — is served on static
   hosting: Pages answers unknown paths with the 404 shell, and
   this script reads the slug from the path's first segment.
   Either way the church-site Edge Function answers with ONLY
   public fields (name, logo, brand, events, announcements,
   sermons, the leader's site choices). No member data is ever in
   the payload. Until that function is deployed, this page says so
   plainly instead of failing.

   Layout (v2, from the Nov 2026 layout research): sticky header,
   hero, visit block, the church's own welcome, announcements,
   upcoming events, recent sermons, give, the app card, a closing
   strip, footer. The template supplies ONLY bare functional
   labels — every sentence on the page is the church's own, from
   its data. Sections with no data hide; the hero with no photo is
   a flat typographic variant, never a stock or generated image;
   there are no gradients anywhere.

   Edit-in-place: a signed-in LEADER of this church (the desk
   session carries over — same origin) gets a discreet edit bar
   and can change the welcome, service times, address, giving link
   and photos right on this page, saving through the same
   read-merge-write of groups.settings the desk tab uses. Anyone
   else's page contains no edit UI at all. All church-written text
   goes through textContent — nothing is ever parsed as HTML.
   ===================================================================== */
const SUPABASE_URL = 'https://wsmqkhljjhaueahqizfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4eoGwVeVNyN7jn-wmJsUkg_nShqdukt';
const PHOTO_PREFIX = SUPABASE_URL + '/storage/v1/object/public/church-site-photos/';

const $ = (id) => document.getElementById(id);
function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function show(id) {
  for (const v of ['view-loading', 'view-state', 'view-site']) {
    $(v).classList.toggle('hidden', v !== id);
  }
}
function state(title, text) {
  $('state-title').textContent = title;
  $('state-text').textContent = text;
  show('view-state');
}
function fmtWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return day + ' · ' + time;
}
function fmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function fmtRange(e) {
  let s = fmtWhen(e.startsAt);
  if (e.endsAt) {
    const a = new Date(e.startsAt), b = new Date(e.endsAt);
    if (!isNaN(a.getTime()) && !isNaN(b.getTime())) {
      s += (a.toDateString() === b.toDateString()) ? ' – ' + fmtTime(e.endsAt) : ' – ' + fmtWhen(e.endsAt);
    }
  }
  return s;
}
function fmtDay(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function firstLine(text) {
  return (text || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
}
/* The town is part of the address the church supplied — read it
   back out of the address's own lines; never guessed. */
function townFromAddress(address) {
  const line = firstLine(address);
  if (!line) return '';
  const parts = line.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return parts[parts.length - 2].replace(/\s+[A-Z]{2}\b.*$/, '').trim();
  }
  if (parts.length === 2) {
    return parts[1]
      .replace(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi, '')
      .replace(/\s+(NS|NB|PE|NL|QC|ON|MB|SK|AB|BC|YT|NT|NU)\b.*$/i, '')
      .trim();
  }
  return '';
}
function directionsUrl(data) {
  const q = (data.name + ' ' + (data.address || '')).trim();
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/* The browser tab carries the church's identity too: its logo
   once the page has loaded, the Your People mark until then and
   for churches with no logo. */
function setFavicon(url) {
  const link = $('favicon');
  if (!link || !url) return;
  link.href = url;
  const ext = ((url.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();
  const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon' };
  if (types[ext]) link.setAttribute('type', types[ext]);
  else link.removeAttribute('type');
}

/* The church's own colours — the same palette the app wears.
   Only plain #rrggbb values are applied (the function narrows
   them too; this is the second gate, not the only one). */
function hexOk(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()); }
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return 'rgb(' + c.join(',') + ')';
}
function applyBrand(brand) {
  if (!brand || typeof brand !== 'object') return;
  const pal = brand.palette;
  if (!pal || typeof pal !== 'object' || !hexOk(pal.brand)) return;
  const root = document.documentElement;
  const set = (k, v) => { if (hexOk(v)) root.style.setProperty(k, v.trim()); };
  set('--green', pal.brand);
  set('--green-deep', pal.deep);
  set('--gold', pal.accent);
  set('--cream', pal.background);
  set('--card', pal.surface);
  set('--ink', pal.text);
  set('--muted', pal.muted);
  if (hexOk(pal.background) && hexOk(pal.text)) {
    root.style.setProperty('--line', mixHex(pal.background, pal.text, 0.16));
  }
  root.dataset.theme = brand.mode === 'dark' ? 'dark' : 'light';
}

/* ---------------- render ---------------- */
function render(data) {
  document.title = data.name + ' — Your People';
  applyBrand(data.brand);
  if (data.logoUrl) setFavicon(data.logoUrl);

  // header
  $('head-name').textContent = data.name;
  if (data.logoUrl) {
    const img = $('head-logo');
    img.src = data.logoUrl;
    img.classList.remove('hidden');
    img.addEventListener('error', () => img.classList.add('hidden'));
  }
  const hg = $('head-give');
  hg.classList.toggle('hidden', !data.givingUrl);
  if (data.givingUrl) hg.href = data.givingUrl;

  // hero — name, town, main service time; one photo if there is
  // one, used once. No photo: the flat typographic variant.
  $('site-name').textContent = data.name;
  const town = townFromAddress(data.address);
  $('hero-town').textContent = town;
  $('hero-town').classList.toggle('hidden', !town);
  const mainTime = firstLine(data.serviceTimes);
  $('hero-time').textContent = mainTime;
  $('hero-time').classList.toggle('hidden', !mainTime);
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const heroImg = $('hero-photo');
  heroImg.classList.toggle('hidden', photos.length === 0);
  if (photos.length > 0) {
    heroImg.src = photos[0];
    heroImg.alt = data.name;
    heroImg.addEventListener('error', () => heroImg.classList.add('hidden'));
  }
  const sermons = Array.isArray(data.sermons) ? data.sermons : [];
  $('hero-sermon').classList.toggle('hidden', sermons.length === 0);

  // visit — never hides: at minimum the name of the gathering
  // place is here, with times / address / directions as supplied.
  $('site-times').textContent = data.serviceTimes || '';
  $('site-address').textContent = data.address || '';
  for (const id of ['directions', 'closing-directions']) {
    const a = $(id);
    a.classList.toggle('hidden', !data.address);
    if (data.address) a.href = directionsUrl(data);
  }

  // welcome — the church's own words, exactly; hides when empty.
  $('site-welcome').textContent = data.welcome || '';
  $('sec-welcome').classList.toggle('hidden', !data.welcome);

  // announcements — newest first, at most three.
  const news = (Array.isArray(data.announcements) ? data.announcements : []).slice(0, 3);
  $('sec-news').classList.toggle('hidden', news.length === 0);
  if (news.length > 0) {
    const box = $('site-news');
    box.replaceChildren();
    for (const a of news) {
      const item = h('div', 'row');
      item.appendChild(h('div', 't', a.title));
      item.appendChild(h('div', 's', fmtDay(a.createdAt)));
      if (a.body) item.appendChild(h('div', 'b', a.body));
      box.appendChild(item);
    }
  }

  // upcoming events — future only, soonest first, at most five.
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const events = (Array.isArray(data.events) ? data.events : [])
    .filter((e) => { const d = new Date(e.startsAt); return !isNaN(d.getTime()) && d >= startToday; })
    .slice(0, 5);
  $('sec-events').classList.toggle('hidden', events.length === 0);
  if (events.length > 0) {
    const box = $('site-events');
    box.replaceChildren();
    for (const e of events) {
      const item = h('div', 'row');
      item.appendChild(h('div', 't', e.title));
      item.appendChild(h('div', 's', fmtRange(e) + (e.location ? ' · ' + e.location : '')));
      if (e.notes) item.appendChild(h('div', 'n', e.notes));
      box.appendChild(item);
    }
  }

  // sermons — the latest featured, up to four more as rows.
  $('sec-sermons').classList.toggle('hidden', sermons.length === 0);
  if (sermons.length > 0) {
    const feat = sermons[0];
    const fbox = $('sermon-featured');
    fbox.replaceChildren();
    const f = h('div', 'row sermon-featured');
    f.appendChild(h('div', 't', feat.title));
    f.appendChild(h('div', 's', [fmtDay(feat.date), feat.passageRef].filter(Boolean).join(' · ')));
    if (feat.videoUrl) {
      const p = h('p'); p.style.margin = '8px 0 0';
      const a = h('a', 'btn small', /youtube|youtu\.be|vimeo/i.test(feat.videoUrl) ? 'Watch' : 'Listen');
      a.href = feat.videoUrl; a.target = '_blank'; a.rel = 'noopener';
      p.appendChild(a); f.appendChild(p);
    }
    fbox.appendChild(f);
    const box = $('site-sermons');
    box.replaceChildren();
    for (const s of sermons.slice(1, 5)) {
      const item = h('div', 'row');
      const t = h('div', 't');
      if (s.videoUrl) {
        const a = h('a', null, s.title);
        a.href = s.videoUrl; a.target = '_blank'; a.rel = 'noopener';
        t.appendChild(a);
      } else {
        t.textContent = s.title;
      }
      item.appendChild(t);
      item.appendChild(h('div', 's', [fmtDay(s.date), s.passageRef].filter(Boolean).join(' · ')));
      box.appendChild(item);
    }
  }

  // give — a link, nothing more; hides without one.
  $('sec-give').classList.toggle('hidden', !data.givingUrl);
  if (data.givingUrl) $('site-give-link').href = data.givingUrl;

  // the app card — a member call, late on the page.
  $('sec-app').classList.toggle('hidden', !data.joinCode);
  if (data.joinCode) $('site-code').textContent = data.joinCode;

  // closing strip — the same facts restated, no new words.
  $('sec-closing').classList.toggle('hidden', !(data.serviceTimes || data.address));
  if (data.serviceTimes || data.address) {
    const bits = [data.name];
    if (mainTime) bits.push(mainTime);
    if (data.address) bits.push(firstLine(data.address));
    $('closing-text').textContent = bits.join(' — ');
  }

  // footer
  $('foot-name').textContent = data.name;
  $('foot-name-2').textContent = data.name;
  const fl = [];
  if (data.address) fl.push(firstLine(data.address));
  if (town) fl.push(town);
  if (mainTime) fl.push(mainTime);
  $('foot-line').textContent = fl.join(' · ') + (fl.length ? ' · ' : '') + '© ' + new Date().getFullYear() + ' ' + data.name;

  show('view-site');
}

/* ---------------- edit-in-place (leaders only) ---------------- */
const PAGE = {
  data: null, client: null, user: null, settings: null,
  photoPaths: [], editing: false,
};
function photoPathsFromUrls(urls) {
  return (Array.isArray(urls) ? urls : [])
    .filter((u) => typeof u === 'string' && u.startsWith(PHOTO_PREFIX))
    .map((u) => u.slice(PHOTO_PREFIX.length));
}
function barView(msg, kind) {
  const bar = $('editbar');
  bar.replaceChildren();
  bar.classList.remove('hidden');
  const who = h('span', 'who', 'You lead this church.');
  bar.appendChild(who);
  const btn = h('button', 'btn small', 'Edit page');
  btn.type = 'button';
  btn.addEventListener('click', enterEdit);
  bar.appendChild(btn);
  if (msg) {
    const m = h('span', 'msg ' + (kind || ''), msg);
    bar.appendChild(m);
  }
}
function barEdit(msg, kind) {
  const bar = $('editbar');
  bar.replaceChildren();
  bar.classList.remove('hidden');
  const save = h('button', 'btn small', 'Save');
  save.type = 'button';
  save.addEventListener('click', saveEdit);
  const cancel = h('button', 'btn small plain', 'Cancel');
  cancel.type = 'button';
  cancel.addEventListener('click', cancelEdit);
  bar.appendChild(save);
  bar.appendChild(cancel);
  const m = h('span', 'msg ' + (kind || ''), msg || 'Editing this page — your changes show when you save.');
  bar.appendChild(m);
}
function barMsg(msg, kind) {
  const bar = $('editbar');
  const old = bar.querySelector('.msg');
  if (old) old.remove();
  const m = h('span', 'msg ' + (kind || ''), msg);
  bar.appendChild(m);
}

async function initEdit(data) {
  PAGE.data = data;
  if (!data.groupId) return;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
  let client;
  try {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) { return; }
  let session = null;
  try {
    const res = await client.auth.getSession();
    session = res && res.data ? res.data.session : null;
  } catch (e) { return; }
  if (!session || !session.user) return;
  PAGE.client = client;
  PAGE.user = session.user;
  try {
    const mem = await client
      .from('memberships')
      .select('group_id, role')
      .eq('user_id', session.user.id)
      .eq('group_id', data.groupId);
    const rows = (mem && mem.data) || [];
    if (!rows.some((r) => r.role === 'leader')) return;
    const grp = await client.from('groups').select('settings').eq('id', data.groupId).maybeSingle();
    PAGE.settings = grp && grp.data && grp.data.settings && typeof grp.data.settings === 'object'
      ? grp.data.settings : {};
    const site = PAGE.settings.site && typeof PAGE.settings.site === 'object' ? PAGE.settings.site : {};
    PAGE.photoPaths = Array.isArray(site.photos)
      ? site.photos.filter((p) => typeof p === 'string')
      : photoPathsFromUrls(data.photos);
  } catch (e) { return; }
  barView();
}

function enterEdit() {
  const data = PAGE.data;
  if (!data) return;
  PAGE.editing = true;
  document.body.classList.add('editing');
  $('ed-welcome').value = data.welcome || '';
  $('ed-times').value = data.serviceTimes || '';
  $('ed-address').value = data.address || '';
  $('ed-giving').value = data.givingUrl || '';
  $('visit-view').classList.add('hidden');
  $('visit-edit').classList.remove('hidden');
  $('sec-welcome').classList.remove('hidden');
  $('site-welcome').classList.add('hidden');
  $('welcome-edit').classList.remove('hidden');
  $('welcome-empty-note').classList.toggle('hidden', !!data.welcome);
  $('sec-give').classList.remove('hidden');
  $('give-edit').classList.remove('hidden');
  if (!data.givingUrl) $('site-give-link').parentElement.classList.add('hidden');
  $('sec-photos-edit').classList.remove('hidden');
  $('hero-photo-btns').classList.toggle('hidden', PAGE.photoPaths.length === 0);
  renderPhotoStrip();
  barEdit();
}

function exitEdit() {
  PAGE.editing = false;
  document.body.classList.remove('editing');
  $('visit-view').classList.remove('hidden');
  $('visit-edit').classList.add('hidden');
  $('site-welcome').classList.remove('hidden');
  $('welcome-edit').classList.add('hidden');
  $('give-edit').classList.add('hidden');
  $('site-give-link').parentElement.classList.remove('hidden');
  $('sec-photos-edit').classList.add('hidden');
  $('hero-photo-btns').classList.add('hidden');
}

function cancelEdit() {
  exitEdit();
  render(PAGE.data);
  barView();
}

async function readFreshSettings() {
  const grp = await PAGE.client.from('groups').select('settings').eq('id', PAGE.data.groupId).maybeSingle();
  if (grp && grp.data && grp.data.settings && typeof grp.data.settings === 'object') {
    return grp.data.settings;
  }
  return PAGE.settings || {};
}

/* The same read-merge-write the desk tab performs: settings.site
   fields replaced, everything else in settings (the slug, other
   keys) preserved, the giving link at settings.tithelyUrl. */
async function writeSettings(siteFields, tithelyUrl) {
  const base = await readFreshSettings();
  const site = { ...(base.site && typeof base.site === 'object' ? base.site : {}), ...siteFields };
  const next = { ...base, site, tithelyUrl };
  const { error } = await PAGE.client.from('groups').update({ settings: next }).eq('id', PAGE.data.groupId);
  if (error) return false;
  PAGE.settings = next;
  return true;
}

async function saveEdit() {
  const giving = $('ed-giving').value.trim();
  if (giving && !/^https:\/\//i.test(giving)) {
    barMsg('The giving link needs to start with https:// — copy the full address of your giving page.', 'err');
    return;
  }
  barMsg('Saving…');
  const fields = {
    welcome: $('ed-welcome').value.trim(),
    serviceTimes: $('ed-times').value.trim(),
    address: $('ed-address').value.trim(),
    photos: [...PAGE.photoPaths],
  };
  const ok = await writeSettings(fields, giving);
  if (!ok) {
    barMsg('Those changes did not save. Check your connection and try again.', 'err');
    return;
  }
  Object.assign(PAGE.data, {
    welcome: fields.welcome,
    serviceTimes: fields.serviceTimes,
    address: fields.address,
    givingUrl: giving,
    photos: PAGE.photoPaths.map((p) => PHOTO_PREFIX + p),
  });
  exitEdit();
  render(PAGE.data);
  barView('Saved — this page shows it now.', 'ok');
}

/* Photos: uploaded and saved as they change (the desk's pattern),
   under this church's own folder in the church-site-photos
   bucket, where the Step 24 rules keep writes leader-only. */
function renderPhotoStrip() {
  const box = $('photo-strip');
  box.replaceChildren();
  PAGE.photoPaths.forEach((path, i) => {
    const fig = h('figure');
    const img = document.createElement('img');
    img.src = PHOTO_PREFIX + path;
    img.alt = '';
    img.addEventListener('error', () => img.classList.add('hidden'));
    fig.appendChild(img);
    const cap = h('figcaption');
    if (i === 0) cap.appendChild(h('span', null, 'Banner'));
    const rm = h('button', null, 'Remove');
    rm.type = 'button';
    rm.addEventListener('click', () => removePhoto(path));
    cap.appendChild(rm);
    fig.appendChild(cap);
    box.appendChild(fig);
  });
  $('hero-photo-btns').classList.toggle('hidden', !(PAGE.editing && PAGE.photoPaths.length > 0));
}
function safeName(name) {
  return (name || 'photo').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60);
}
async function uploadPhoto(file) {
  const path = PAGE.data.groupId + '/' + Date.now() + '-' + safeName(file.name);
  const { error } = await PAGE.client.storage.from('church-site-photos').upload(path, file);
  if (error) return null;
  return path;
}
async function persistPhotos(msg) {
  const site = { ...(PAGE.settings && PAGE.settings.site ? PAGE.settings.site : {}), photos: [...PAGE.photoPaths] };
  const tithely = PAGE.settings && typeof PAGE.settings.tithelyUrl === 'string' ? PAGE.settings.tithelyUrl : '';
  const ok = await writeSettings(site, tithely);
  if (!ok) {
    barMsg('The photo changed but the page list did not save. Check your connection and try again.', 'err');
    return;
  }
  PAGE.data.photos = PAGE.photoPaths.map((p) => PHOTO_PREFIX + p);
  renderPhotoStrip();
  barMsg(msg, 'ok');
}
async function addPhoto() {
  const input = $('photo-add-file');
  const file = input.files && input.files[0];
  if (!file) { barMsg('Choose a photo first.', 'err'); return; }
  barMsg('Adding your photo…');
  const path = await uploadPhoto(file);
  if (!path) { barMsg('That photo did not upload. Check your connection and try again.', 'err'); return; }
  input.value = '';
  PAGE.photoPaths.push(path);
  await persistPhotos('Photo added — saved.');
}
async function removePhoto(path) {
  if (!window.confirm('Remove this photo from your church site?')) return;
  try { await PAGE.client.storage.from('church-site-photos').remove([path]); } catch (e) { /* list first */ }
  PAGE.photoPaths = PAGE.photoPaths.filter((p) => p !== path);
  const hero = $('hero-photo');
  if (PAGE.photoPaths.length === 0) hero.classList.add('hidden');
  else hero.src = PHOTO_PREFIX + PAGE.photoPaths[0];
  await persistPhotos('Photo removed — saved.');
}
async function replaceHeroPhoto() {
  const input = $('photo-replace-file');
  const file = input.files && input.files[0];
  if (!file) { input.click(); return; }
  barMsg('Replacing the banner photo…');
  const path = await uploadPhoto(file);
  if (!path) { barMsg('That photo did not upload. Check your connection and try again.', 'err'); return; }
  const old = PAGE.photoPaths[0];
  PAGE.photoPaths[0] = path;
  input.value = '';
  $('hero-photo').src = PHOTO_PREFIX + path;
  $('hero-photo').classList.remove('hidden');
  await persistPhotos('Banner photo replaced — saved.');
  if (old && old !== path) {
    try { await PAGE.client.storage.from('church-site-photos').remove([old]); } catch (e) { /* best effort */ }
  }
}

/* ---------------- which church, and load ---------------- */
function resolveLookup() {
  const q = new URLSearchParams(window.location.search);
  const code = (q.get('c') || '').trim();
  if (code) return { kind: 'code', query: 'c=' + encodeURIComponent(code) };
  const slugParam = (q.get('s') || '').trim().toLowerCase();
  if (slugParam) return { kind: 'slug', query: 's=' + encodeURIComponent(slugParam) };
  const seg = window.location.pathname.split('/').filter(Boolean)[0] || '';
  let first = seg;
  try { first = decodeURIComponent(seg); } catch (e) { /* keep the raw segment */ }
  first = first.trim().toLowerCase();
  if (first && first !== 'site') return { kind: 'slug', query: 's=' + encodeURIComponent(first) };
  return null;
}

async function load() {
  $('photo-add').addEventListener('click', addPhoto);
  $('photo-remove').addEventListener('click', () => {
    if (PAGE.photoPaths[0]) removePhoto(PAGE.photoPaths[0]);
  });
  $('photo-replace').addEventListener('click', () => $('photo-replace-file').click());
  $('photo-replace-file').addEventListener('change', replaceHeroPhoto);

  const look = resolveLookup();
  if (!look) {
    state('Find your church', 'This page needs a church’s join code — ask your church for its link, or start at yourpeople.church.');
    return;
  }
  let resp;
  try {
    resp = await fetch(SUPABASE_URL + '/functions/v1/church-site?' + look.query, {
      headers: { 'apikey': SUPABASE_ANON_KEY },
    });
  } catch (e) {
    state('Not switched on yet', 'This church’s site isn’t switched on yet — check back soon.');
    return;
  }
  if (resp.status === 404) {
    let body = null;
    try { body = await resp.json(); } catch (e) { /* non-JSON */ }
    if (body && body.error === 'not-found') {
      if (look.kind === 'slug') {
        state('No church site at this address', 'There’s no church site at this address. Check the spelling and try again — or start at yourpeople.church to find your church.');
      } else {
        state('Church not found', 'We couldn’t find a church with that code. Check the code and try again — or ask your church for its link.');
      }
    } else {
      state('Not switched on yet', 'This church’s site isn’t switched on yet — check back soon.');
    }
    return;
  }
  if (!resp.ok) {
    state('Not switched on yet', 'This church’s site isn’t switched on yet — check back soon.');
    return;
  }
  let data = null;
  try { data = await resp.json(); } catch (e) { /* non-JSON */ }
  if (!data || data.ok !== true || !data.name) {
    state('Not switched on yet', 'This church’s site isn’t switched on yet — check back soon.');
    return;
  }
  render(data);
  initEdit(data);
}
load();
