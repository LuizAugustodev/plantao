// Fontes do Plantão. cat = categoria padrão (as palavras-chave podem mudar pra "seg" ou "ia").
// janela de dias: lanc fica 45 dias no ar, o resto 5.
// tipo: "feed" (RSS/Atom), "hn" (Hacker News via Algolia), "kev" (CISA KEV), "ghsa" (GitHub Advisories)
// lingua: "pt" ou "en". max = quantos itens no máximo por fonte.

export const CATEGORIAS = {
  ia: "IA",
  seg: "Segurança",
  dev: "Dev",
  lanc: "Lançamentos",
  br: "Brasil",
};

export const FONTES = [
  // Geral dev
  { id: "hn", nome: "Hacker News", tipo: "hn", cat: "dev", lingua: "en", max: 25, soTema: true }, // soTema: só entra se o título for de tecnologia
  { id: "lobsters", nome: "Lobsters", tipo: "feed", url: "https://lobste.rs/rss", cat: "dev", lingua: "en", max: 15 },
  { id: "github-blog", nome: "GitHub Blog", tipo: "feed", url: "https://github.blog/feed/", cat: "dev", lingua: "en", max: 10 },
  { id: "cloudflare", nome: "Cloudflare Blog", tipo: "feed", url: "https://blog.cloudflare.com/rss/", cat: "dev", lingua: "en", max: 8 },
  { id: "infoq", nome: "InfoQ", tipo: "feed", url: "https://feed.infoq.com/", cat: "dev", lingua: "en", max: 10 },
  { id: "tecnoblog", nome: "Tecnoblog", tipo: "feed", url: "https://tecnoblog.net/feed/", cat: "br", lingua: "pt", max: 12 },
  { id: "canaltech", nome: "Canaltech", tipo: "feed", url: "https://canaltech.com.br/rss/", cat: "br", lingua: "pt", max: 8 },

  // IA
  { id: "openai", nome: "OpenAI", tipo: "feed", url: "https://openai.com/news/rss.xml", cat: "ia", lingua: "en", max: 8 },
  { id: "google-ai", nome: "Google AI", tipo: "feed", url: "https://blog.google/technology/ai/rss/", cat: "ia", lingua: "en", max: 8 },
  { id: "huggingface", nome: "Hugging Face", tipo: "feed", url: "https://huggingface.co/blog/feed.xml", cat: "ia", lingua: "en", max: 8 },
  { id: "simonw", nome: "Simon Willison", tipo: "feed", url: "https://simonwillison.net/atom/entries/", cat: "ia", lingua: "en", max: 8 },

  // Segurança
  { id: "thn", nome: "The Hacker News", tipo: "feed", url: "https://feeds.feedburner.com/TheHackersNews", cat: "seg", lingua: "en", max: 15 },
  { id: "bleeping", nome: "BleepingComputer", tipo: "feed", url: "https://www.bleepingcomputer.com/feed/", cat: "seg", lingua: "en", max: 15 },
  { id: "krebs", nome: "Krebs on Security", tipo: "feed", url: "https://krebsonsecurity.com/feed/", cat: "seg", lingua: "en", max: 5 },
  { id: "cisoadvisor", nome: "CISO Advisor", tipo: "feed", url: "https://www.cisoadvisor.com.br/feed/", cat: "seg", lingua: "pt", max: 12 },
  { id: "kev", nome: "CISA · falhas exploradas", tipo: "kev", cat: "seg", lingua: "en", max: 12 },
  { id: "ghsa", nome: "GitHub Advisories", tipo: "ghsa", cat: "seg", lingua: "en", max: 25 },

  // Lançamentos (releases das ferramentas do dia a dia)
  { id: "rel-node", nome: "Node.js", tipo: "feed", url: "https://nodejs.org/en/feed/blog.xml", cat: "lanc", lingua: "en", max: 5 },
  { id: "rel-python", nome: "Python Insider", tipo: "feed", url: "https://blog.python.org/feeds/posts/default", cat: "lanc", lingua: "en", max: 5 },
  { id: "rel-php", nome: "PHP", tipo: "feed", url: "https://www.php.net/releases/feed.php", cat: "lanc", lingua: "en", max: 5 },
  { id: "rel-postgres", nome: "PostgreSQL", tipo: "feed", url: "https://www.postgresql.org/news.rss", cat: "lanc", lingua: "en", max: 5 },
  { id: "rel-react", nome: "React", tipo: "feed", url: "https://react.dev/rss.xml", cat: "lanc", lingua: "en", max: 4 },
  { id: "rel-vite", nome: "Vite", tipo: "feed", url: "https://github.com/vitejs/vite/releases.atom", cat: "lanc", lingua: "en", max: 4, soEstavel: true },
  { id: "rel-fastapi", nome: "FastAPI", tipo: "feed", url: "https://github.com/fastapi/fastapi/releases.atom", cat: "lanc", lingua: "en", max: 4, soEstavel: true },
  { id: "rel-godot", nome: "Godot", tipo: "feed", url: "https://godotengine.org/rss.xml", cat: "lanc", lingua: "en", max: 4 },
  { id: "rel-ts", nome: "TypeScript", tipo: "feed", url: "https://devblogs.microsoft.com/typescript/feed/", cat: "lanc", lingua: "en", max: 4 },
];

