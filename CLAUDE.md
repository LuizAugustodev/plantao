# Plantão — jornal pessoal de tecnologia do Luiz

Projeto pessoal (não é da Ziul). Agregador de manchetes: dev, IA, segurança, lançamentos e fontes do Brasil.

- `src/fontes.mjs`: lista de fontes, categorias e palavras-chave (inclui `MINHA_STACK`, que dá o selo "sua stack").
- `src/coletar.mjs`: baixa e normaliza RSS/Atom, Hacker News (Algolia), CISA KEV e GitHub Advisories. Fonte que falha não derruba o build.
- `src/build.mjs`: gera `dist/index.html` (notícias embutidas) e `dist/noticias.json`.
- `src/enriquecer.mjs`: pega og:image e og:description da página quando o feed não traz; guarda em cache pela rodada anterior.
- `web/index.html`: página única, sem framework, formato revista (manchete + destaques + grade de cards). Fotos reduzidas pelo wsrv.nl. "Novo" = publicado depois da última visita (localStorage).
- `web/fonts/`: Newsreader e IBM Plex Mono servidas localmente (sem Google Fonts). `docs/og-image.html` é a fonte da `web/og-image.png` (comando no topo do arquivo).
- Promoção/guia de compra (`PROMOCAO` em `src/fontes.mjs`) nunca entra; Tecnoblog e Canaltech só entram se forem de tecnologia.
- `.github/workflows/atualizar.yml`: roda a cada 15 min e publica no GitHub Pages.

Rodar local: `npm run dev` (build + servidor em http://localhost:4321).
Fonte nova: acrescentar em `FONTES`, rodar `npm run build` e conferir se aparece "ok" no log.
