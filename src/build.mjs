// Gera dist/index.html (com as notícias embutidas) e dist/noticias.json.
import { readFile, writeFile, mkdir, copyFile, readdir } from "node:fs/promises";
import { coletar } from "./coletar.mjs";
import { enriquecer } from "./enriquecer.mjs";
import { fileURLToPath } from "node:url";
import { CATEGORIAS } from "./fontes.mjs";

const raiz = new URL("..", import.meta.url);
const dist = new URL("dist/", raiz);

const dados = await coletar();
await enriquecer(dados, fileURLToPath(new URL("noticias.json", dist)));
dados.categorias = CATEGORIAS;

// Resumo que se repete em 2+ notícias da mesma fonte é texto padrão do site
// ("Node.js® is a free, open-source…", "There is a new PHP release in town!"): sai.
const vezes = new Map();
for (const n of dados.noticias) if (n.resumo) { const k = `${n.fid}|${n.resumo}`; vezes.set(k, (vezes.get(k) ?? 0) + 1); }
for (const n of dados.noticias) if (n.resumo && vezes.get(`${n.fid}|${n.resumo}`) > 1) n.resumo = "";

await mkdir(dist, { recursive: true });
const json = JSON.stringify(dados);
const modelo = await readFile(new URL("web/index.html", raiz), "utf8");
// "<" vira < pra nenhum título fechar a tag <script> por acidente.
const html = modelo.replace("/*__DADOS__*/null", json.replace(/</g, "\\u003c"));
await writeFile(new URL("index.html", dist), html);
await writeFile(new URL("noticias.json", dist), json);
for (const f of ["favicon.svg", "_headers", "og-image.png"]) await copyFile(new URL(`web/${f}`, raiz), new URL(f, dist));
await mkdir(new URL("fonts/", dist), { recursive: true });
for (const f of await readdir(new URL("web/fonts/", raiz))) await copyFile(new URL(`web/fonts/${f}`, raiz), new URL(`fonts/${f}`, dist));

const falhas = dados.fontes.filter((f) => !f.ok);
console.log(`${dados.noticias.length} notícias de ${dados.fontes.length - falhas.length}/${dados.fontes.length} fontes`);
for (const f of dados.fontes) console.log(`  ${f.ok ? "ok " : "ERRO"} ${f.nome}${f.ok ? ` (${f.itens})` : `: ${f.erro}`}`);
