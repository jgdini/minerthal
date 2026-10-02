import fs from 'node:fs/promises';

const T = 'C:/Claude Sites/minerthal-redesign/scripts/';
const ROOT = 'C:/Claude Sites/minerthal-redesign/';
const eds = JSON.parse(await fs.readFile(T + 'resulthal.json', 'utf8'));
const home = await fs.readFile(ROOT + 'index.html', 'utf8');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const UFN = { MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', SP: 'São Paulo', GO: 'Goiás', TO: 'Tocantins', PR: 'Paraná', MT: 'Mato Grosso' };
const edLabel = e => e.num ? `Edição nº ${e.num}` : 'Edição especial';
const dateLabel = e => `${e.mesNome} de ${e.ano}`;
const iso = e => `${e.ano}-${String(e.mes).padStart(2, '0')}`;

// partes compartilhadas com a home
const css = home.match(/<style>([\s\S]*?)<\/style>/)[1];
const topbar = home.match(/<div class="topbar">[\s\S]*?<\/header>/)[0]
  .replace(/href="#(?!conteudo-principal)/g, 'href="./#')
  .replace('<li><a href="resulthal.html">Resulthal</a></li>', '<li><a href="resulthal.html" aria-current="page">Resulthal</a></li>')
  .replace(/ data-tab="[a-z]+"/g, '');
const footer = home.match(/<footer>[\s\S]*?<\/footer>/)[0].replace(/href="#/g, 'href="./#');
const wa = home.match(/<a class="wa"[\s\S]*?<\/a>/)[0];
const cta = home.match(/<section class="cta"[\s\S]*?<\/section>/)[0];

const estados = [...new Set(eds.flatMap(e => e.estados))].sort((a, b) => UFN[a].localeCompare(UFN[b]));
const produtos = [...new Set(eds.flatMap(e => e.produtos))].sort((a, b) => a.localeCompare(b, 'pt'));
const latest = eds[0];
const first = eds[eds.length - 1];

const cards = eds.map(e => {
  const q = fold([e.titulo, ...e.produtos, ...e.estados.map(u => UFN[u]), e.num ?? 'especial'].join(' '));
  const chips = [...e.produtos.map(p => `<span>${esc(p)}</span>`), ...e.estados.map(u => `<span class="uf" title="${UFN[u]}">${u}</span>`), `<span class="sys">${e.sistema === 'leite' ? 'Leite' : 'Corte'}</span>`].join('');
  return `<li data-s="${e.sistema}" data-uf="${e.estados.join(' ')}" data-p="${esc(e.produtos.join('|'))}" data-y="${e.ano}" data-q="${esc(q)}">
<article class="ed-card">
<img src="assets/img/resulthal/${e.cover}.webp" alt="" width="240" height="300" loading="lazy" decoding="async">
<div class="ed-body">
<p class="ed-meta"><span>${edLabel(e)}</span> · <time datetime="${iso(e)}">${dateLabel(e)}</time></p>
<h3>${esc(e.titulo)}</h3>
<p class="chips-sm">${chips}</p>
<a class="ed-dl" href="${e.pdf}" rel="noopener" type="application/pdf">Baixar PDF<span class="sr"> da ${edLabel(e).toLowerCase()}</span></a>
</div>
</article>
</li>`;
}).join('\n');

const faq = [
  ['O que é o Resulthal?', `É o informativo da Minerthal com casos de fazendas clientes. Cada edição descreve a estratégia de suplementação usada no rebanho e os resultados medidos, como ganho de peso, índice de prenhez, peso à desmama e retorno financeiro.`],
  ['Quantas edições do Resulthal existem?', `São ${eds.length} edições publicadas entre ${first.mesNome} de ${first.ano} e ${latest.mesNome} de ${latest.ano}, incluindo uma edição especial sobre a parceria da Minerthal com a Embrapa, de setembro de 2015.`],
  ['De quais estados são as fazendas do Resulthal?', `Os casos vêm de fazendas em ${estados.map(u => UFN[u]).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`],
  ['Como baixar uma edição do Resulthal?', 'Cada edição está disponível em PDF, sem cadastro. Use os filtros por produto, estado ou sistema de produção e clique em Baixar PDF.'],
];

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'CollectionPage', '@id': 'https://www.minerthal.com.br/historias/#page', url: 'https://www.minerthal.com.br/historias/',
      name: 'Resulthal: histórias de sucesso com a Minerthal', inLanguage: 'pt-BR',
      description: `Arquivo com as ${eds.length} edições do Resulthal, informativo da Minerthal com casos de fazendas clientes.`,
      isPartOf: { '@id': 'https://www.minerthal.com.br/#site' }, publisher: { '@id': 'https://www.minerthal.com.br/#org' },
      breadcrumb: { '@id': 'https://www.minerthal.com.br/historias/#breadcrumb' },
      mainEntity: { '@type': 'ItemList', numberOfItems: eds.length, itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: eds.map((e, i) => ({ '@type': 'ListItem', position: i + 1, item: {
          '@type': 'CreativeWork', name: `Resulthal ${edLabel(e).replace('Edição', 'edição')}: ${e.titulo}`, datePublished: iso(e),
          url: e.pdf, encodingFormat: 'application/pdf', inLanguage: 'pt-BR', publisher: { '@id': 'https://www.minerthal.com.br/#org' },
          ...(e.produtos.length ? { about: e.produtos.map(p => ({ '@type': 'Thing', name: p })) } : {}),
          ...(e.estados.length ? { spatialCoverage: e.estados.map(u => ({ '@type': 'State', name: UFN[u], containedInPlace: { '@type': 'Country', name: 'Brasil' } })) } : {}) } })) } },
    { '@type': 'BreadcrumbList', '@id': 'https://www.minerthal.com.br/historias/#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.minerthal.com.br/' },
      { '@type': 'ListItem', position: 2, name: 'Resulthal', item: 'https://www.minerthal.com.br/historias/' }] },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'Organization', '@id': 'https://www.minerthal.com.br/#org', name: 'Minerthal', url: 'https://www.minerthal.com.br/' },
  ],
};

