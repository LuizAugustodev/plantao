// Servidor local mínimo pra ver o dist/ (npm run serve).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml" };
const porta = Number(process.env.PORT) || 4321;

createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (caminho.endsWith("/")) caminho += "index.html";
  const arq = normalize(join(dist, caminho));
  if (!arq.startsWith(dist)) { res.writeHead(403).end(); return; }
  try {
    const corpo = await readFile(arq);
    res.writeHead(200, { "content-type": tipos[extname(arq)] ?? "application/octet-stream", "cache-control": "no-store" }).end(corpo);
  } catch { res.writeHead(404).end("404"); }
}).listen(porta, () => console.log(`Plantão em http://localhost:${porta}`));
