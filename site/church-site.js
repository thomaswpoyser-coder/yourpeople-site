'use strict';
/* =====================================================================
   Your People — a church's public page (the one renderer).
   Two shells load this file: /site/ (addressed as ?c=<join code>
   or ?s=<slug>) and the root 404.html, which is how a vanity
   address — yourpeople.church/<slug> — is served on static
   hosting: Pages answers unknown paths with the 404 shell, and
   this script reads the slug from the path's first segment.
   Either way the church-site Edge Function answers with ONLY
   public fields (name, logo, brand, events, announcements, the
   leader's site choices). No member data is ever in the payload.
   Until that function is deployed, this page says so plainly
   instead of failing. All church-written text goes through
   textContent — nothing is ever parsed as HTML.
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

function render(data) {
  document.title = data.name + ' — Your People';
  applyBrand(data.brand);

  $('site-name').textContent = data.name;
  $('foot-name').textContent = data.name;
  if (data.logoUrl) {
    const img = $('site-logo');
    img.src = data.logoUrl;
    img.classList.remove('hidden');
    img.addEventListener('error', () => {
      img.classList.add('hidden');
      $('site-mark').classList.remove('hidden');
    });
  } else {
    $('site-mark').classList.remove('hidden');
  }
  $('site-address').textContent = data.address || '';

  // Welcome: the leader's words when they've written some; a warm
  // default in the church's name when they haven't — the page is
  // finished either way.
  $('site-welcome').textContent = data.welcome
    ? data.welcome
    : 'Welcome to ' + data.name + '. We’re glad you found us — come as you are, and say hello when you come.';

  // Service times: the leader's own list, or the next gatherings
  // from the calendar when they haven't written one.
  const events = Array.isArray(data.events) ? data.events : [];
  if (data.serviceTimes) {
    $('site-times').textContent = data.serviceTimes;
  } else if (events.length > 0) {
    $('card-times').querySelector('h2').textContent = 'Join us';
    const lines = events.slice(0, 3).map((e) => e.title + ' — ' + fmtRange(e) + (e.location ? ' · ' + e.location : ''));
    $('site-times').textContent = lines.join('\n');
  } else {
    $('card-times').classList.add('hidden');
  }

  if (events.length > 0) {
    $('card-events').classList.remove('hidden');
    const box = $('site-events');
    box.replaceChildren();
    for (const e of events) {
      const item = h('div', 'event');
      item.appendChild(h('div', 't', e.title));
      item.appendChild(h('div', 's', fmtRange(e) + (e.location ? ' · ' + e.location : '')));
      if (e.notes) item.appendChild(h('div', 'n', e.notes));
      box.appendChild(item);
    }
  }

  const news = Array.isArray(data.announcements) ? data.announcements : [];
  if (news.length > 0) {
    $('card-news').classList.remove('hidden');
    const box = $('site-news');
    box.replaceChildren();
    for (const a of news) {
      const item = h('div', 'news');
      item.appendChild(h('div', 't', a.title));
      item.appendChild(h('div', 's', fmtDay(a.createdAt)));
      if (a.body) item.appendChild(h('div', 'b', a.body));
      box.appendChild(item);
    }
  }

  // Photos: the first is the banner; the rest form the strip. With
  // only one photo the strip stays hidden — the banner carries it.
  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (photos.length > 0) {
    const hero = $('site-hero');
    hero.src = photos[0];
    hero.classList.remove('hidden');
    hero.addEventListener('error', () => hero.classList.add('hidden'));
  }
  if (photos.length > 1) {
    $('card-photos').classList.remove('hidden');
    const box = $('site-photos');
    box.replaceChildren();
    for (const url of photos.slice(1)) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.addEventListener('error', () => img.classList.add('hidden'));
      box.appendChild(img);
    }
  }

  if (data.givingUrl) {
    $('card-give').classList.remove('hidden');
    $('site-give-link').href = data.givingUrl;
  }

  $('site-code').textContent = data.joinCode || '';
  show('view-site');
}

/* Which church is being asked for, and how:
   ?c=<join code> — the permanent link, exactly as before.
   ?s=<slug>      — the chosen short address, named outright.
   /<slug>        — the vanity address itself: this shell served
                    as the 404 page, the slug is the path's first
                    segment, any casing the visitor typed.
   Returns null when the URL names no church at all. */
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
}
load();
