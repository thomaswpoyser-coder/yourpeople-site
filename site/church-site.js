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
   ministries, upcoming events, the latest sermon, give, the app
   card, a closing strip, footer. The template supplies ONLY bare
   functional labels — every sentence on the page is the church's
   own, from its data. Sections with no data hide; the hero with
   no photo is a flat typographic variant, never a stock or
   generated image; there are no gradients anywhere.

   v4 adds ministries: the church's own list of the groups and
   gatherings it runs (settings.site.ministries, served trimmed
   and capped by the function) — name, when it meets, where, and
   one short sentence, all in the leader's own words. Standing
   invitations, so they sit after the announcements and before
   the dated events. Four cards on the homepage; the full list
   lives on /site/ministries.html. The header's Ministries link
   exists only when the church has listed at least one, and
   leaders edit the cards in place like everything else here.

   v3 (the approved richer treatment + real sub-pages): serif
   display type, letterspaced small-cap section labels, the
   church's logo large in the hero as a gold-ringed medallion and
   faint behind the words as a watermark, the welcome as a
   pull-quote, the visit block as a display-type card — craft
   from the church's own identity only. The header's second row
   links only to what exists for this church (its Visit link is
   gone as of v5.1 — see below): Announcements scrolls to its
   section; Sermons scrolls to its section too, which shows
   the latest sermon only (v8, below — there is no public
   sermon list or sermons page); Events goes to a real
   sub-page (/site/events.html, rendered by list-page.js from
   the same function — the full list, no cap) that carries
   this church's address (?c= or ?s=) with it. If the church has linked its youth group
   (settings.site.linkedYouthCode, served as linkedYouthCode),
   the footer quietly links to that group's page on Your Youth.

   v5 (the de-listed pass): the page below the header is rooms,
   not a list. The hero is a full-bleed band — the deep brand
   tone wall to wall, the church's name in display type directly
   on it; a saved photo (the first, as always) becomes the
   backdrop under a FLAT scrim of the deep tone, never a
   gradient. Sections alternate the page background with the
   surface tone in full-width bands, headings come in two voices
   (the small-cap label with its hairline survives on a minority;
   the rest take a serif display heading), and on wide screens
   two pairs share a row — Visit beside the Welcome, Give beside
   the app card — with a lone section taking the whole row (the
   .solo mark below). The Visit heading follows the block's own
   contents: "Service times" only when times are actually set,
   never as a label over a bare address.

   v5.1 (Thomas's review of the live v5 page): three controls
   pointed at one tiny scroll — the header's Visit link, the
   hero's "Plan your visit" button and the Visit block itself —
   so the nav loses its Visit link, and the hero button earns
   its name: with an address saved it opens directions to the
   church (the same directions URL as the Visit block's own
   button); with no address it hides, there being nothing to
   plan with. In the two-up pairs the shorter column now
   centres vertically, its slack split above and below rather
   than pooled at the bottom; and a short welcome (under 140
   characters) is set larger, a one-line welcome given the
   presence of a display quote — the words still exactly the
   church's own, nothing added.

   v5.2 (the shared hero rule — the same fix the youth page
   took): a hero never repeats the section below it, and no
   hero button anchors to the immediately following section.
   The v5.1 "Plan your visit" button is therefore gone: real
   as its action was, it duplicated the Visit card's own Get
   directions one screen below it. The hero now carries only
   the church's name, its mark, the service-times first line
   and the photo backdrop — and no address text at all, not
   even the town the hero used to lift out of the address.
   The address and the directions action live exactly once,
   in the Visit card — so the closing strip and the footer
   line, which each used to restate the address's first line
   (the footer under the town as well, the strip under a
   second Get directions button), now carry the name and the
   main service time alone.

   v7 (leaders listing, Nov 10, 2026): after the sermons, a
   "who you'll meet" section — the leaders the church chose to
   list (settings.site.leaders, served trimmed and capped by
   the function as `leaders`, with the section's heading as
   `leadersTitle`): a name, a title, one short line in the
   person's own words, and an optional photo. Leader-curated
   only — nothing is read from membership or the directory —
   and the section hides entirely when the list is empty.

   v6 (findability + socials, Nov 10, 2026): the footer gains
   the church's own social links (the payload's `socials`,
   shaped at the function door and re-checked here) — a quiet
   row of the links the church actually set, nothing when it
   set none. And each claimed address now also exists as a
   real static page, generated from this same payload by
   tools/generate-static-pages.mjs: its pre-rendered floor
   (the church's name, times and address in plain HTML, with
   its own title and structured data) is what search engines
   and slow connections meet first, and this renderer takes
   over from it exactly as it does from the shells.

   v8 (latest sermon only, Nov 13, 2026): the founder ruled
   the public page shows ONE sermon — the latest published —
   as the featured card, and nothing else: the sermon rows,
   the "All sermons" link and the sermons sub-page
   are gone, the section is headed "Latest sermon", and the
   header's Sermons link scrolls to the section. The function
   now sends only the latest sermon through this door;
   signed-in members keep the full list in the app.

   Edit-in-place: a signed-in LEADER of this church (the desk
   session carries over — same origin) gets a discreet edit bar
   and can change the welcome, service times, address, giving link
   and photos right on this page, saving through the same
   read-merge-write of groups.settings the desk tab uses. Anyone
   else's page contains no edit UI at all. All church-written text
   goes through textContent — nothing is ever parsed as HTML.

   Session pickup mirrors the desk exactly: same client config,
   so the same storage key (sb-<project ref>-auth-token) on the
   same origin. The session is acquired three ways — getSession,
   then the auth-state event, then an explicit refresh — because
   a one-shot getSession on a cold client can miss a stored
   session whose access token has expired. Every gate in that
   path logs its reason to the console ([yourpeople edit] …):
   a silent no-bar once cost a whole debugging round. A leader
   can also flip to "View as visitor" (?view=visitor) to see the
   page exactly as the public does, with only a slim return
   strip added; the mode never signs anyone out and is ignored
   entirely for non-leaders.
   ===================================================================== */
