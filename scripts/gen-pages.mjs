import fs from 'node:fs/promises';

const ROOT = 'C:/Claude Sites/minerthal-redesign/';
const home = await fs.readFile(ROOT + 'index.html', 'utf8');
const catalog = JSON.parse(await fs.readFile(ROOT + 'assets/catalogo.json', 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// partes compartilhadas com a home
const css = home.match(/<style>([\s\S]*?)<\/style>/)[1];
const header = home.match(/<div class="topbar">[\s\S]*?<\/header>/)[0]
  .replace(/href="#(?!conteudo-principal)/g, 'href="./#').replace(/ data-tab="[a-z]+"/g, '');
const footer = home.match(/<footer>[\s\S]*?<\/footer>/)[0].replace(/href="#/g, 'href="./#');
const wa = home.match(/<a class="wa"[\s\S]*?<\/a>/)[0];
const cta = home.match(/<section class="cta"[\s\S]*?<\/section>/)[0];
const WHATS = 'https://api.whatsapp.com/send?phone=5562992852649';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// contagem dos números (mesmo padrão dos outros sites)
export const COUNT_JS = `
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtNum = (n, el) => el.dataset.format === 'pt' ? n.toLocaleString('pt-BR') : String(n);
  const animateCount = (el, from = 0) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    if (reduceMotion) { el.textContent = fmtNum(target, el); return; }
    const duration = 1300, start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtNum(Math.floor(from + eased * (target - from)), el);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmtNum(target, el);
    };
    requestAnimationFrame(tick);
  };
  const counters = document.querySelectorAll('.count');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach(el => { el.textContent = fmtNum(0, el); });
    const countIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); }
    }), { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));
  }`;

const MENU_JS = `
  const btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menu'); };
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu'); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });`;

const SUB_CSS = `
.p-hero{background:radial-gradient(90% 120% at 90% 0%,#21579b 0%,var(--navy) 55%);color:#fff;padding:56px 0 100px;position:relative;overflow:hidden}
.p-hero::after{content:"";position:absolute;right:-120px;bottom:-200px;width:520px;height:520px;border-radius:50%;border:80px solid rgba(166,199,45,.1)}
.p-hero .wrap{display:grid;grid-template-columns:1.15fr .85fr;gap:56px;align-items:center;position:relative;z-index:1}
.crumbs{list-style:none;display:flex;flex-wrap:wrap;gap:8px;font-size:.92rem;color:#c7d6eb;margin-bottom:22px}
.crumbs a{color:#fff}
.crumbs li+li::before{content:"/";margin-right:8px;color:#8fa9cc}
.p-hero h1{font-size:min(clamp(2.5rem,5vw,4.3rem),calc((100vw - 32px) / var(--k,9)));font-weight:800}
.p-hero h1 span,.p-hero h1 em{display:block;white-space:nowrap}
.p-hero h1 em{font-style:normal;color:var(--lime)}
.p-hero .lead{color:#dbe5f3;margin-top:16px}
.p-hero .ctas{display:flex;gap:14px;flex-wrap:wrap;margin-top:30px}
.p-stats{display:flex;flex-wrap:wrap;gap:32px;margin-top:34px}
.p-stats div{display:flex;flex-direction:column-reverse}
.p-stats dd{font-family:var(--display);font-weight:800;font-size:2.5rem;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.p-stats dt{font-size:.9rem;color:#c7d6eb;margin-top:4px}
.p-visual img{width:100%;filter:drop-shadow(0 40px 50px rgba(0,0,0,.4))}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.cards3{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}
.cards3 li{background:var(--cream);border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:10px}
.cards3 .ico{width:56px;height:56px;border-radius:16px;background:#fff;color:var(--blue);display:grid;place-items:center}
.cards3 .ico svg{width:28px;height:28px}
.cards3 h3{font-size:1.45rem;color:var(--navy);font-weight:800}
.cards3 p{color:var(--muted)}
.count{font-variant-numeric:tabular-nums}
@media (max-width:1080px){.p-hero .wrap{grid-template-columns:1fr;gap:30px}.p-visual{max-width:520px}.cards3{grid-template-columns:1fr}}
@media (max-width:760px){.p-hero{padding:40px 0 80px}.p-stats{gap:22px}}`;

function page({ file, title, desc, canonical, crumb, ld, extraCss, main, js }) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0e2b52">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Minerthal">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
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
${JSON.stringify({ '@context': 'https://schema.org', '@graph': [
  ...ld,
  { '@type': 'BreadcrumbList', itemListElement: crumb.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) },
  { '@type': 'Organization', '@id': 'https://www.minerthal.com.br/#org', name: 'Minerthal', url: 'https://www.minerthal.com.br/' }] })}
</script>
<style>${css}${SUB_CSS}${extraCss}
</style>
</head>
<body>
<a class="skip" href="#conteudo-principal">Pular para o conteúdo</a>

${header}

<main id="conteudo-principal">
${main}
${cta}
</main>

${footer}

${wa}

<script>
(() => {${COUNT_JS}
${js}
${MENU_JS}
})();
</script>
</body>
</html>
`;
  return fs.writeFile(ROOT + file, html).then(() => console.log(file, html.length));
}
const crumbsHtml = items => `<nav aria-label="Você está em"><ol class="crumbs">${items.map(([n, u], i) => i === items.length - 1 ? `<li aria-current="page">${n}</li>` : `<li><a href="${u}">${n}</a></li>`).join('')}</ol></nav>`;
const faqHtml = (faq, title) => `
<section class="faq" id="duvidas" aria-labelledby="faq-title" style="background:var(--cream)">
  <div class="wrap">
    <div><span class="eyebrow">Dúvidas frequentes</span><h2 id="faq-title">${title}</h2></div>
    <div>
${faq.map(([q, a], i) => `      <details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>`;
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

/* ================= MINERBLOCK ================= */
const TIPOS = [
  { id: 'md', nome: 'MinerBlock MD', fator: 35 },
  { id: 'proteico-aguas', nome: 'MinerBlock Proteico Águas', fator: 150 },
  { id: 'proteico-seca', nome: 'MinerBlock Proteico Seca', fator: 150 },
  { id: 'energetico', nome: 'MinerBlock Energético', fator: 300 },
];
const calc = (fator, peso, n, dias) => { const c = Math.ceil((peso / 100) * fator); const b = Math.ceil(((c / 1000) * n * dias) / 25); return { c, b, a: Math.ceil(n / b), kg: Math.round((c * n * dias) / 1000) }; };
const ex = calc(35, 450, 100, 10);
const versoes = catalog.filter(([n]) => /^MinerBlock/.test(n));
const tagLabel = t => { const s = t.split(' '); return [s.includes('a') && s.includes('s') ? 'Águas e seca' : s.includes('a') ? 'Águas' : 'Seca', s.includes('L') ? 'Corte e leite' : 'Corte']; };

const mbFaq = [
  ['Quantos blocos de MinerBlock eu preciso?', `Multiplique o consumo diário por animal pelo número de animais e pelos dias entre uma reposição e outra, e divida por 25 kg, o peso de cada bloco. Exemplo: 100 animais de 450 kg com MinerBlock MD consomem ${ex.c} g por animal por dia. Com reposição a cada 10 dias, são ${ex.b} blocos, cerca de ${ex.a} animais por bloco.`],
  ['Qual é o consumo do MinerBlock por animal?', 'A calculadora da Minerthal usa 35 g por 100 kg de peso vivo por dia para o MinerBlock MD, 150 g para os Proteicos Águas e Seca e 300 g para o Energético. No MinerBlock MD, o consumo recomendado é de 135 a 270 g por UA (450 kg) por dia, e pode variar com idade, sexo, peso, raça, produção, região e manejo.'],
  ['De quanto em quanto tempo é preciso repor o MinerBlock?', 'A Minerthal indica reposição a cada 10 dias, o que reduz o gasto com mão de obra e combustível em comparação com o suplemento em pó no cocho.'],
  ['O MinerBlock precisa de cocho?', 'Não precisa de estrutura de cocho. Basta retirar o bloco da caixa e colocá-lo em uma superfície protegida. Como o local pode mudar, o produtor também consegue reduzir as áreas de rejeição do pasto.'],
  ['O MinerBlock precisa de adaptação dos animais?', 'O MinerBlock MD pode ser fornecido sem adaptação prévia, porque a dureza do bloco limita fisicamente o consumo.'],
];

const mbMain = `
<section class="p-hero" aria-labelledby="mb-h1">
  <div class="wrap">
    <div>
      ${crumbsHtml([['Início', './'], ['Ferramentas', './#ferramentas'], ['MinerBlock', '']])}
      <h1 id="mb-h1" style="--k:9.05"><span>MinerBlock:</span> <span>suplemento em bloco</span> <em>e calculadora</em></h1>
      <p class="lead">Linha de suplementos minerais em bloco da Minerthal, pronta para uso e oferecida à vontade no pasto. Calcule abaixo quantos blocos o seu lote precisa.</p>
      <div class="ctas">
        <a href="#calculadora" class="btn btn-lime">Calcular blocos</a>
        <a href="#versoes" class="btn btn-ghost">Ver as ${versoes.length} versões</a>
      </div>
      <dl class="p-stats">
        <div><dt>versões na linha</dt><dd class="count" data-target="${versoes.length}">${versoes.length}</dd></div>
        <div><dt>dias entre reposições</dt><dd class="count" data-target="10">10</dd></div>
        <div><dt>kg por bloco</dt><dd class="count" data-target="25">25</dd></div>
      </dl>
    </div>
    <div class="p-visual"><img src="assets/img/minerblock-955.webp" srcset="assets/img/minerblock-520.webp 520w, assets/img/minerblock-955.webp 955w" sizes="(max-width:1080px) 90vw, 480px" alt="Bloco MinerBlock sobre pastagem" width="955" height="562" fetchpriority="high"></div>
  </div>
</section>

<section aria-labelledby="prob-title">
  <div class="wrap">
    <span class="eyebrow">Por que bloco</span>
    <h2 id="prob-title">Três problemas da suplementação no dia a dia</h2>
    <p class="lead">A suplementação mineral dos bovinos costuma esbarrar nas mesmas dificuldades da fazenda. A linha MinerBlock foi desenvolvida para contornar essas três.</p>
    <ul class="cards3">
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18l-2 7H5Z"/><path d="M6 17v3M18 17v3"/></svg></div><h3>Falta de estrutura de cocho</h3><p>O bloco vai direto para uma superfície protegida, sem precisar de cocho.</p></li>
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20c4-6 14-6 18 0"/><path d="M12 4v8M9 7l3-3 3 3"/></svg></div><h3>Acesso difícil aos pastos</h3><p>Com reposição a cada 10 dias, a equipe vai menos vezes aos locais de fornecimento.</p></li>
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 17H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19 9.5a3.75 3.75 0 0 1-1.5 7.5Z"/><path d="M8 20v1M12 20v2M16 20v1"/></svg></div><h3>Chuva e vento</h3><p>Em bloco, as perdas por chuva e vento são menores e a ureia não se dissolve na água.</p></li>
    </ul>
  </div>
</section>

<section class="mbc" id="calculadora" aria-labelledby="calc-title">
  <div class="wrap">
    <span class="eyebrow">Calculadora MinerBlock</span>
    <h2 id="calc-title">Quantos blocos o seu lote precisa?</h2>
    <p class="lead">Escolha o tipo de bloco e informe o peso médio, o número de animais e a frequência de reposição.</p>
    <div class="calc">
      <form id="calc" class="calc-form" aria-label="Calculadora MinerBlock">
        <fieldset>
          <legend>Tipo de bloco</legend>
          <div class="tipos">
${TIPOS.map((t, i) => `            <label class="tipo"><input type="radio" name="tipo" value="${t.fator}" data-nome="${esc(t.nome)}"${i === 0 ? ' checked' : ''}><span><img src="assets/img/mb-caixa-${t.id}.webp" alt="" width="260" height="180" loading="lazy" decoding="async"><b>${esc(t.nome.replace('MinerBlock ', ''))}</b><small>${t.fator} g por 100 kg/dia</small></span></label>`).join('\n')}
          </div>
        </fieldset>
        <div class="campos">
          <div class="field"><label for="peso">Peso médio (kg)</label><input id="peso" name="peso" type="number" inputmode="numeric" min="30" max="1200" step="1" value="450" required></div>
          <div class="field"><label for="animais">Número de animais</label><input id="animais" name="animais" type="number" inputmode="numeric" min="1" max="100000" step="1" value="100" required></div>
          <div class="field"><label for="dias">Reposição a cada (dias)</label><input id="dias" name="dias" type="number" inputmode="numeric" min="1" max="60" step="1" value="10" required></div>
        </div>
      </form>
      <div class="calc-out" aria-live="polite">
        <p class="out-title">Resultado para <span id="out-nome">MinerBlock MD</span></p>
        <dl class="out-grid">
          <div class="big"><dt>blocos de 25 kg por reposição</dt><dd><span id="r-blocos" class="count" data-target="${ex.b}" data-format="pt">${ex.b}</span></dd></div>
          <div><dt>consumo por animal (g/dia)</dt><dd><span id="r-consumo" class="count" data-target="${ex.c}" data-format="pt">${ex.c}</span></dd></div>
          <div><dt>animais por bloco</dt><dd><span id="r-animais" class="count" data-target="${ex.a}" data-format="pt">${ex.a}</span></dd></div>
          <div><dt>kg de suplemento por reposição</dt><dd><span id="r-kg" class="count" data-target="${ex.kg}" data-format="pt">${ex.kg}</span></dd></div>
        </dl>
        <p class="out-note">Cálculo com a fórmula da Minerthal. O consumo real varia com idade, sexo, raça, produção, região e manejo. Para a recomendação da sua fazenda, <a href="${WHATS}" rel="noopener">fale com a equipe técnica</a>.</p>
        <a class="app-link" href="https://play.google.com/store/apps/details?id=br.com.harlockstudio.calculadoraminerblock&amp;hl=pt_BR" rel="noopener">Baixar a calculadora para Android</a>
      </div>
    </div>
  </div>
</section>

<section aria-labelledby="ben-title">
  <div class="wrap">
    <span class="eyebrow">Benefícios</span>
    <h2 id="ben-title">O que muda na fazenda e no rebanho</h2>
    <div class="ben">
      <div class="ben-col prod">
        <h3>Para o produtor</h3>
        <ul>
          <li>${check}<span><b>Reposição a cada 10 dias</b>Menos gasto com mão de obra e combustível.</span></li>
          <li>${check}<span><b>Fácil de usar e de transportar</b>Basta tirar o bloco da caixa e colocar numa superfície protegida. O formato retangular facilita o transporte.</span></li>
          <li>${check}<span><b>Local de fornecimento flexível</b>O bloco pode mudar de lugar no pasto, o que diminui as áreas de rejeição.</span></li>
          <li>${check}<span><b>Menos desperdício</b>Em bloco, as perdas por chuva e vento são menores.</span></li>
          <li>${check}<span><b>Mais produção</b>Mais leite nas vacas de cria e mais ganho de peso na recria e na engorda, com abate mais cedo.</span></li>
          <li>${check}<span><b>Mais lucro</b>Melhor desempenho reprodutivo e produtivo, com retorno do investimento e giro de capital maior.</span></li>
        </ul>
      </div>
      <div class="ben-col ani">
        <h3>Para o animal</h3>
        <ul>
          <li>${check}<span><b>Sabor atrativo</b>O melaço estimula o consumo.</span></li>
          <li>${check}<span><b>Consumo homogêneo</b>O bloco controla a ingestão e evita erros de consumo.</span></li>
          <li>${check}<span><b>Segurança contra intoxicação por ureia</b>Com chuva, a ureia não se dissolve na água, como acontece com o suplemento em pó.</span></li>
          <li>${check}<span><b>Saúde em dia</b>Minerais de qualidade em quantidade precisa para o equilíbrio do metabolismo.</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="ver" id="versoes" aria-labelledby="ver-title">
  <div class="wrap">
    <div class="head-row">
      <div>
        <span class="eyebrow">Linha MinerBlock</span>
        <h2 id="ver-title">As ${versoes.length} versões</h2>
        <p class="lead">Classificação por época do ano e rebanho do catálogo técnico da Minerthal.</p>
      </div>
      <a href="./#produtos" class="btn btn-navy">Ver o catálogo completo</a>
    </div>
    <ul class="catalog">
${versoes.map(([n, s, t]) => { const [ep, reb] = tagLabel(t); return `      <li><a href="https://www.minerthal.com.br/produtos/${s}/"><img src="assets/img/p/${s}.webp" srcset="assets/img/p/${s}-140.webp 140w, assets/img/p/${s}.webp 220w" sizes="(max-width:760px) 38vw, 160px" alt="" width="220" height="150" loading="lazy" decoding="async"><span><strong>${esc(n)}</strong><small>${ep} · ${reb}</small></span></a></li>`; }).join('\n')}
    </ul>
  </div>
</section>

<section class="mbv" aria-labelledby="vid-title">
  <div class="wrap">
    <div>
      <span class="eyebrow">Vídeo</span>
      <h2 id="vid-title">Conheça o MinerBlock</h2>
      <p class="lead">Vídeo da Minerthal sobre a linha MinerBlock, com 2 minutos.</p>
      <h3 class="press-title">O lançamento na imprensa</h3>
      <ul class="press-logos">
        <li><a href="http://www.portaldbo.com.br/Portal/Espaco-empresarial/Minerthal-lanca-linha-de-suplementos-em-bloco/20274" rel="noopener"><img src="assets/img/imprensa-1.webp" alt="Portal DBO" width="80" height="60" loading="lazy" decoding="async"></a></li>
        <li><a href="http://www.beefworld.com.br/noticia/minerthal-lanca-suplementos-em-bloco-para-bovinos-e-aplicativo-inedito" rel="noopener"><img src="assets/img/imprensa-2.webp" alt="Beefworld" width="301" height="60" loading="lazy" decoding="async"></a></li>
        <li><a href="http://www.abrafrigo.com.br/index.php/2017/04/13/minerthal-lanca-linha-de-suplementos-em-bloco-para-bovinos/" rel="noopener"><img src="assets/img/imprensa-3.webp" alt="Abrafrigo" width="84" height="60" loading="lazy" decoding="async"></a></li>
      </ul>
    </div>
    <div class="video" id="video">
      <button type="button" class="video-play" data-yt="NbnwroEihdU" aria-label="Assistir ao vídeo de apresentação do MinerBlock">
        <img src="assets/img/mb-video.webp" alt="" width="640" height="360" loading="lazy" decoding="async">
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
      </button>
    </div>
  </div>
</section>
${faqHtml(mbFaq, 'Sobre o MinerBlock')}`;

const mbCss = `
.mbc{background:var(--cream)}
.calc{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;margin-top:36px;align-items:start}
.calc-form{background:#fff;border-radius:24px;padding:28px;box-shadow:var(--shadow)}
.calc-form fieldset{border:0}
.calc-form legend,.field label{display:block;font-family:var(--display);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--navy);font-size:.95rem;margin-bottom:10px}
.tipos{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.tipo{position:relative;cursor:pointer}
.tipo input{position:absolute;opacity:0;width:1px;height:1px}
.tipo>span{display:flex;flex-direction:column;gap:4px;border:2px solid var(--sand);border-radius:16px;padding:10px;height:100%;transition:border-color .2s,background-color .2s}
.tipo img{width:100%;aspect-ratio:26/18}
.tipo b{font-family:var(--display);font-size:1.05rem;line-height:1.1;color:var(--navy);text-transform:uppercase}
.tipo small{color:var(--muted);font-size:.8rem;line-height:1.3}
.tipo input:checked+span{border-color:var(--navy);background:var(--sky-soft)}
.tipo input:focus-visible+span{outline:3px solid var(--lime);outline-offset:2px}
.campos{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}
.field input{width:100%;height:54px;border:1.5px solid var(--sand);border-radius:12px;padding:0 14px;font:inherit;font-size:1.2rem;font-weight:600;color:var(--ink);background:#fff}
.field input:focus{outline:3px solid var(--lime);outline-offset:1px;border-color:var(--navy)}
.field input:invalid{border-color:#b3261e}
.calc-out{background:var(--navy);color:#fff;border-radius:24px;padding:28px;position:sticky;top:100px}
.out-title{color:#c7d6eb;font-size:.95rem}
.out-title span{color:#fff;font-weight:700}
.out-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 18px}
.out-grid div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:16px;display:flex;flex-direction:column-reverse;justify-content:flex-end}
.out-grid .big{grid-column:1/-1;background:var(--lime);border-color:var(--lime);color:var(--navy)}
.out-grid dd{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1;font-variant-numeric:tabular-nums}
.out-grid .big dd{font-size:4rem}
.out-grid dt{font-size:.88rem;line-height:1.3;margin-top:6px;color:#d3def0}
.out-grid .big dt{color:var(--navy);font-weight:600}
.out-note{font-size:.88rem;color:#c7d6eb}
.out-note a{color:#fff}
.app-link{display:inline-block;margin-top:14px;font-weight:700;color:var(--lime);padding:6px 0}
.ben{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}
.ben-col{border-radius:24px;padding:30px;background:var(--cream)}
.ben-col h3{font-size:1.9rem;font-weight:800;margin-bottom:18px}
.ben-col.prod h3{color:var(--lime-dark)}
.ben-col.ani h3{color:#7a5a1e}
.ben-col ul{list-style:none;display:grid;gap:14px}
.ben-col li{display:flex;gap:12px;align-items:flex-start;line-height:1.45;color:var(--muted)}
.ben-col li svg{flex:none;width:22px;height:22px;color:var(--lime-dark);margin-top:2px}
.ben-col.ani li svg{color:#7a5a1e}
.ben-col b{display:block;color:var(--navy)}
.ver{background:var(--sky-soft)}
.ver .catalog{grid-template-columns:repeat(4,1fr)}
.mbv .wrap{display:grid;grid-template-columns:1fr 1.2fr;gap:50px;align-items:center}
.press-title{font-family:var(--display);font-size:1.1rem;letter-spacing:.08em;color:var(--navy);margin:28px 0 12px}
.press-logos{list-style:none;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.press-logos a{display:grid;place-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 18px;min-height:84px;transition:border-color .2s}
.press-logos a:hover{border-color:var(--navy)}
.press-logos img{height:48px;width:auto}
.video{border-radius:24px;overflow:hidden;aspect-ratio:16/9;background:#000;box-shadow:var(--shadow)}
.video-play{position:relative;display:block;width:100%;height:100%;border:0;padding:0;cursor:pointer;background:#000}
.video-play img{width:100%;height:100%;object-fit:cover;opacity:.85;transition:opacity .2s}
.video-play:hover img{opacity:1}
.play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:84px;height:84px;border-radius:50%;background:var(--lime);color:var(--navy);display:grid;place-items:center;box-shadow:0 12px 30px -8px rgba(0,0,0,.5)}
.play svg{width:38px;height:38px;margin-left:4px}
.video iframe{width:100%;height:100%;border:0;display:block}
@media (max-width:1080px){.calc,.mbv .wrap{grid-template-columns:1fr}.calc-out{position:static}.ver .catalog{grid-template-columns:repeat(3,1fr)}}
@media (max-width:760px){.tipos{grid-template-columns:1fr 1fr}.campos{grid-template-columns:1fr}.calc-form,.calc-out{padding:20px}.ben{grid-template-columns:1fr}.ben-col{padding:24px}.ver .catalog{grid-template-columns:1fr 1fr}.out-grid .big dd{font-size:3.2rem}}`;

const mbJs = `
  // calculadora (fórmula do hotsite oficial do MinerBlock)
  const form = document.getElementById('calc'), nome = document.getElementById('out-nome');
  const out = { blocos: document.getElementById('r-blocos'), consumo: document.getElementById('r-consumo'), animais: document.getElementById('r-animais'), kg: document.getElementById('r-kg') };
  const num = el => parseInt(String(el.dataset.target), 10) || 0;
  function run() {
    const d = new FormData(form), fator = +d.get('tipo'), peso = +d.get('peso'), n = +d.get('animais'), dias = +d.get('dias');
    nome.textContent = form.querySelector('input[name=tipo]:checked').dataset.nome;
    if (!(peso > 0 && n > 0 && dias > 0)) return;
    const consumo = Math.ceil((peso / 100) * fator);
    const blocos = Math.ceil(((consumo / 1000) * n * dias) / 25);
    const vals = { blocos, consumo, animais: Math.ceil(n / blocos), kg: Math.round((consumo * n * dias) / 1000) };
    for (const k in vals) { const el = out[k], from = num(el); el.dataset.target = vals[k]; if (from !== vals[k]) animateCount(el, from); }
  }
  let t; form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 250); });
  form.addEventListener('submit', e => { e.preventDefault(); run(); });

  // vídeo: o player do YouTube só carrega no clique
  const play = document.querySelector('.video-play');
  play.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + play.dataset.yt + '?autoplay=1&rel=0';
    f.title = 'Vídeo de apresentação do MinerBlock'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    play.replaceWith(f);
  });`;

await page({
  file: 'minerblock.html',
  title: 'MinerBlock: suplemento mineral em bloco e calculadora | Minerthal',
  desc: `Calcule quantos blocos de MinerBlock o seu rebanho precisa e conheça as ${versoes.length} versões da linha de suplementos em bloco da Minerthal, com reposição a cada 10 dias.`,
  canonical: 'https://www.minerthal.com.br/minerblock/',
  crumb: [['Início', 'https://www.minerthal.com.br/'], ['Ferramentas', 'https://www.minerthal.com.br/ferramentas/'], ['MinerBlock', 'https://www.minerthal.com.br/minerblock/']],
  ld: [
    { '@type': 'WebPage', url: 'https://www.minerthal.com.br/minerblock/', name: 'MinerBlock: suplemento mineral em bloco e calculadora', inLanguage: 'pt-BR', publisher: { '@id': 'https://www.minerthal.com.br/#org' } },
    { '@type': 'WebApplication', name: 'Calculadora MinerBlock', url: 'https://www.minerthal.com.br/minerblock/#calculadora', applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android', inLanguage: 'pt-BR', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }, publisher: { '@id': 'https://www.minerthal.com.br/#org' }, description: 'Calcula o consumo por animal, a quantidade de blocos de 25 kg e o número de animais por bloco a partir do tipo de MinerBlock, do peso médio, do tamanho do lote e da frequência de reposição.' },
    { '@type': 'ItemList', name: 'Linha MinerBlock', numberOfItems: versoes.length, itemListElement: versoes.map(([n, s], i) => ({ '@type': 'ListItem', position: i + 1, name: n, url: `https://www.minerthal.com.br/produtos/${s}/` })) },
    { '@type': 'VideoObject', name: 'Conheça o MinerBlock', description: 'Apresentação da linha MinerBlock de suplementos em bloco da Minerthal.', thumbnailUrl: 'https://i.ytimg.com/vi/NbnwroEihdU/hqdefault.jpg', embedUrl: 'https://www.youtube-nocookie.com/embed/NbnwroEihdU', uploadDate: '2017-10-27T04:41:02-07:00', duration: 'PT2M3S' },
    faqLd(mbFaq),
  ],
  extraCss: mbCss, main: mbMain, js: mbJs,
});

/* ================= CLICQ ================= */
const clFaq = [
  ['O que é o Clicq?', 'É um aplicativo que a Minerthal oferece aos clientes para conferir se os animais da fazenda estão sendo suplementados corretamente. Ele aponta desperdício de suplemento, organiza o serviço dos funcionários e acompanha o estoque.'],
  ['Quem pode usar o Clicq?', 'O Clicq é destinado aos clientes Minerthal. Para implementar na sua fazenda, fale com a equipe pelo WhatsApp (62) 99285-2649 ou pelo SAC 0800 63 4444.'],
  ['O Clicq funciona sem internet?', 'Sim. O sistema funciona mesmo offline e sincroniza as informações depois.'],
  ['Quem desenvolveu o Clicq?', 'O aplicativo é desenvolvido pela PariPassu para a Minerthal.'],
];
const clMain = `
<section class="p-hero" aria-labelledby="cl-h1">
  <div class="wrap">
    <div>
      ${crumbsHtml([['Início', './'], ['Ferramentas', './#ferramentas'], ['Clicq', '']])}
      <h1 id="cl-h1" style="--k:8.4"><span>Clicq: o suplemento</span> <em>chegou ao animal?</em></h1>
      <p class="lead">Aplicativo para clientes Minerthal. Com ele, a fazenda confere se os animais estão recebendo o suplemento, aponta desperdício no cocho e acompanha o estoque.</p>
      <div class="ctas">
        <a href="${WHATS}" class="btn btn-lime" rel="noopener">Quero implementar</a>
        <a href="#como-funciona" class="btn btn-ghost">Como funciona</a>
      </div>
    </div>
    <div class="p-visual phone">
      <svg viewBox="0 0 304 640" role="img" aria-labelledby="phone-t">
        <title id="phone-t">Celular com a tela inicial do aplicativo Clicq: check list de inspeção e controle de qualidade, desenvolvido pela PariPassu</title>
        <defs>
          <linearGradient id="ph-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9dce0"/><stop offset=".45" stop-color="#9aa0a8"/><stop offset=".55" stop-color="#b9bdc3"/><stop offset="1" stop-color="#7d838b"/></linearGradient>
          <linearGradient id="ph-glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <clipPath id="ph-screen"><rect x="9" y="9" width="282" height="622" rx="39"/></clipPath>
        </defs>
        <rect x="298" y="150" width="5" height="62" rx="2.5" fill="#8b9098"/>
        <rect x="298" y="232" width="5" height="40" rx="2.5" fill="#8b9098"/>
        <rect width="300" height="640" rx="48" fill="url(#ph-frame)"/>
        <rect x="4" y="4" width="292" height="632" rx="44" fill="#0a0b0d"/>
        <g clip-path="url(#ph-screen)">
          <rect x="9" y="9" width="282" height="622" fill="#2a9aca"/>
          <text x="36" y="38" fill="#fff" font-family="Barlow, Arial, sans-serif" font-size="14" font-weight="600">9:41</text>
          <g fill="#fff" transform="translate(222 26)">
            <rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/>
            <path d="M31 12.2a2 2 0 1 0 .01 0Zm-5.4-4.1a7.7 7.7 0 0 1 10.8 0l-1.6 1.6a5.4 5.4 0 0 0-7.6 0Zm-3.1-3.1a12 12 0 0 1 17 0l-1.6 1.6a9.7 9.7 0 0 0-13.8 0Z" transform="translate(0 -1)"/>
            <rect x="46" y="1" width="20" height="11" rx="3" fill="none" stroke="#fff" stroke-width="1.4" opacity=".9"/><rect x="48.2" y="3.2" width="13" height="6.6" rx="1.4"/><rect x="67" y="4.5" width="1.8" height="4" rx=".9" opacity=".9"/>
          </g>
          <image href="assets/img/clicq-logo.webp" x="40" y="214" width="220" height="184"/>
          <image href="assets/img/clicq-paripassu.webp" x="96" y="548" width="108" height="41"/>
          <rect x="112" y="612" width="76" height="4.5" rx="2.25" fill="#fff" opacity=".85"/>
          <rect x="9" y="9" width="282" height="622" fill="url(#ph-glare)"/>
        </g>
        <circle cx="150" cy="31" r="8.5" fill="#0a0b0d"/>
        <circle cx="152" cy="29" r="2.6" fill="#1c2738"/>
      </svg>
    </div>
  </div>
</section>

<section id="como-funciona" aria-labelledby="cf-title">
  <div class="wrap">
    <span class="eyebrow">Como funciona</span>
    <h2 id="cf-title">Feito para usar no campo</h2>
    <p class="lead">O Clicq foi pensado para a rotina de quem distribui e confere o suplemento no pasto.</p>
    <ul class="cards3">
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></div><h3>Sincroniza as informações</h3><p>Os registros feitos no campo ficam reunidos para a gestão da fazenda.</p></li>
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2.3-1.7M12 20h.01"/></svg></div><h3>Funciona offline</h3><p>O sistema funciona mesmo sem sinal de internet e sincroniza depois.</p></li>
      <li><div class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg></div><h3>Simples de usar</h3><p>Uso simples e intuitivo, pensado para a equipe da fazenda.</p></li>
    </ul>
  </div>
</section>

<section class="clb" aria-labelledby="clb-title">
  <div class="wrap">
    <div>
      <span class="eyebrow">Benefícios</span>
      <h2 id="clb-title">O que a fazenda ganha</h2>
      <ul class="cl-ben">
        <li>${check}<span><b>Detecta desperdício</b>Mostra onde o suplemento está sendo perdido.</span></li>
        <li>${check}<span><b>Organiza a equipe</b>Otimiza o serviço dos funcionários na distribuição e na conferência.</span></li>
        <li>${check}<span><b>Garante a suplementação correta</b>Confere se cada lote está recebendo o produto.</span></li>
        <li>${check}<span><b>Acompanha o estoque</b>Controle do suplemento disponível na fazenda.</span></li>
      </ul>
      <a href="${WHATS}" class="btn btn-navy" rel="noopener">Quero implementar o Clicq</a>
    </div>
    <a class="read" href="https://www.minerthal.com.br/noticias/blog/">
      <img src="assets/img/blog-suplementados.webp" alt="Bovinos no cocho" width="560" height="350" loading="lazy" decoding="async">
      <span class="read-body"><small>Leitura recomendada no blog</small><b>Você investiu no suplemento, mas os animais estão sendo suplementados?</b><span>Artigo da equipe técnica sobre as exigências de minerais, proteína e energia de cada categoria animal.</span></span>
    </a>
  </div>
</section>

<section class="cart" aria-labelledby="cart-title">
  <div class="wrap">
    <span class="eyebrow">Material gratuito</span>
    <h2 id="cart-title">Cartilha de boas práticas de suplementação</h2>
    <p class="lead">A Minerthal reuniu as técnicas que garantem que o suplemento chegue ao animal, com dicas práticas para cinco etapas.</p>
    <ol class="steps">
      <li><b>Recebimento e descarga</b></li>
      <li><b>Armazenamento</b></li>
      <li><b>Distribuição nos cochos</b></li>
      <li><b>Estrutura dos cochos</b></li>
      <li><b>Inspeção dos cochos</b></li>
    </ol>
    <a href="https://www.minerthal.com.br/ferramentas/" class="btn btn-lime">Baixar a cartilha</a>
  </div>
</section>
${faqHtml(clFaq, 'Sobre o Clicq')}`;

const clCss = `
.p-visual.phone{width:260px;max-width:100%;justify-self:center}
.p-visual.phone svg{display:block;width:100%;height:auto;aspect-ratio:304/640;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45));transform:rotate(-4deg)}
.clb{background:var(--cream)}
.clb .wrap{display:grid;grid-template-columns:1.1fr 1fr;gap:50px;align-items:center}
.cl-ben{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:26px 0 30px}
.cl-ben li{display:flex;gap:12px;background:#fff;border:1px solid var(--sand);border-radius:16px;padding:18px;line-height:1.45;color:var(--muted)}
.cl-ben svg{flex:none;width:22px;height:22px;color:var(--lime-dark);margin-top:2px}
.cl-ben b{display:block;color:var(--navy)}
.read{display:block;background:#fff;border-radius:24px;overflow:hidden;text-decoration:none;box-shadow:var(--shadow);transition:transform .25s}
.read:hover{transform:translateY(-4px)}
.read img{width:100%;aspect-ratio:16/10;object-fit:cover}
.read-body{display:flex;flex-direction:column;gap:6px;padding:22px}
.read-body small{font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--lime-dark)}
.read-body b{font-size:1.25rem;line-height:1.3;color:var(--navy)}
.read-body span{color:var(--muted)}
.cart{background:var(--navy);color:#fff}
.cart h2{color:#fff}
.cart .lead{color:#d0dcee}
.cart .eyebrow{color:#b5d0f0}
.steps{list-style:none;counter-reset:s;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:34px 0}
.steps li{counter-increment:s;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:20px 18px}
.steps li::before{content:counter(s,decimal-leading-zero);display:block;font-family:var(--display);font-weight:800;font-size:2rem;color:var(--lime);line-height:1;margin-bottom:10px}
.steps b{font-weight:600;line-height:1.35;display:block}
@media (max-width:1080px){.clb .wrap{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}}
@media (max-width:760px){.cl-ben{grid-template-columns:1fr}.p-visual.phone{width:200px}}`;

await page({
  file: 'clicq.html',
  title: 'Clicq: aplicativo para conferir a suplementação na fazenda | Minerthal',
  desc: 'O Clicq é o aplicativo da Minerthal para clientes conferirem se os animais estão sendo suplementados, apontar desperdício no cocho e acompanhar o estoque, inclusive offline.',
  canonical: 'https://www.minerthal.com.br/ferramentas/',
  crumb: [['Início', 'https://www.minerthal.com.br/'], ['Ferramentas', 'https://www.minerthal.com.br/ferramentas/'], ['Clicq', 'https://jgdini.github.io/minerthal/clicq.html']],
  ld: [
    { '@type': 'WebPage', name: 'Clicq: aplicativo para conferir a suplementação na fazenda', inLanguage: 'pt-BR', publisher: { '@id': 'https://www.minerthal.com.br/#org' } },
    { '@type': 'SoftwareApplication', name: 'Clicq', applicationCategory: 'BusinessApplication', inLanguage: 'pt-BR', description: 'Aplicativo para clientes Minerthal que confere a suplementação dos animais, aponta desperdício de suplemento e controla o estoque, inclusive offline.', creator: { '@type': 'Organization', name: 'PariPassu' }, provider: { '@id': 'https://www.minerthal.com.br/#org' } },
    faqLd(clFaq),
  ],
  extraCss: clCss, main: clMain, js: '',
});
