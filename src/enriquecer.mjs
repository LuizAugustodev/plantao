// Completa imagem e resumo das notícias que vieram sem: lê og:image / og:description da página.
// Reaproveita o que já foi buscado na rodada anterior (cache), pra só ir na página de notícia nova.
import { readFile } from "node:fs/promises";

const UA = "Mozilla/5.0 (compatible; Plantao/1.0; leitor pessoal de noticias)";
const SEM_PAGINA = new Set(["kev", "ghsa"]); // avisos de segurança: card só de texto
const CONCORRENCIA = 10;

async function carregarAnterior(arquivoLocal) {
  try { return JSON.parse(await readFile(arquivoLocal, "utf8")); } catch {}
  if (process.env.PLANTAO_ANTERIOR) {
    try {
      const r = await fetch(process.env.PLANTAO_ANTERIOR, { signal: AbortSignal.timeout(15000) });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

const decod = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function meta(html, nomes) {
  for (const nome of nomes) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${nome}["']`, "i");
    const m = html.match(re1) ?? html.match(re2);
    if (m) return decod(m[1]).trim();
  }
  return "";
}

// Ícone, logo ou cartão genérico (ex.: o print automático de release do GitHub) não serve de foto.
const imagemRuim = (u) => /(icon|logo|avatar|favicon|sprite|default-og|placeholder|opengraph\.githubassets\.com)/i.test(u);

async function lerPagina(url) {
  const r = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return {};
  // só o começo da página: as metas ficam no <head>
  const leitor = r.body.getReader();
  let html = ""; const dec = new TextDecoder();
  while (html.length < 250_000) {
    const { done, value } = await leitor.read();
    if (done) break;
    html += dec.decode(value, { stream: true });
    if (/<\/head>/i.test(html)) break;
  }
  leitor.cancel().catch(() => {});
  let img = meta(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
  if (img) { try { img = new URL(img, r.url).href; } catch { img = ""; } }
  const resumo = meta(html, ["og:description", "description", "twitter:description"]);
  return { img: /^https?:/.test(img) && !imagemRuim(img) ? img : "", resumo };
}

export async function enriquecer(dados, arquivoAnterior) {
  const anterior = await carregarAnterior(arquivoAnterior);
  const cache = new Map((anterior?.noticias ?? []).map((n) => [n.id, n]));
  const fila = [];
  for (const n of dados.noticias) {
    const velho = cache.get(n.id);
    if (velho) {
      if (!n.img && velho.img) n.img = velho.img;
      if (!n.resumo && velho.resumo) n.resumo = velho.resumo;
      if (velho.enriquecido) n.enriquecido = true;
    }
    if (!n.enriquecido && (!n.img || !n.resumo) && !SEM_PAGINA.has(n.fid)) fila.push(n);
  }
  let feitos = 0;
  await Promise.all(Array.from({ length: CONCORRENCIA }, async () => {
    while (fila.length) {
      const n = fila.shift();
      try {
        const p = await lerPagina(n.url);
        if (!n.img && p.img) n.img = p.img;
        if (!n.resumo && p.resumo) n.resumo = p.resumo.length > 360 ? p.resumo.slice(0, 360).replace(/\s+\S*$/, "") + "…" : p.resumo;
      } catch {}
      n.enriquecido = true; // tentou uma vez; não tenta de novo a cada rodada
      feitos++;
    }
  }));
  for (const n of dados.noticias) if (n.img && imagemRuim(n.img)) n.img = ""; // vale pro cache também
  const comImg = dados.noticias.filter((n) => n.img).length;
  console.log(`páginas lidas: ${feitos} · com imagem: ${comImg}/${dados.noticias.length}`);
}