const SUPABASE_URL = 'https://wsmqkhljjhaueahqizfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4eoGwVeVNyN7jn-wmJsUkg_nShqdukt';
const PHOTO_PREFIX = SUPABASE_URL + '/storage/v1/object/public/church-site-photos/';
/* Photo bounds (v5): the page carries at most SITE_PHOTO_MAX
   photos, and uploads are shrunk on the leader's own device
   before they travel — longest side at most SITE_PHOTO_MAX_EDGE
   px, re-encoded as JPEG. The desk's site tab holds the same
   two bounds. Neither changes where photos sit on the page. */
const SITE_PHOTO_MAX = 4;
const SITE_PHOTO_MAX_EDGE = 1024;
const SITE_PHOTO_CAP_MSG = 'Your page shows up to ' + SITE_PHOTO_MAX + ' photos — remove one to add another.';

const $ = (id) => document.getElementById(id);
function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function show(id) {
  // Any finished view — the page itself or a graceful state —
  // settles the shell's self-healing watchdog.
  if (window.__ypSettled) window.__ypSettled();
  // A generated static page (tools/generate-static-pages.mjs)
  // carries a plain-HTML floor of the church's own facts for
  // search engines and slow connections; the live page now
  // showing replaces it, so it steps aside. The shells carry
  // no floor — this is a no-op there.
  const floor = $('static-floor');
  if (floor) floor.remove();
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
function directionsUrl(data) {
  const q = (data.name + ' ' + (data.address || '')).trim();
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/* Ministries are leader-written and arrive sanitized from the
   function; this is the render-side twin of that shaping (the
   same caps, nameless entries dropped) so an older deployed
   function can never push an oversized card onto the page, and
   the edit form and the save share one cleaning rule. */
function cleanMinistries(list) {
  return (Array.isArray(list) ? list : [])
    .map((m) => ({
      name: String((m && m.name) || '').trim().slice(0, 80),
      when: String((m && m.when) || '').trim().slice(0, 80),
      place: String((m && m.place) || '').trim().slice(0, 120),
      blurb: String((m && m.blurb) || '').trim().slice(0, 240),
    }))
    .filter((m) => m.name)
    .slice(0, 12);
}
function ministryCard(m) {
  const card = h('div', 'mincard');
  card.appendChild(h('div', 't', m.name));
  const line = [m.when, m.place].filter(Boolean).join(' · ');
  if (line) card.appendChild(h('div', 's', line));
  if (m.blurb) card.appendChild(h('div', 'b', m.blurb));
  return card;
}

/* Leaders are leader-curated and arrive sanitized from the
   function; this is the render-side twin of that shaping (the
   same caps, entries with no name or no title dropped, a photo
   kept only when it is one of this platform's own site-photo
   URLs), so an older deployed function can never push an
   oversized card — or a stranger's image address — onto the
   page. No contact details exist in this shape at all. */
const LEADER_PHOTO_MARK = '/storage/v1/object/public/church-site-photos/';
function cleanLeaders(list) {
  return (Array.isArray(list) ? list : [])
    .map((e) => {
      const photo = String((e && e.photo) || '').trim().slice(0, 600);
      return {
        name: String((e && e.name) || '').trim().slice(0, 80),
        title: String((e && e.title) || '').trim().slice(0, 80),
        line: String((e && e.line) || '').trim().slice(0, 240),
        photo: photo.startsWith('https://') && photo.includes(LEADER_PHOTO_MARK) ? photo : '',
      };
    })
    .filter((e) => e.name && e.title)
    .slice(0, 12);
}
function leaderCard(e) {
  const card = h('div', 'leadcard');
  if (e.photo) {
    const img = document.createElement('img');
    img.src = e.photo;
    img.alt = e.name;
    img.addEventListener('error', () => img.remove());
    card.appendChild(img);
  }
  const body = h('div', 'lbody');
  body.appendChild(h('div', 't', e.name));
  body.appendChild(h('div', 's', e.title));
  if (e.line) body.appendChild(h('div', 'b', e.line));
  card.appendChild(body);
  return card;
}

/* The church's own social links, in the footer's fixed order.
   The marks are this template's own fixed strings — no
   church-written content is ever parsed as HTML; a URL rides
   in an href only after the check in cleanSocials below. */
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
/* Socials arrive shaped by the function; this is the
   render-side twin of that shaping (the same http(s)-only
   rule), so an older deployed function — or a hand-edited
   settings row behind a newer one — can never push a
   non-address into the footer. */
function cleanSocials(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key] of SOCIAL_SERVICES) {
    const v = typeof raw[key] === 'string' ? raw[key].trim().slice(0, 500) : '';
    if (/^https?:\/\//i.test(v)) out[key] = v;
  }
  return out;
}
/* The footer's quiet social row: only the links the church
   actually set, each a small mark with its service's name
   beside it and in its accessible label. Nothing set — the
   row is not on the page at all. */
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
  const headGiveUrl = data.givingUrl || data.canadaHelpsUrl;
  hg.classList.toggle('hidden', !headGiveUrl);
  if (headGiveUrl) hg.href = headGiveUrl;

  // the hero carries the same mark large: a gold-ringed
  // medallion, and the logo again faint behind the words as a
  // watermark — unless a photo leads, when the watermark steps
  // aside (decided with the hero below). No logo — no medallion
  // and no watermark; the typographic band stands alone.
  const medal = $('hero-medallion'), medalImg = $('hero-medallion-img'), wm = $('hero-watermark');
  for (const el of [medal, medalImg]) el.classList.toggle('hidden', !data.logoUrl);
  if (data.logoUrl) {
    medalImg.src = data.logoUrl;
    wm.src = data.logoUrl;
    medalImg.addEventListener('error', () => { medal.classList.add('hidden'); medalImg.classList.add('hidden'); });
    wm.addEventListener('error', () => wm.classList.add('hidden'));
  }

  // where this church's sub-pages live: the same address this
  // page was found by (join code or chosen slug) travels along.
  const look = resolveLookup();
  const pageUrl = (page) => '/site/' + page + (look ? '?' + look.query : '');

  // hero — name and the main service time's first line; one
  // photo if there is one, used once. No photo: the flat
  // typographic variant. The address is NOT repeated here —
  // not the street, not even its town: it lives once, in the
  // Visit card directly below, with the directions button
  // (the shared hero rule, v5.2 — see the header note).
  $('site-name').textContent = data.name;
  const mainTime = firstLine(data.serviceTimes);
  $('hero-time').textContent = mainTime;
  $('hero-time').classList.toggle('hidden', !mainTime);
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const hero = $('hero'), heroBg = $('hero-bg'), heroImg = $('hero-photo');
  hero.classList.toggle('has-photo', photos.length > 0);
  heroBg.classList.toggle('hidden', photos.length === 0);
  wm.classList.toggle('hidden', !data.logoUrl || photos.length > 0);
  if (photos.length > 0) {
    heroImg.src = photos[0];
    heroImg.alt = data.name;
    heroImg.addEventListener('error', () => {
      heroBg.classList.add('hidden');
      hero.classList.remove('has-photo');
      wm.classList.toggle('hidden', !data.logoUrl);
    });
  }
  const sermons = Array.isArray(data.sermons) ? data.sermons : [];
  $('hero-sermon').classList.toggle('hidden', sermons.length === 0);

  // visit — never hides: at minimum the name of the gathering
  // place is here, with times / address / directions as supplied.
  // The heading follows the contents (v5): "Service times" only
  // when the church has actually set times — a bare address
  // under that label misleads, so it heads as "Find us" instead.
  const hasTimes = !!(data.serviceTimes && String(data.serviceTimes).trim());
  $('visit-heading').textContent = hasTimes ? 'Service times' : 'Find us';
  $('site-times').textContent = data.serviceTimes || '';
  $('site-address').textContent = data.address || '';
  const dirBtn = $('directions');
  dirBtn.classList.toggle('hidden', !data.address);
  if (data.address) dirBtn.href = directionsUrl(data);

  // welcome — the church's own words, exactly; hides when empty.
  $('site-welcome').textContent = data.welcome || '';
  $('sec-welcome').classList.toggle('hidden', !data.welcome);
  // a short welcome is set larger (v5.1): under 140 characters
  // the pull-quote takes the display size, so a one-line
  // welcome fills its half of the pair instead of huddling at
  // its top. Longer welcomes keep the usual measure.
  const welcomeLen = (data.welcome || '').trim().length;
  $('site-welcome').classList.toggle('welcome-lg', welcomeLen > 0 && welcomeLen < 140);

  // announcements — newest first, at most three.
  const news = (Array.isArray(data.announcements) ? data.announcements : []).slice(0, 3);
  $('sec-news').classList.toggle('hidden', news.length === 0);
  $('nav-news').classList.toggle('hidden', news.length === 0);
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

  // ministries — the church's own list, in the leaders' words.
  // Four cards here; when the list runs longer, its full page
  // takes the rest. The section and its header link exist only
  // when the church has listed at least one ministry.
  const ministries = cleanMinistries(data.ministries);
  $('sec-ministries').classList.toggle('hidden', ministries.length === 0);
  $('nav-ministries').classList.toggle('hidden', ministries.length === 0);
  if (ministries.length > 0) {
    const box = $('site-ministries');
    box.replaceChildren();
    for (const m of ministries.slice(0, 4)) box.appendChild(ministryCard(m));
    const overflow = ministries.length > 4;
    $('ministries-all-wrap').classList.toggle('hidden', !overflow);
    if (overflow) $('ministries-all').href = pageUrl('ministries.html');
  }

  // upcoming events — future only, soonest first, at most five.
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const events = (Array.isArray(data.events) ? data.events : [])
    .filter((e) => { const d = new Date(e.startsAt); return !isNaN(d.getTime()) && d >= startToday; })
    .slice(0, 5);
  $('sec-events').classList.toggle('hidden', events.length === 0);
  $('nav-events').classList.toggle('hidden', events.length === 0);
  if (events.length > 0) {
    $('nav-events').href = pageUrl('events.html');
    $('events-all').href = pageUrl('events.html');
  }
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

  // sermons — the latest one only (founder ruling, Nov 13,
  // 2026): the public page shows the church's most recent
  // published sermon as a single featured card; there is no
  // public sermon list. Signed-in members keep the full list
  // in the app.
  $('sec-sermons').classList.toggle('hidden', sermons.length === 0);
  $('nav-sermons').classList.toggle('hidden', sermons.length === 0);
  if (sermons.length > 0) {
    $('nav-sermons').href = '#sec-sermons';
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
  }

  // leaders — who a visitor will meet: the church's own curated
  // list, after the sermons and before the invitation. The
  // heading is the church's own words when it set one; the
  // template's plain default otherwise. Empty list — the
  // section is not on the page at all.
  const leaders = cleanLeaders(data.leaders);
  $('sec-leaders').classList.toggle('hidden', leaders.length === 0);
  if (leaders.length > 0) {
    const title = typeof data.leadersTitle === 'string' ? data.leadersTitle.trim().slice(0, 60) : '';
    $('leaders-heading').textContent = title || 'Our pastors';
    const box = $('site-leaders');
    box.replaceChildren();
    for (const e of leaders) box.appendChild(leaderCard(e));
  }

  // give — a link, nothing more; hides without one. Two links
  // (Tithely + CanadaHelps, Nov 6, 2026) show two buttons; a
  // CanadaHelps link stored in the legacy single field arrives
  // as both payload keys pointing at the same URL and still
  // shows the one button it always did.
  const chUrl =
    data.canadaHelpsUrl && data.canadaHelpsUrl !== data.givingUrl ? data.canadaHelpsUrl : '';
  $('sec-give').classList.toggle('hidden', !(data.givingUrl || chUrl));
  $('site-give-link').classList.toggle('hidden', !data.givingUrl);
  if (data.givingUrl) $('site-give-link').href = data.givingUrl;
  const chBtn = $('site-give-canadahelps');
  chBtn.classList.toggle('hidden', !chUrl);
  if (chUrl) chBtn.href = chUrl;

  // the app card — a member call, late on the page.
  $('sec-app').classList.toggle('hidden', !data.joinCode);
  if (data.joinCode) $('site-code').textContent = data.joinCode;

  // the two-up pairs (v5): on wide screens each pair shares a
  // row; a pair with only one section showing is marked .solo
  // so that section takes the whole row instead of a half.
  $('pair-visit').classList.toggle('solo', !data.welcome);
  const giveShown = !!(data.givingUrl || chUrl);
  $('pair-give').classList.toggle('solo', giveShown !== !!data.joinCode);

  // closing strip — the name and the main time restated, no
  // new words. The address used to ride along here; as of
  // v5.2 it lives exactly once on the page (the Visit card),
  // so the strip closes on the time alone.
  $('sec-closing').classList.toggle('hidden', !mainTime);
  if (mainTime) {
    $('closing-text').textContent = [data.name, mainTime].join(' — ');
  }

  // footer
  $('foot-name').textContent = data.name;
  $('foot-name-2').textContent = data.name;
  // a linked youth group gets one quiet line — the church chose
  // the code in its desk; the youth page itself is Your Youth's.
  const youthCode = typeof data.linkedYouthCode === 'string' ? data.linkedYouthCode.trim() : '';
  $('youth-link-wrap').classList.toggle('hidden', !youthCode);
  if (youthCode) {
    $('youth-link').href = 'https://youryouth.org/site/?c=' + encodeURIComponent(youthCode);
  }
  // the footer line used to restate the address's first line
  // and its town; as of v5.2 the address lives once (the
  // Visit card), so the line carries the main time alone.
  const fl = [];
  if (mainTime) fl.push(mainTime);
  $('foot-line').textContent = fl.join(' · ') + (fl.length ? ' · ' : '') + '© ' + new Date().getFullYear() + ' ' + data.name;
  // the church's own social links — only the ones it set.
  renderSocials(data);

  // the header's link row steps aside entirely when a church
  // has none of the sections it links to (v5.1: the row's
  // always-present Visit link is gone, so a bare church would
  // otherwise wear an empty strip under the header).
  const anyNav = [news.length, ministries.length, events.length, sermons.length].some((n) => n > 0);
  $('hnav').classList.toggle('hidden', !anyNav);

  show('view-site');
}

