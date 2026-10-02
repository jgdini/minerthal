# Scripts

As páginas internas reaproveitam o cabeçalho, o rodapé e o CSS do `index.html`. Depois de editar a home, gere as páginas de novo:

```bash
node scripts/gen-resulthal.mjs
node scripts/gen-pages.mjs
node scripts/check.cjs
```

- `gen-resulthal.mjs`: gera `resulthal.html` a partir de `resulthal.json` (61 edições extraídas de minerthal.com.br/historias).
- `gen-pages.mjs`: gera `minerblock.html` e `clicq.html`.
- `check.cjs`: valida a sintaxe dos scripts e do JSON-LD das quatro páginas.