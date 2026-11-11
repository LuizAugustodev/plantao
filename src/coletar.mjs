// Busca todas as fontes e devolve a lista de notícias normalizada.
import { XMLParser } from "fast-xml-parser";
import { FONTES, PALAVRAS_SEG, PALAVRAS_IA, MINHA_STACK } from "./fontes.mjs";

const UA = "Plantao/1.0 (leitor pessoal de noticias; +https://github.com)";
const DIAS = { lanc: 45, padrao: 5 }; // janela de notícias por categoria
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", processEntities: true, htmlEntities: true });

async function baixar(url, tipo = "text", headers = {}) {
  const r = await fetch(url, {
    headers: { "user-agent": UA, accept: "*/*", ...headers },
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return tipo === "json" ? r.json() : r.text();
}

const texto = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return texto(v[0]);
  return texto(v["#text"] ?? v["@_href"] ?? "");
};

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»", copy: "©", reg: "®", trade: "™", ordm: "º", ordf: "ª", deg: "°" };
// á é í ó ú, ã õ, â ê ô, à, ç, ü (e maiúsculas)
const ACENTO = { acute: "́", tilde: "̃", circ: "̂", grave: "̀", cedil: "̧", uml: "̈" };
const LETRAS = { acute: "aeiou", tilde: "aon", circ: "aeo", grave: "a", cedil: "c", uml: "u" };
for (const [sufixo, letras] of Object.entries(LETRAS))
  for (const l of letras) {
    ENT[l + sufixo] = (l + ACENTO[sufixo]).normalize("NFC");
    ENT[l.toUpperCase() + sufixo] = (l.toUpperCase() + ACENTO[sufixo]).normalize("NFC");
  }
const decodificar = (s) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e] ?? ENT[e.toLowerCase()] ?? m;
  });
function limpar(html, max = 360) {
  // decodifica antes e depois de tirar as tags: alguns feeds mandam o HTML codificado duas vezes
  let s = decodificar(texto(html))
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  s = decodificar(s)
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  return s;
}

function linkAtom(link) {
  if (!link) return "";
  if (typeof link === "string") return link;
  const arr = Array.isArray(link) ? link : [link];
  const alt = arr.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? arr[0];
  return alt["@_href"] ?? texto(alt);
}