const pageCss = `
.r-hero{background:radial-gradient(90% 120% at 90% 0%,#21579b 0%,var(--navy) 55%);color:#fff;padding:56px 0 90px;position:relative;overflow:hidden}
.r-hero::after{content:"";position:absolute;right:-120px;bottom:-200px;width:520px;height:520px;border-radius:50%;border:80px solid rgba(166,199,45,.1)}
.r-hero .wrap{display:grid;grid-template-columns:1.25fr .75fr;gap:56px;align-items:center;position:relative;z-index:1}
.crumbs{list-style:none;display:flex;gap:8px;font-size:.92rem;color:#c7d6eb;margin-bottom:22px}
.crumbs a{color:#fff}
.crumbs li+li::before{content:"/";margin-right:8px;color:#8fa9cc}
.r-hero h1{font-size:min(clamp(2.6rem,5.4vw,4.6rem),calc((100vw - 32px) / 8.8));font-weight:800}
.r-hero h1 span,.r-hero h1 em{display:block;white-space:nowrap}
.r-hero h1 em{font-style:normal;color:var(--lime)}
.r-hero .lead{color:#dbe5f3;margin-top:16px}
.r-stats{display:grid;grid-template-columns:repeat(4,auto);gap:32px;margin-top:34px;justify-content:start}
.r-stats div{display:flex;flex-direction:column-reverse}
.r-stats dd{font-family:var(--display);font-weight:800;font-size:2.5rem;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.r-stats dt{font-size:.9rem;color:#c7d6eb;margin-top:4px}
.latest{background:#fff;color:var(--ink);border-radius:24px;padding:22px;box-shadow:0 30px 60px -30px rgba(0,0,0,.5);display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:center}
.latest img{border-radius:10px;width:120px}
.latest .tag{font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--lime-dark)}
.latest h2{font-size:1.45rem;margin:6px 0 12px;color:var(--navy)}
.latest .btn{padding:11px 18px;min-height:44px;font-size:.92rem}
.r-tools{background:#fff;border-radius:22px;box-shadow:var(--shadow);padding:22px;margin-top:-50px;position:relative;z-index:2;display:grid;grid-template-columns:1.4fr auto 1fr 1fr 1fr;gap:16px;align-items:end}
.field label,.field legend{display:block;font-family:var(--display);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--navy);font-size:.92rem;margin-bottom:8px}
.field fieldset{border:0}
.field input,.field select{width:100%;height:48px;border:1.5px solid var(--sand);border-radius:12px;padding:0 14px;font:inherit;color:var(--ink);background:#fff}
.field input:focus,.field select:focus{outline:3px solid var(--lime);outline-offset:1px;border-color:var(--navy)}
.field select{appearance:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230e2b52' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center;padding-right:38px}
.field .chips{flex-wrap:nowrap}
.r-list-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:34px 0 18px;color:var(--muted)}
.r-list-top b{font-family:var(--display);font-size:1.5rem;color:var(--navy)}
.eds{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.eds li[hidden]{display:none}
.ed-card{background:var(--cream);border-radius:20px;padding:18px;display:grid;grid-template-columns:104px 1fr;gap:18px;height:100%;transition:transform .25s,box-shadow .25s}
.ed-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.ed-card img{width:104px;border-radius:8px;align-self:start}
.ed-body{display:flex;flex-direction:column;gap:8px;min-width:0}
.ed-meta{font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--lime-dark)}
.ed-card h3{font-size:1.22rem;line-height:1.1;color:var(--navy);font-weight:800}
.chips-sm{display:flex;flex-wrap:wrap;gap:6px}
.chips-sm span{font-size:.74rem;font-weight:600;padding:3px 9px;border-radius:999px;background:#fff;color:var(--blue);border:1px solid var(--line)}
.chips-sm .uf{color:var(--navy);font-weight:700}
.chips-sm .sys{background:var(--sky-soft);border-color:var(--sky-soft)}
.ed-dl{margin-top:auto;font-weight:700;color:var(--blue);padding:6px 0;width:max-content}
.ed-dl::after{content:" ↓"}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.r-faq{background:var(--cream)}
.r-faq + .cta{background:var(--cream)}
@media (max-width:1080px){
  .r-hero .wrap{grid-template-columns:1fr;gap:36px}
  .r-tools{grid-template-columns:1fr 1fr}
  .r-tools .field:first-child{grid-column:1/-1}
  .eds{grid-template-columns:1fr 1fr}
}
@media (max-width:760px){
  .r-hero{padding:40px 0 80px}
  .r-stats{grid-template-columns:1fr 1fr;gap:20px}
  .latest{grid-template-columns:90px 1fr}
  .latest img{width:90px}
  .r-tools{grid-template-columns:1fr;padding:18px 16px}
  .eds{grid-template-columns:1fr}
  .ed-card{grid-template-columns:84px 1fr;gap:14px}
  .ed-card img{width:84px}
}`;

