# Plantão — jornal pessoal de tecnologia do Luiz

Projeto pessoal (não é da Ziul). Agregador de manchetes: dev, IA, segurança, lançamentos e fontes do Brasil.

- `src/fontes.mjs`: lista de fontes, categorias e palavras-chave (inclui `MINHA_STACK`, que dá o selo "sua stack").
- `src/coletar.mjs`: baixa e normaliza RSS/Atom, Hacker News (Algolia), CISA KEV e GitHub Advisories. Fonte que falha não derruba o build.
- `src/build.mjs`: gera `dist/index.html` (notícias embutidas) e `dist/noticias.json`.
- `web/index.html`: página única, sem framework. "Novo" = publicado depois da última visita (localStorage).
- `.github/workflows/atualizar.yml`: roda a cada 15 min e publica no GitHub Pages.

Rodar local: `npm run dev` (build + servidor em http://localhost:4321).
Fonte nova: acrescentar em `FONTES`, rodar `npm run build` e conferir se aparece "ok" no log.