/* ---------------- edit-in-place (leaders only) ---------------- */
const PAGE = {
  data: null, client: null, user: null, settings: null,
  photoPaths: [], ministries: [], editing: false, visitor: false,
};
/* Every gate in the edit-bar path logs why it did or didn't
   open — visible in the browser console, invisible on the page. */
function elog() {
  try {
    console.warn.apply(console, ['[yourpeople edit]'].concat([].slice.call(arguments)));
  } catch (e) { /* logging never breaks the page */ }
}
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
  const vb = h('button', 'btn small plain', 'View as visitor');
  vb.type = 'button';
  vb.addEventListener('click', () => { setVisitorParam(true); enterVisitorMode(); });
  bar.appendChild(vb);
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

/* "View as visitor": the leader sees the pure public render.
   Only the return strip is added, and it exists only because a
   leader session was confirmed — the mode rides on the same
   initEdit gate as the edit bar itself, so the ?view=visitor
   parameter alone shows a non-leader nothing at all. It never
   signs out and never touches the desk's session. */
function visitorWanted() {
  try { return new URLSearchParams(window.location.search).get('view') === 'visitor'; }
  catch (e) { return false; }
}
function setVisitorParam(on) {
  try {
    const url = new URL(window.location.href);
    if (on) url.searchParams.set('view', 'visitor');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url.toString());
  } catch (e) { /* the mode still holds for this view */ }
}
function enterVisitorMode() {
  if (PAGE.editing) { exitEdit(); render(PAGE.data); }
  PAGE.visitor = true;
  $('editbar').classList.add('hidden');
  const strip = $('visitorstrip');
  strip.replaceChildren();
  strip.appendChild(h('span', null, 'You’re viewing this page as visitors see it.'));
  const back = h('button', 'btn small', 'Back to editing');
  back.type = 'button';
  back.addEventListener('click', exitVisitorMode);
  strip.appendChild(back);
  strip.classList.remove('hidden');
}
function exitVisitorMode() {
  PAGE.visitor = false;
  setVisitorParam(false);
  $('visitorstrip').classList.add('hidden');
  barView();
}