const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resulthal: histórias de sucesso com a Minerthal | ${eds.length} edições</title>
<meta name="description" content="Baixe as ${eds.length} edições do Resulthal, o informativo da Minerthal com casos de fazendas de corte e leite em ${estados.length} estados. Filtre por produto, estado e sistema de produção.">
<meta name="theme-color" content="#0e2b52">
<link rel="canonical" href="https://www.minerthal.com.br/historias/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Minerthal">
<meta property="og:title" content="Resulthal: histórias de sucesso com a Minerthal">
<meta property="og:description" content="${eds.length} edições com casos de fazendas clientes, de ${first.ano} a ${latest.ano}.">
<meta property="og:image" content="https://jgdini.github.io/minerthal/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
<style>${css}${pageCss}
</style>
</head>
<body>
<a class="skip" href="#conteudo-principal">Pular para o conteúdo</a>

${topbar}

<main id="conteudo-principal">
<section class="r-hero" aria-labelledby="r-title">
  <div class="wrap">
    <div>
      <nav aria-label="Você está em"><ol class="crumbs"><li><a href="./">Início</a></li><li aria-current="page">Resulthal</li></ol></nav>
      <h1 id="r-title"><span>Resulthal:</span> <span>histórias de sucesso</span> <em>com a Minerthal</em></h1>
      <p class="lead">O informativo da Minerthal com casos de fazendas clientes. Cada edição mostra a estratégia de suplementação usada no rebanho e o resultado medido: ganho de peso, prenhez, desmama e retorno financeiro.</p>
      <dl class="r-stats">
        <div><dt>edições em PDF</dt><dd class="count" data-target="${eds.length}">${eds.length}</dd></div>
        <div><dt>primeira edição</dt><dd class="count" data-target="${first.ano}">${first.ano}</dd></div>
        <div><dt>estados com casos</dt><dd class="count" data-target="${estados.length}">${estados.length}</dd></div>
        <div><dt>produtos avaliados</dt><dd class="count" data-target="${produtos.length}">${produtos.length}</dd></div>
      </dl>
    </div>
    <article class="latest" aria-labelledby="latest-title">
      <img src="assets/img/resulthal/${latest.cover}.webp" alt="Capa do Resulthal ${edLabel(latest).toLowerCase()}" width="240" height="300" fetchpriority="high">
      <div>
        <span class="tag">Edição mais recente · ${dateLabel(latest)}</span>
        <h2 id="latest-title">${esc(latest.titulo)}</h2>
        <a class="btn btn-lime" href="${latest.pdf}" rel="noopener" type="application/pdf">Baixar a ${edLabel(latest).toLowerCase()}</a>
      </div>
    </article>
  </div>
