// Gera dist/index.html (com as notícias embutidas) e dist/noticias.json.
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { coletar } from "./coletar.mjs";
import { enriquecer } from "./enriquecer.mjs";
import { fileURLToPath } from "node:url";
import { CATEGORIAS } from "./fontes.mjs";

const raiz = new URL("..", import.meta.url);
const dist = new URL("dist/", raiz);

const dados = await coletar();
await enriquecer(dados, fileURLToPath(new URL("noticias.json", dist)));
dados.categorias = CATEGORIAS;

await mkdir(dist, { recursive: true });
const json = JSON.stringify(dados);
const modelo = await readFile(new URL("web/index.html", raiz), "utf8");
// "<" vira < pra nenhum título fechar a tag <script> por acidente.
const html = modelo.replace("/*__DADOS__*/null", json.replace(/</g, "\\u003c"));
await writeFile(new URL("index.html", dist), html);
await writeFile(new URL("noticias.json", dist), json);
for (const f of ["favicon.svg", "_headers", "og-image.png"]) await copyFile(new URL(`web/${f}`, raiz), new URL(f, dist));

const falhas = dados.fontes.filter((f) => !f.ok);
console.log(`${dados.noticias.length} notícias de ${dados.fontes.length - falhas.length}/${dados.fontes.length} fontes`);
for (const f of dados.fontes) console.log(`  ${f.ok ? "ok " : "ERRO"} ${f.nome}${f.ok ? ` (${f.itens})` : `: ${f.erro}`}`);