/* Find the desk's session in this browser. The client config is
   identical to the desk's, so the stored session sits under the
   same key on the same origin — but a cold client's one-shot
   getSession can still come back empty when the stored access
   token has expired and its inline refresh fails (the desk tab's
   own refresher is the usual contender). So: getSession, then
   the auth-state event the desk itself routes on, then an
   explicit refresh. Every step logs its outcome. */
async function acquireSession(client) {
  let eventSession = null;
  let sub = null;
  const eventPromise = new Promise((resolve) => {
    try {
      const r = client.auth.onAuthStateChange((_event, session) => {
        if (session && session.user && !eventSession) {
          eventSession = session;
          resolve(session);
        }
      });
      sub = r && r.data ? r.data.subscription : null;
    } catch (e) { resolve(null); }
    setTimeout(() => resolve(eventSession), 1800);
  });
  const finish = (s, via) => {
    try { if (sub) sub.unsubscribe(); } catch (e) { /* already gone */ }
    if (s) elog('session found via ' + via + ' —', s.user.email || s.user.id);
    return s;
  };
  try {
    const res = await client.auth.getSession();
    const s = res && res.data ? res.data.session : null;
    if (s && s.user) return finish(s, 'getSession');
    if (res && res.error) elog('getSession error —', res.error.message || res.error);
  } catch (e) { elog('getSession threw —', (e && e.message) || e); }
  const ev = await eventPromise;
  if (ev) return finish(ev, 'auth state change');
  try { if (sub) sub.unsubscribe(); } catch (e) { /* already gone */ }
  try {
    const res = await client.auth.refreshSession();
    const s = res && res.data ? res.data.session : null;
    if (s && s.user) return finish(s, 'refreshSession');
    if (res && res.error) elog('refreshSession error —', res.error.message || res.error);
  } catch (e) { elog('refreshSession threw —', (e && e.message) || e); }
  return null;
}