// Imagem do item: media:content, media:thumbnail, enclosure ou o primeiro <img> do conteúdo.
function imagemDoItem(i) {
  const lista = (v) => (v == null ? [] : [].concat(v));
  const candidatos = [
    ...lista(i["media:content"]).filter((m) => !m["@_medium"] || m["@_medium"] === "image" || /^image\//.test(m["@_type"] ?? "") || /\.(jpe?g|png|webp|gif|avif)/i.test(m["@_url"] ?? "")).map((m) => m["@_url"]),
    ...lista(i["media:group"]).flatMap((g) => lista(g["media:content"]).map((m) => m["@_url"])),
    ...lista(i["media:thumbnail"]).map((m) => m["@_url"]),
    ...lista(i.enclosure).filter((e) => /^image\//.test(e["@_type"] ?? "")).map((e) => e["@_url"]),
    ...lista(i.link).filter((l) => typeof l === "object" && l["@_rel"] === "enclosure" && /^image\//.test(l["@_type"] ?? "")).map((l) => l["@_href"]),
  ];
  for (const campo of [i["content:encoded"], i.content, i.description, i.summary]) {
    const m = decodificar(texto(campo)).match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) candidatos.push(m[1]);
  }
  const url = candidatos.find((u) => typeof u === "string" && /^https?:\/\//.test(u) && !/(pixel|feedburner|gravatar|emoji|1x1|spacer|badge|icon|logo|avatar|favicon|sprite)/i.test(u));
  return url ? decodificar(url) : "";
}

function lerFeed(xml) {
  const d = parser.parse(xml);
  if (d.rss?.channel) {
    const itens = [].concat(d.rss.channel.item ?? []);
    return itens.map((i) => ({
      titulo: limpar(i.title, 300),
      url: texto(i.link) || texto(i.guid),
      data: texto(i.pubDate) || texto(i["dc:date"]),
      resumo: limpar(i.description ?? i["content:encoded"]),
      img: imagemDoItem(i),
    }));
  }
  if (d.feed) {
    const itens = [].concat(d.feed.entry ?? []);
    return itens.map((i) => ({
      titulo: limpar(i.title, 300),
      url: linkAtom(i.link),
      data: texto(i.published) || texto(i.updated),
      resumo: limpar(i.summary ?? i.content),
      img: imagemDoItem(i),
    }));
  }
  const rdf = d["rdf:RDF"];
  if (rdf) {
    return [].concat(rdf.item ?? []).map((i) => ({
      titulo: limpar(i.title, 300),
      url: texto(i.link),
      data: texto(i["dc:date"]),
      resumo: limpar(i.description),
      img: imagemDoItem(i),
    }));
  }
  throw new Error("formato de feed desconhecido");
}

async function coletarFonte(f) {
  switch (f.tipo) {
    case "feed": {
      let itens = lerFeed(await baixar(f.url));
      if (f.soEstavel) itens = itens.filter((i) => !/(alpha|beta|rc|canary|nightly|pre)[\.\d-]*/i.test(i.titulo));
      return itens;
    }
    case "hn": {
      const j = await baixar("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40", "json");
      return j.hits.map((h) => ({
        titulo: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        data: new Date(h.created_at_i * 1000).toISOString(),
        extra: { pontos: h.points, comentarios: h.num_comments, discussao: `https://news.ycombinator.com/item?id=${h.objectID}` },
      }));
    }
    case "kev": {
      const j = await baixar("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", "json");
      return j.vulnerabilities
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
        .map((v) => ({
          titulo: `${v.cveID} · ${v.vendorProject} ${v.product}: ${v.vulnerabilityName}`,
          url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
          data: `${v.dateAdded}T12:00:00Z`,
          resumo: limpar(v.shortDescription),
          extra: { selo: "explorada", ransomware: v.knownRansomwareCampaignUse === "Known" },
        }));
    }
    case "ghsa": {
      const headers = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
      if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const out = [];
      for (const sev of ["critical", "high"]) {
        const j = await baixar(`https://api.github.com/advisories?type=reviewed&severity=${sev}&per_page=40&sort=published&direction=desc`, "json", headers);
        for (const a of j) {
          const pac = (a.vulnerabilities ?? []).map((v) => v.package && `${v.package.ecosystem}/${v.package.name}`).filter(Boolean);
          const unicos = [...new Set(pac)].slice(0, 2).join(", ");
          out.push({
            titulo: `${unicos ? `[${unicos}] ` : ""}${a.summary}`,
            url: a.html_url,
            data: a.published_at,
            resumo: a.cve_id ? `${a.cve_id} · severidade ${sev === "critical" ? "crítica" : "alta"}` : `severidade ${sev === "critical" ? "crítica" : "alta"}`,
            extra: { selo: sev === "critical" ? "crítica" : "alta" },
          });
        }
      }
      return out.sort((a, b) => b.data.localeCompare(a.data));
    }
  }
  throw new Error(`tipo desconhecido: ${f.tipo}`);
}

function categorizar(f, n) {
  const alvo = `${n.titulo} ${n.resumo ?? ""}`;
  let cat = f.cat;
  if (cat === "dev" && PALAVRAS_SEG.test(alvo)) cat = "seg";
  else if (cat === "dev" && PALAVRAS_IA.test(n.titulo)) cat = "ia";
  return cat;
}

export async function coletar() {
  const resultados = await Promise.allSettled(FONTES.map((f) => coletarFonte(f)));
  const noticias = [];
  const status = [];
  const vistos = new Set();

  resultados.forEach((r, idx) => {
    const f = FONTES[idx];
    if (r.status === "rejected") {
      status.push({ id: f.id, nome: f.nome, ok: false, erro: String(r.reason?.message ?? r.reason) });
      return;
    }
    let n = 0;
    const limite = Date.now() - (DIAS[f.cat] ?? DIAS.padrao) * 864e5;
    for (const it of r.value) {
      if (n >= f.max) break;
      const t = Date.parse(it.data);
      if (!it.titulo || !it.url || Number.isNaN(t) || t < limite || t > Date.now() + 36e5) continue;
      try { it.url = new URL(it.url, f.url ?? undefined).href; } catch { continue; }
      const chave = it.url.replace(/[?#].*$/, "").replace(/\/$/, "");
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const cat = categorizar(f, it);
      const stack = cat === "seg" && MINHA_STACK.test(`${it.titulo} ${it.resumo ?? ""}`);
      noticias.push({
        id: `${f.id}:${chave}`.slice(0, 200),
        t: new Date(t).toISOString(),
        titulo: it.titulo,
        url: it.url,
        resumo: it.resumo || "",
        img: it.img || "",
        fonte: f.nome,
        fid: f.id,
        cat,
        lingua: f.lingua,
        ...(stack ? { stack: true } : {}),
        ...(it.extra ? { extra: it.extra } : {}),
      });
      n++;
    }
    status.push({ id: f.id, nome: f.nome, ok: true, itens: n });
  });

  noticias.sort((a, b) => b.t.localeCompare(a.t));
  return { geradoEm: new Date().toISOString(), noticias, fontes: status };
}
