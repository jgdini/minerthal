# Scripts

## Páginas internas

As páginas internas reaproveitam o cabeçalho, o rodapé e o CSS do `index.html`. Depois de editar a home, gere as páginas de novo:

```bash
npm run paginas
```

- `gen-resulthal.mjs`: gera `resulthal.html` a partir de `resulthal.json` (61 edições extraídas de minerthal.com.br/historias).
- `gen-pages.mjs`: gera `minerblock.html` e `clicq.html`.
- `check.cjs`: valida a sintaxe dos scripts e do JSON-LD das quatro páginas.

## Bloco Mídias (YouTube, Instagram e LinkedIn)

`update-midias.mjs` preenche o bloco entre `<!--MIDIAS:START-->` e `<!--MIDIAS:END-->` no `index.html`, guarda os dados em `assets/data/midias.json` e salva as imagens em `assets/img/midias/`. As imagens ficam no site porque os links do Instagram e do LinkedIn expiram.

A GitHub Action `.github/workflows/update-midias.yml` roda às 07h e às 19h (horário de Brasília) e só faz commit quando há novidade. Para rodar na hora: aba **Actions** > **Atualizar mídias** > **Run workflow**. Para rodar no computador:

```bash
npm install
npm run midias
```

| Rede | Como busca | Precisa configurar? |
|---|---|---|
| YouTube | Página de vídeos do canal @minerthalprodutosagropecuarios | Não |
| LinkedIn | Página pública da empresa, sem login | Não. Se o LinkedIn bloquear o acesso do GitHub, os 5 posts atuais continuam no ar |
| Instagram | API oficial com token; sem token, tenta o perfil público | Sim, para atualizar sozinho. O Instagram bloqueia o acesso sem token (erro 429) |

Se uma rede falhar, os itens anteriores continuam no site. O bloco nunca fica vazio.

### Fixar um vídeo do YouTube

Coloque o ID do vídeo em `FIXADOS_YOUTUBE`, no topo de `update-midias.mjs`. Ex.: `['EjHiYEOUJIA']`. Vídeos fixados entram primeiro e a rotina nunca os troca.

### Token do Instagram

A conta @minerthal precisa ser profissional (Empresa ou Criador de conteúdo).

1. Em [developers.facebook.com](https://developers.facebook.com/), crie um app do tipo **Empresa** e adicione o produto **Instagram** > **API com login do Instagram**.
2. Em **Gerar tokens de acesso**, adicione a conta @minerthal e gere o token. Ele vale 60 dias.
3. No GitHub: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**, com o nome `IG_ACCESS_TOKEN` e o token como valor.
4. Rode a Action **Atualizar mídias** uma vez para confirmar. O log deve mostrar `instagram ok`.

O token precisa ser renovado a cada 60 dias. Para renovar, abra
`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN_ATUAL`
e troque o valor do secret pelo token novo.