/* The leadership read. An error here (a stale token being the
   usual cause) is NOT the same answer as "not a member", so it
   is checked explicitly, retried once after a refresh, and
   logged either way. */
async function readMembership(client, userId, groupId) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let mem = null;
    try {
      mem = await client
        .from('memberships')
        .select('group_id, role')
        .eq('user_id', userId)
        .eq('group_id', groupId);
    } catch (e) {
      elog('memberships read threw (attempt ' + (attempt + 1) + ') —', (e && e.message) || e);
      mem = { data: null, error: e };
    }
    if (mem && !mem.error) return { rows: mem.data || [], error: null };
    elog('memberships read failed (attempt ' + (attempt + 1) + ') —',
      (mem && mem.error && (mem.error.message || mem.error.code)) || 'unknown error');
    if (attempt === 0) {
      try { await client.auth.refreshSession(); }
      catch (e) { elog('refresh before retry threw —', (e && e.message) || e); }
    }
  }
  return { rows: [], error: true };
}

async function initEdit(data) {
  PAGE.data = data;
  if (!data.groupId) {
    elog('the church-site payload carries no groupId — the deployed church-site function is an older version; edit bar not shown.');
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    elog('the Supabase client library did not load; edit bar not shown.');
    return;
  }
  let client;
  try {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    elog('createClient threw —', (e && e.message) || e);
    return;
  }
  const session = await acquireSession(client);
  if (!session) {
    elog('no signed-in session found in this browser. The desk session lives under the same origin and storage key, so this means: signed out here, a different browser/profile, or the stored session could not be refreshed. Edit bar not shown; the page is unaffected.');
    return;
  }
  PAGE.client = client;
  PAGE.user = session.user;
  const mem = await readMembership(client, session.user.id, data.groupId);
  if (mem.error) {
    elog('membership read failed after a retry; edit bar not shown.');
    return;
  }
  if (!mem.rows.some((r) => r.role === 'leader')) {
    elog('signed in as', session.user.email || session.user.id,
      '— membership rows for this church:', mem.rows.length,
      '(' + mem.rows.map((r) => r.role).join(', ') + ') — not a leader; edit bar not shown.');
    return;
  }
  try {
    const grp = await client.from('groups').select('settings').eq('id', data.groupId).maybeSingle();
    if (grp && grp.error) elog('group settings read failed —', grp.error.message || grp.error.code || 'unknown');
    PAGE.settings = grp && grp.data && grp.data.settings && typeof grp.data.settings === 'object'
      ? grp.data.settings : {};
  } catch (e) {
    elog('group settings read threw —', (e && e.message) || e);
    PAGE.settings = {};
  }
  const site = PAGE.settings.site && typeof PAGE.settings.site === 'object' ? PAGE.settings.site : {};
  PAGE.photoPaths = Array.isArray(site.photos)
    ? site.photos.filter((p) => typeof p === 'string')
    : photoPathsFromUrls(data.photos);
  if (visitorWanted()) {
    elog('leader confirmed; ?view=visitor — showing the visitor view strip.');
    enterVisitorMode();
  } else {
    elog('leader confirmed; showing the edit bar.');
    barView();
  }
}