</section>

<section aria-labelledby="arquivo-title" style="padding-top:0">
  <div class="wrap">
    <form class="r-tools" id="rf" role="search" aria-label="Filtrar edições">
      <div class="field"><label for="q">Buscar</label><input id="q" name="q" type="search" placeholder="Ex.: creep, prenhez, confinamento" autocomplete="off"></div>
      <div class="field"><fieldset><legend>Sistema</legend><div class="chips">
        <label class="chip"><input type="radio" name="s" value="" checked><span>Todos</span></label>
        <label class="chip"><input type="radio" name="s" value="corte"><span>Corte</span></label>
        <label class="chip"><input type="radio" name="s" value="leite"><span>Leite</span></label>
      </div></fieldset></div>
      <div class="field"><label for="p">Produto</label><select id="p" name="p">${opt('', 'Todos os produtos')}${produtos.map(p => opt(p, p)).join('')}</select></div>
      <div class="field"><label for="uf">Estado</label><select id="uf" name="uf">${opt('', 'Todos os estados')}${estados.map(u => opt(u, UFN[u])).join('')}</select></div>
      <div class="field"><label for="y">Período</label><select id="y" name="y">${opt('', 'Todos os anos')}${opt('2020-2024', '2020 a 2024')}${opt('2015-2019', '2015 a 2019')}${opt('2010-2014', '2010 a 2014')}</select></div>
    </form>

    <h2 id="arquivo-title" class="sr">Todas as edições do Resulthal</h2>
    <div class="r-list-top"><p aria-live="polite"><b id="count">${eds.length}</b> edições</p><button type="button" class="reset" id="reset">Limpar filtros</button></div>
    <ul class="eds" id="eds">
${cards}
    </ul>
    <button type="button" class="btn btn-navy more" id="more" hidden></button>
    <p class="empty" id="empty" hidden>Nenhuma edição com esses filtros. Tente outro produto ou estado.</p>
  </div>
</section>

<section class="faq r-faq" id="duvidas" aria-labelledby="faq-title">
  <div class="wrap">
    <div>
      <span class="eyebrow">Dúvidas frequentes</span>
      <h2 id="faq-title">Sobre o Resulthal</h2>
    </div>
    <div>
${faq.map(([q, a], i) => `      <details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>

${cta}
</main>

${footer}

${wa}

<script>
(() => {
  const form = document.getElementById('rf'), items = [...document.querySelectorAll('#eds li')],
        count = document.getElementById('count'), empty = document.getElementById('empty'),
        more = document.getElementById('more'), LIMIT = 12;
  const fold = s => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
  let expanded = false;
  function apply() {
    const d = new FormData(form), q = fold(d.get('q') || ''), s = d.get('s'), p = d.get('p'), uf = d.get('uf'), y = d.get('y');
    const [y0, y1] = y ? y.split('-').map(Number) : [0, 9999];
    const terms = q.split(/\\s+/).filter(Boolean);
    let n = 0;
    for (const li of items) {
      const ok = (!s || li.dataset.s === s) && (!p || li.dataset.p.split('|').includes(p)) &&
        (!uf || li.dataset.uf.split(' ').includes(uf)) && (+li.dataset.y >= y0 && +li.dataset.y <= y1) &&
        terms.every(t => li.dataset.q.includes(t));
      if (ok) n++;
      li.hidden = !ok || (!expanded && n > LIMIT);
    }
    count.textContent = n; empty.hidden = n > 0;
    more.hidden = expanded || n <= LIMIT; more.textContent = 'Ver as ' + n + ' edições';
  }
  form.addEventListener('input', () => { expanded = false; apply(); });
  form.addEventListener('submit', e => e.preventDefault());
  more.addEventListener('click', () => { expanded = true; apply(); items.filter(li => !li.hidden)[LIMIT]?.querySelector('a').focus(); });
  document.getElementById('reset').addEventListener('click', () => { form.reset(); expanded = false; apply(); });
  apply();

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('.count');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const animateCount = el => {
      const target = parseInt(el.dataset.target, 10) || 0, duration = 1300, start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target);
        if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
      };
      requestAnimationFrame(tick);
    };
    counters.forEach(el => { el.textContent = '0'; });
    const countIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); }
    }), { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));
  }

  const btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menu'); };
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu'); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
</script>
</body>
</html>
`;
await fs.writeFile(ROOT + 'resulthal.html', html);
console.log('ok', html.length, 'bytes;', estados.length, 'estados;', produtos.length, 'produtos');
