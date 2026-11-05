'use strict';
/* =====================================================================
   Your People — a church's full sermon / event / ministry list
   (sub-pages).

   /site/sermons.html, /site/events.html and /site/ministries.html
   are the real rooms behind the homepage's capped sections:
   every published sermon, newest first; every upcoming event,
   soonest first; every ministry the church listed, in the
   leaders' chosen order. They are addressed exactly like the
   homepage — ?c=<join code> or ?s=<slug> — and read from the
   same church-site Edge Function, asking for the full list
   (?sermons=1 / ?events=1; ministries ride in the standard
   payload, already whole at the function's cap of twelve; until
   the function is redeployed with these, it answers with its
   standard capped payload and the page shows what it gets).

   Read-only by design: editing lives on the homepage. Brand,
   favicon and graceful states behave exactly as the homepage's;
   the template supplies only bare functional labels, every
   sermon and event word is the church's own, and there are no
   gradients anywhere.
   ===================================================================== */
const SUPABASE_URL = 'https://wsmqkhljjhaueahqizfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4eoGwVeVNyN7jn-wmJsUkg_nShqdukt';

const $ = (id) => document.getElementById(id);
function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function show(id) {
  for (const v of ['view-loading', 'view-state', 'view-list']) {
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
   Only plain #rrggbb values are applied. */
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

function resolveLookup() {
  const q = new URLSearchParams(window.location.search);
  const code = (q.get('c') || '').trim();
  if (code) return { kind: 'code', query: 'c=' + encodeURIComponent(code), home: '/site/?c=' + encodeURIComponent(code) };
  const slug = (q.get('s') || '').trim().toLowerCase();
  if (slug) return { kind: 'slug', query: 's=' + encodeURIComponent(slug), home: '/' + encodeURIComponent(slug) };
  return null;
}

function renderSermons(data) {
  const sermons = Array.isArray(data.sermons) ? data.sermons : [];
  $('list-empty').classList.toggle('hidden', sermons.length > 0);
  const box = $('list-box');
  box.replaceChildren();
  for (const s of sermons) {
    const item = h('div', 'row');
    item.appendChild(h('div', 't', s.title));
    const meta = h('div', 's');
    const bits = [fmtDay(s.date), s.passageRef].filter(Boolean).join(' · ');
    if (s.videoUrl) {
      meta.appendChild(document.createTextNode(bits ? bits + ' · ' : ''));
      const a = h('a', null, /youtube|youtu\.be|vimeo/i.test(s.videoUrl) ? 'Watch' : 'Listen');
      a.href = s.videoUrl; a.target = '_blank'; a.rel = 'noopener';
      meta.appendChild(a);
    } else {
      meta.textContent = bits;
    }
    item.appendChild(meta);
    box.appendChild(item);
  }
}

/* The ministry card — the twin of the homepage renderer's, so
   a ministry reads the same here as there. */
function ministryCard(m) {
  const card = h('div', 'mincard');
  card.appendChild(h('div', 't', m.name));
  const line = [m.when, m.place].filter(Boolean).join(' · ');
  if (line) card.appendChild(h('div', 's', line));
  if (m.blurb) card.appendChild(h('div', 'b', m.blurb));
  return card;
}

function renderMinistries(data) {
  const ministries = (Array.isArray(data.ministries) ? data.ministries : [])
    .filter((m) => m && typeof m.name === 'string' && m.name.trim());
  $('list-empty').classList.toggle('hidden', ministries.length > 0);
  const box = $('list-box');
  box.replaceChildren();
  for (const m of ministries) box.appendChild(ministryCard(m));
}

function renderEvents(data) {
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const events = (Array.isArray(data.events) ? data.events : [])
    .filter((e) => { const d = new Date(e.startsAt); return !isNaN(d.getTime()) && d >= startToday; })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  $('list-empty').classList.toggle('hidden', events.length > 0);
  const box = $('list-box');
  box.replaceChildren();
  for (const e of events) {
    const item = h('div', 'row');
    item.appendChild(h('div', 't', e.title));
    item.appendChild(h('div', 's', fmtRange(e) + (e.location ? ' · ' + e.location : '')));
    if (e.notes) item.appendChild(h('div', 'n', e.notes));
    box.appendChild(item);
  }
}

async function load() {
  const kind = document.body && document.body.dataset ? document.body.dataset.list : '';
  if (kind !== 'sermons' && kind !== 'events' && kind !== 'ministries') {
    state('Not switched on yet', 'This church’s site isn’t switched on yet — check back soon.');
    return;
  }
  const look = resolveLookup();
  if (!look) {
    state('Find your church', 'This page needs a church’s join code — ask your church for its link, or start at yourpeople.church.');
    return;
  }
  let resp;
  try {
    resp = await fetch(SUPABASE_URL + '/functions/v1/church-site?' + look.query + (kind === 'sermons' ? '&sermons=1' : kind === 'events' ? '&events=1' : ''), {
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

  const label = kind === 'sermons' ? 'Sermons' : kind === 'events' ? 'Events' : 'Ministries';
  document.title = label + ' — ' + data.name;
  applyBrand(data.brand);
  if (data.logoUrl) setFavicon(data.logoUrl);
  $('head-name').textContent = data.name;
  if (data.logoUrl) {
    const img = $('head-logo');
    img.src = data.logoUrl;
    img.classList.remove('hidden');
    img.addEventListener('error', () => img.classList.add('hidden'));
  }
  $('home-link').href = look.home;
  $('back-link').href = look.home;
  const hg = $('head-give');
  hg.classList.toggle('hidden', !data.givingUrl);
  if (data.givingUrl) hg.href = data.givingUrl;
  $('foot-name').textContent = data.name;
  $('foot-name-2').textContent = data.name;

  if (kind === 'sermons') renderSermons(data);
  else if (kind === 'events') renderEvents(data);
  else renderMinistries(data);
  show('view-list');
}
load();