function enterEdit() {
  const data = PAGE.data;
  if (!data) return;
  PAGE.editing = true;
  // editing shows both halves of each pair (the welcome and
  // give editors exist even when their sections are publicly
  // hidden), so neither pair stays marked solo.
  $('pair-visit').classList.remove('solo');
  $('pair-give').classList.remove('solo');
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
  // ministries edit in place: the section shows even when the
  // church has none yet, so the first one can be added here.
  PAGE.ministries = cleanMinistries(data.ministries).map((m) => ({ ...m }));
  $('sec-ministries').classList.remove('hidden');
  $('site-ministries').classList.add('hidden');
  $('ministries-all-wrap').classList.add('hidden');
  $('ministries-edit').classList.remove('hidden');
  renderMinistryEditor();
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
  $('ministries-edit').classList.add('hidden');
  $('site-ministries').classList.remove('hidden');
  $('sec-photos-edit').classList.add('hidden');
  $('hero-photo-btns').classList.add('hidden');
}

function cancelEdit() {
  exitEdit();
  render(PAGE.data);
  barView();
}

/* The ministries editor: one field set per ministry, working on
   PAGE.ministries; the values flow straight from the inputs, and
   Save cleans the list (trims, caps, drops the nameless) the
   same way the function will. The guidance line and these
   fields exist only in edit mode — the public page never
   contains them. */