// Palavras que puxam a notícia pra outra categoria.
export const PALAVRAS_SEG = /\b(cve-\d|vulnerab|exploit|ransomware|malware|zero-day|0-day|breach|leak|vazament|vazou|falha (de|crítica)|ataque hacker|phishing|backdoor|patch tuesday|supply.chain)/i;
export const PALAVRAS_IA = /\b(ia|ai|llms?|gpt|claude|gemini|openai|anthropic|chatgpt|copilot|deepseek|mistral|llama|agente de ia|inteligência artificial|machine learning|transformer)\b/i;

// A stack do Luiz: notícia de segurança que cita isso ganha o selo "sua stack".
export const MINHA_STACK = /\b(php|wordpress|laravel|composer|npm|node\.?js|react|vite|next\.?js|python|pip|pypi|fastapi|django|postgres(ql)?|supabase|godot|cloudflare|github actions)\b/i;

// Fontes gerais (soTema) só aproveitam o que bate com segurança, IA ou isto aqui.
export const PALAVRAS_DEV = /(\b(code|coding|coder|programm\w*|developer\w*|software|open[ -]?source|github|gitlab|git|linux|kernel|unix|\w*bsd|compil\w+|rust|python|javascript|typescript|node(js)?|deno|bun|golang|java|kotlin|swift|zig|haskell|elixir|erlang|ruby|php|ocaml|lisp|clojure|scala|sql|postgres\w*|sqlite|mysql|database\w*|api|apis|framework\w*|librar\w+|cli|terminal|shell|bash|vim|neovim|emacs|editor|ide|vs ?code|browser\w*|chrome|chromium|firefox|webkit|html|css|wasm|webassembly|http\w*|dns|tcp|udp|ipv[46]|server\w*|serverless|cloud|aws|azure|gcp|docker|kubernetes|k8s|devops|deploy\w*|algorithm\w*|data structures?|performance|latency|cach\w+|memory|cpu|gpu|cuda|llvm|frontend|backend|react|vue|svelte|nextjs|android|ios|macos|windows|apple|microsoft|google|mozilla|cloudflare|nvidia|amd|intel|arm|risc-?v|chip\w*|semiconductor\w*|show hn|ask hn|launch hn|hack\w*|driver\w*|glitch\w*|cryptograph\w*|encrypt\w*|protocol\w*|saas|tech|computer\w*|computing|robot\w*|engineer\w*|bug\w*|refactor\w*|regex|json|yaml|markdown|unicode|emulat\w+|virtual machine|vm|os|operating system|firmware|hardware|raspberry pi|arduino|fpga|quantum|startup\w*|app|apps|web|website\w*|internet|network\w*|router\w*|wi-?fi|bluetooth|usb|sdk|cpu\w*)\b|c\+\+|c#|\.net\b)/i;
