const http = require("http");
const fs   = require("fs");
const path = require("path");

const RESULTS_FILE = path.join(__dirname, "results.txt");
const PORT = 3000;

if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, "", "utf8");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer((req, res) => {
  cors(res);

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "GET" && req.url === "/results") {
    const data = fs.readFileSync(RESULTS_FILE, "utf8");
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(data);
    return;
  }

  if (req.method === "POST" && req.url === "/results") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const entry = JSON.parse(body);
        fs.appendFileSync(RESULTS_FILE, JSON.stringify(entry) + "\n", "utf8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === "DELETE" && req.url === "/results") {
    fs.writeFileSync(RESULTS_FILE, "", "utf8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`✅  Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄  Resultados salvos em: ${RESULTS_FILE}`);
});