function renderMinistryEditor() {
  const box = $('ministries-edit-list');
  box.replaceChildren();
  PAGE.ministries.forEach((m, i) => {
    const wrap = h('div', 'min-edit');
    const fields = [
      ['name', 'Ministry name', false, 80],
      ['when', 'When it meets', false, 80],
      ['place', 'Where it meets', false, 120],
      ['blurb', 'A sentence about it', true, 240],
    ];
    for (const [key, label, area, max] of fields) {
      const lab = h('label', null, label);
      const input = document.createElement(area ? 'textarea' : 'input');
      if (!area) input.type = 'text';
      input.value = m[key] || '';
      input.maxLength = max;
      input.addEventListener('input', () => { PAGE.ministries[i][key] = input.value; });
      lab.appendChild(input);
      wrap.appendChild(lab);
    }
    const del = h('button', 'min-del', 'Remove this ministry');
    del.type = 'button';
    del.addEventListener('click', () => {
      PAGE.ministries.splice(i, 1);
      renderMinistryEditor();
    });
    wrap.appendChild(del);
    box.appendChild(wrap);
  });
}
function addMinistry() {
  if (PAGE.ministries.length >= 12) {
    barMsg('Twelve ministries is the most the page holds.', 'err');
    return;
  }
  PAGE.ministries.push({ name: '', when: '', place: '', blurb: '' });
  renderMinistryEditor();
  const cards = $('ministries-edit-list').querySelectorAll('.min-edit');
  const last = cards[cards.length - 1];
  const first = last ? last.querySelector('input') : null;
  if (first) first.focus();
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
    photos: [...PAGE.photoPaths].slice(0, SITE_PHOTO_MAX),
    ministries: cleanMinistries(PAGE.ministries),
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
    ministries: fields.ministries,
  });
  exitEdit();
  render(PAGE.data);
  barView('Saved — this page shows it now.', 'ok');
}

/* Photos: uploaded and saved as they change (the desk's pattern),
   under this church's own folder in the church-site-photos
   bucket, where the Step 24 rules keep writes leader-only.
   Two bounds ride along: at most SITE_PHOTO_MAX photos (the
   add control steps aside for the cap message at the limit,
   and every write of the list is trimmed to the cap), and each
   upload is downscaled first — the same client-side courtesy
   the app does for logos. A photo already JPEG and inside the
   bounds travels untouched, and one that cannot be decoded
   travels as-is: the resize never refuses an upload. */
