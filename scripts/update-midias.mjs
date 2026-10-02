#!/usr/bin/env node
// Atualiza o bloco "Mídias" da home: 3 vídeos do YouTube, 3 posts do Instagram e 5 do LinkedIn.
// Roda local (npm i && node scripts/update-midias.mjs) ou pela GitHub Action update-midias.yml.
//
// Fontes, em ordem de tentativa:
//   YouTube:   página /videos do canal (sem chave) -> oEmbed para título -> página do vídeo para a data.
//              Vídeos em FIXADOS_YOUTUBE entram sempre primeiro e nunca são trocados.
//   Instagram: API oficial se houver IG_ACCESS_TOKEN -> endpoint público do perfil -> mantém o que já existe.
//   LinkedIn:  página pública da empresa (sem login) -> mantém o que já existe.
// Se uma fonte falhar, os itens anteriores continuam no ar: o site nunca fica com o bloco vazio.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'assets/data/midias.json');
const IMG_DIR = path.join(ROOT, 'assets/img/midias');
const PAGE = path.join(ROOT, 'index.html');

const YT_HANDLE = 'minerthalprodutosagropecuarios';
const YT_CHANNEL = 'UCYkbAf5khwxaMfa7pXLqmcA';
const IG_USER = 'minerthal';
const LI_COMPANY = 'minerthal-produtos-agropecu-rios-ltda-';
const FIXADOS_YOUTUBE = []; // ex.: ['EjHiYEOUJIA'] para manter um vídeo sempre em destaque
const N = { youtube: 3, instagram: 3, linkedin: 5 };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const HDR = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' };

const log = (...a) => console.log('[midias]', ...a);
const get = async (url, opts = {}) => { const r = await fetch(url, { headers: HDR, ...opts }); if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 80)}`); return r; };
const dec = s => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function saveImage(url, name, w, h) {
  const file = path.join(IMG_DIR, name);
  const r = await get(url);
  await sharp(Buffer.from(await r.arrayBuffer())).resize(w, h, { fit: 'cover' }).webp({ quality: 70 }).toFile(file);
  return `assets/img/midias/${name}`;
}

/* ---------- YouTube ---------- */
async function youtube(prev) {
  const html = await (await get(`https://www.youtube.com/@${YT_HANDLE}/videos`)).text();
  const ids = [...new Set([...html.matchAll(/"videoId":"([\w-]{11})"/g)].map(m => m[1]))];
  if (!ids.length) throw new Error('nenhum vídeo na página do canal');
  const lista = [...FIXADOS_YOUTUBE, ...ids.filter(id => !FIXADOS_YOUTUBE.includes(id))].slice(0, N.youtube);
  const out = [];
  for (const id of lista) {
    const old = prev.find(v => v.id === id);
    if (old) { out.push(old); continue; }
    const o = await (await get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)).json();
    const w = await (await get(`https://www.youtube.com/watch?v=${id}`)).text();
    const date = (w.match(/"uploadDate":"([^"]+)"/) || [])[1] || '';
    const secs = +((w.match(/"lengthSeconds":"(\d+)"/) || [])[1] || 0);
    let thumb;
    try { thumb = await saveImage(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, `yt-${id}.webp`, 640, 360); }
    catch { thumb = await saveImage(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, `yt-${id}.webp`, 640, 360); }
    out.push({ id, title: o.title, date, secs, thumb, url: `https://www.youtube.com/watch?v=${id}` });
  }
  return out;
}

