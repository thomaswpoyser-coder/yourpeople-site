'use strict';
/* =====================================================================
   Your People — a church's full event / ministry list
   (sub-pages).

   /site/events.html and /site/ministries.html are the real
   rooms behind the homepage's capped sections: every upcoming
   event, soonest first; every ministry the church listed, in
   the leaders' chosen order. They are addressed exactly like
   the homepage — ?c=<join code> or ?s=<slug> — and read from
   the same church-site Edge Function, asking for the full list
   (?events=1; ministries ride in the standard payload, already
   whole at the function's cap of twelve; until the function
   is redeployed with these, it answers with its standard
   capped payload and the page shows what it gets).

   There is deliberately no sermons sub-page: the founder
   ruled (Nov 13, 2026) that the public site shows only a
   church's latest sermon, on its homepage — never a list.

   Read-only by design: editing lives on the homepage. Brand,
   favicon and graceful states behave exactly as the homepage's;
   the template supplies only bare functional labels, every
   event and ministry word is the church's own, and there are
   no gradients anywhere.

   The footer carries the same quiet social row as the
   homepage (Nov 10, 2026): the church's own links from the
   payload's `socials`, shaped at the function door and
   re-checked here, shown only when the church set them.
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

/* The church's own social links — the homepage renderer's
   helpers, twin for twin (same services, same marks, same
   http(s)-only check), so a church's footer reads the same on
   every one of its pages. The marks are this template's own
   fixed strings; a URL rides in an href only after the check. */
const SOCIAL_SERVICES = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['youtube', 'YouTube'],
  ['x', 'X'],
];
const SOCIAL_SVGS = {
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.55" cy="6.45" r="0.6" fill="currentColor" stroke="none"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H4.68l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
};
function cleanSocials(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key] of SOCIAL_SERVICES) {
    const v = typeof raw[key] === 'string' ? raw[key].trim().slice(0, 500) : '';
    if (/^https?:\/\//i.test(v)) out[key] = v;
  }
  return out;
}
function renderSocials(data) {
  const box = $('foot-socials');
  if (!box) return;
  const socials = cleanSocials(data.socials);
  box.replaceChildren();
  for (const [key, label] of SOCIAL_SERVICES) {
    const url = socials[key];
    if (!url) continue;
    const a = h('a', 'soc');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', data.name + ' on ' + label);
    a.innerHTML = SOCIAL_SVGS[key];
    a.appendChild(h('span', null, label));
    box.appendChild(a);
  }
  box.classList.toggle('hidden', box.children.length === 0);
}

function resolveLookup() {
  const q = new URLSearchParams(window.location.search);
  const code = (q.get('c') || '').trim();
  if (code) return { kind: 'code', query: 'c=' + encodeURIComponent(code), home: '/site/?c=' + encodeURIComponent(code) };
  const slug = (q.get('s') || '').trim().toLowerCase();
  if (slug) return { kind: 'slug', query: 's=' + encodeURIComponent(slug), home: '/' + encodeURIComponent(slug) };
  return null;
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
  if (kind !== 'events' && kind !== 'ministries') {
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
    resp = await fetch(SUPABASE_URL + '/functions/v1/church-site?' + look.query + (kind === 'events' ? '&events=1' : ''), {
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

  const label = kind === 'events' ? 'Events' : 'Ministries';
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
  const headGiveUrl = data.givingUrl || data.canadaHelpsUrl;
  hg.classList.toggle('hidden', !headGiveUrl);
  if (headGiveUrl) hg.href = headGiveUrl;
  $('foot-name').textContent = data.name;
  $('foot-name-2').textContent = data.name;
  renderSocials(data);

  if (kind === 'events') renderEvents(data);
  else renderMinistries(data);
  show('view-list');
}
load();