function photoTargetSize(width, height) {
  const longest = Math.max(width || 0, height || 0);
  if (!longest || longest <= SITE_PHOTO_MAX_EDGE) return null;
  const k = SITE_PHOTO_MAX_EDGE / longest;
  return {
    width: Math.max(1, Math.round((width || 0) * k)),
    height: Math.max(1, Math.round((height || 0) * k)),
  };
}
async function decodeSitePhoto(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch (e) { /* fall through to the Image path */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('photo decode failed')); };
    img.src = url;
  });
}
async function prepareSitePhoto(file) {
  const original = { blob: file, name: file && file.name ? file.name : 'photo', resized: false };
  let bmp = null;
  try { bmp = await decodeSitePhoto(file); } catch (e) { return original; }
  const w = bmp.naturalWidth || bmp.width || 0;
  const hgt = bmp.naturalHeight || bmp.height || 0;
  const target = photoTargetSize(w, hgt);
  const isJpeg = ((file && file.type) || '').toLowerCase() === 'image/jpeg';
  if (!target && isJpeg) {
    if (bmp.close) bmp.close();
    return original;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = target ? target.width : w;
    canvas.height = target ? target.height : hgt;
    const ctx = canvas.getContext('2d');
    /* White behind the picture, so a transparent PNG keeps its
       look when it becomes a JPEG instead of going black. */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (bmp.close) bmp.close();
    if (!blob) return original;
    const base = (file.name || 'photo').replace(/\.[^.]*$/, '');
    return { blob, name: base + '.jpg', resized: true };
  } catch (e) {
    return original;
  }
}
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
  const atCap = PAGE.photoPaths.length >= SITE_PHOTO_MAX;
  $('photo-add-row').classList.toggle('hidden', atCap);
  $('photo-cap-note').classList.toggle('hidden', !atCap);
}
function safeName(name) {
  return (name || 'photo').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60);
}
/* The hero backdrop follows the first photo in the list: the
   backdrop shows when one exists, the watermark returns when
   none does. Used by every photo change in edit mode. */
function syncHeroPhoto() {
  const first = PAGE.photoPaths[0];
  const has = !!first;
  $('hero').classList.toggle('has-photo', has);
  $('hero-bg').classList.toggle('hidden', !has);
  if (has) {
    $('hero-photo').src = PHOTO_PREFIX + first;
    $('hero-photo').alt = PAGE.data.name;
  }
  $('hero-watermark').classList.toggle('hidden', !PAGE.data.logoUrl || has);
}
async function uploadPhoto(file) {
  const prepared = await prepareSitePhoto(file);
  const path = PAGE.data.groupId + '/' + Date.now() + '-' + safeName(prepared.name);
  const opts = prepared.blob && prepared.blob.type ? { contentType: prepared.blob.type } : undefined;
  const { error } = await PAGE.client.storage.from('church-site-photos').upload(path, prepared.blob, opts);
  if (error) return null;
  return path;
}
async function persistPhotos(msg) {
  const site = { ...(PAGE.settings && PAGE.settings.site ? PAGE.settings.site : {}), photos: [...PAGE.photoPaths].slice(0, SITE_PHOTO_MAX) };
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
  if (PAGE.photoPaths.length >= SITE_PHOTO_MAX) { barMsg(SITE_PHOTO_CAP_MSG, 'err'); return; }
  const input = $('photo-add-file');
  const file = input.files && input.files[0];
  if (!file) { barMsg('Choose a photo first.', 'err'); return; }
  barMsg('Adding your photo…');
  const path = await uploadPhoto(file);
  if (!path) { barMsg('That photo did not upload. Check your connection and try again.', 'err'); return; }
  input.value = '';
  PAGE.photoPaths.push(path);
  syncHeroPhoto();
  await persistPhotos('Photo added — saved.');
}
async function removePhoto(path) {
  if (!window.confirm('Remove this photo from your church site?')) return;
  try { await PAGE.client.storage.from('church-site-photos').remove([path]); } catch (e) { /* list first */ }
  PAGE.photoPaths = PAGE.photoPaths.filter((p) => p !== path);
  syncHeroPhoto();
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
  syncHeroPhoto();
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
  $('ministry-add').addEventListener('click', addMinistry);
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