/* ---------- Instagram ---------- */
async function instagram(prev) {
  let items = [];
  if (process.env.IG_ACCESS_TOKEN) {
    const f = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const j = await (await get(`https://graph.instagram.com/me/media?fields=${f}&limit=${N.instagram}&access_token=${process.env.IG_ACCESS_TOKEN}`)).json();
    items = j.data.map(m => ({ code: m.permalink.split('/').filter(Boolean).pop(), url: m.permalink, caption: m.caption || '', date: m.timestamp, video: m.media_type === 'VIDEO', src: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url }));
  } else {
    const j = await (await get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${IG_USER}`, { headers: { ...HDR, 'x-ig-app-id': '936619743392459' } })).json();
    items = j.data.user.edge_owner_to_timeline_media.edges.map(e => e.node)
      .filter(n => n.owner?.username === undefined || n.owner.username === IG_USER)
      .slice(0, N.instagram)
      .map(n => ({ code: n.shortcode, url: `https://www.instagram.com/${IG_USER}/${n.is_video ? 'reel' : 'p'}/${n.shortcode}/`, caption: n.edge_media_to_caption.edges[0]?.node.text || '', date: new Date(n.taken_at_timestamp * 1000).toISOString(), video: n.is_video, src: n.display_url }));
  }
  const out = [];
  for (const it of items) {
    const old = prev.find(p => p.code === it.code);
    out.push(old || { code: it.code, url: it.url, caption: it.caption, date: it.date, video: it.video, img: await saveImage(it.src, `ig-${it.code}.webp`, 480, 480) });
  }
  return out;
}

/* ---------- LinkedIn ---------- */
async function linkedin(prev) {
  const r = await fetch(`https://www.linkedin.com/company/${LI_COMPANY}`, { headers: { ...HDR, Accept: 'text/html' }, redirect: 'manual' });
  if (r.status !== 200) throw new Error(`LinkedIn respondeu ${r.status}`);
  const h = await r.text();
  const followers = (h.match(/([\d.]+)\s+seguidores/) || [])[1] || null;
  const strip = s => dec(s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const starts = [...h.matchAll(/data-activity-urn="(urn:li:activity:\d+)"/g)];
  if (!starts.length) throw new Error('nenhum post na página pública (provável bloqueio)');
  const seen = new Set(), posts = [];
  starts.forEach((m, i) => {
    const urn = m[1]; if (seen.has(urn)) return; seen.add(urn);
    const end = starts.slice(i + 1).find(n => n[1] !== urn)?.index ?? h.length;
    const block = h.slice(m.index, end);
    const com = block.match(/data-test-id="main-feed-activity-card__commentary"[^>]*>([\s\S]*?)<\/p>/);
    if (!com) return;
    // o link do card fica antes do atributo com o URN; buscar pelo ID evita pegar o link do post vizinho
    const link = h.match(new RegExp(`href="(https://[a-z]+\\.linkedin\\.com/posts/[^"?]*activity-${urn.split(':').pop()}[^"?]*)`));
    const media = [...dec(block).matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^"\s\\]+/g)].map(x => x[0])
      .filter(u => !/company-logo|profile-displayphoto/.test(u));
    const pick = media.find(u => /feedshare-image|videocover|document-cover/.test(u)) || media[0] || '';
    const kind = /videocover/.test(pick) ? 'video' : /document-cover/.test(pick) ? 'documento' : pick ? 'imagem' : 'texto';
    posts.push({ urn, date: new Date(Number(BigInt(urn.split(':').pop()) >> 22n)).toISOString(), url: link ? dec(link[1]) : `https://www.linkedin.com/feed/update/${urn}/`, text: strip(com[1]), kind, src: pick });
  });
  posts.sort((a, b) => b.date.localeCompare(a.date));
  const out = [];
  for (const p of posts.slice(0, N.linkedin)) {
    const old = prev.find(o => o.urn === p.urn);
    if (old) { out.push(old); continue; }
    const id = p.urn.split(':').pop();
    let img = '';
    if (p.src) { try { img = await saveImage(p.src, `li-${id}.webp`, 480, 300); } catch (e) { log('imagem LinkedIn falhou', id, e.message); } }
    out.push({ urn: p.urn, date: p.date, url: p.url, text: p.text, kind: p.kind, img });
  }
  return { posts: out, followers };
}

/* ---------- HTML ---------- */
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDate = iso => { const d = new Date(iso); return `${String(d.getUTCDate()).padStart(2, '0')} ${MES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const isoDay = iso => new Date(iso).toISOString().slice(0, 10);
const excerpt = (t, n) => { const clean = t.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim(); return clean.length <= n ? clean : clean.slice(0, clean.lastIndexOf(' ', n)) + '…'; };
const dur = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '';
const ICON = {
  yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9L15.5 12Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  li: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
};

function render(d) {
  const yt = d.youtube.map(v => `
        <li class="yt-card">
          <div class="yt-media">
            <button type="button" class="video-play" data-yt="${v.id}" aria-label="Assistir: ${esc(v.title)}${v.secs ? `, ${dur(v.secs)}` : ''}">
              <img src="${v.thumb}" alt="" width="640" height="360" loading="lazy" decoding="async">
              <span class="play">${ICON.play}</span>${v.secs ? `<span class="yt-dur">${dur(v.secs)}</span>` : ''}
            </button>
          </div>
          <p class="yt-date"><time datetime="${isoDay(v.date)}">${fmtDate(v.date)}</time></p>
          <h4><a href="${v.url}" rel="noopener">${esc(v.title)}</a></h4>
        </li>`).join('');
  const ig = d.instagram.map(p => `
          <li><a href="${p.url}" rel="noopener" class="ig-post">
            <img src="${p.img}" alt="" width="480" height="480" loading="lazy" decoding="async">
            ${p.video ? `<span class="ig-badge">Reel</span>` : ''}
            <span class="ig-cap"><time datetime="${isoDay(p.date)}">${fmtDate(p.date)}</time>${esc(excerpt(p.caption, 110))}</span>
          </a></li>`).join('');
  const li = d.linkedin.posts.map(p => `
          <li><a href="${p.url}" rel="noopener" class="li-post">
            ${p.img ? `<img src="${p.img}" alt="" width="480" height="300" loading="lazy" decoding="async">` : ''}
            <span class="li-body"><span class="li-meta"><time datetime="${isoDay(p.date)}">${fmtDate(p.date)}</time>${p.kind === 'video' ? ' · Vídeo' : p.kind === 'documento' ? ' · Documento' : ''}</span>${esc(excerpt(p.text, 170))}</span>
          </a></li>`).join('');
  const fol = d.linkedin.followers ? `<span class="li-fol"><b>${d.linkedin.followers}</b> seguidores</span>` : '';
  return `
    <div class="md-yt">
      <div class="md-head"><h3><span class="md-ico yt">${ICON.yt}</span>YouTube</h3><a class="md-follow" href="https://www.youtube.com/@${YT_HANDLE}" rel="noopener">Ver o canal</a></div>
      <ul class="yt-grid">${yt}
      </ul>
    </div>
    <div class="md-social">
      <div class="md-ig">
        <div class="md-head"><h3><span class="md-ico ig">${ICON.ig}</span>Instagram</h3><a class="md-follow" href="https://www.instagram.com/${IG_USER}/" rel="noopener">Seguir @${IG_USER}</a></div>
        <ul class="ig-grid">${ig}
        </ul>
      </div>
      <div class="md-li">
        <div class="md-head"><h3><span class="md-ico li">${ICON.li}</span>LinkedIn</h3>${fol}<a class="md-follow" href="https://www.linkedin.com/company/${LI_COMPANY}/" rel="noopener">Seguir no LinkedIn</a></div>
        <ul class="li-list">${li}
        </ul>
      </div>
    </div>
    <p class="md-upd">Atualizado automaticamente em <time datetime="${isoDay(d.updated)}">${fmtDate(d.updated)}</time>.</p>`;
}

/* ---------- main ---------- */
await fs.mkdir(IMG_DIR, { recursive: true });
let prev = { youtube: [], instagram: [], linkedin: { posts: [], followers: null } };
try { prev = JSON.parse(await fs.readFile(DATA, 'utf8')); } catch {}
const next = { ...prev };
for (const [k, fn] of [['youtube', youtube], ['instagram', instagram], ['linkedin', linkedin]]) {
  try { next[k] = await fn(k === 'linkedin' ? prev.linkedin.posts : prev[k]); log(k, 'ok'); }
  catch (e) { log(k, 'mantido (falhou:', e.message + ')'); }
}
if (next.linkedin && !next.linkedin.followers) next.linkedin.followers = prev.linkedin?.followers || null;
const changed = JSON.stringify({ ...next, updated: 0 }) !== JSON.stringify({ ...prev, updated: 0 });
next.updated = changed || !prev.updated ? new Date().toISOString() : prev.updated;

// remove imagens que saíram do bloco
const keep = new Set([...next.youtube.map(v => v.thumb), ...next.instagram.map(p => p.img), ...next.linkedin.posts.map(p => p.img)].filter(Boolean).map(p => path.basename(p)));
for (const f of await fs.readdir(IMG_DIR)) if (!keep.has(f)) { await fs.unlink(path.join(IMG_DIR, f)); log('removida', f); }

await fs.mkdir(path.dirname(DATA), { recursive: true });
await fs.writeFile(DATA, JSON.stringify(next, null, 1) + '\n');
const page = await fs.readFile(PAGE, 'utf8');
const updated = page.replace(/(<!--MIDIAS:START-->)[\s\S]*?(<!--MIDIAS:END-->)/, `$1${render(next)}\n    $2`);
if (updated === page && !page.includes('<!--MIDIAS:START-->')) throw new Error('marcadores MIDIAS não encontrados no index.html');
await fs.writeFile(PAGE, updated);
log(changed ? 'bloco atualizado' : 'sem novidades');
