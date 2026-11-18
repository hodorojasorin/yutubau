#!/usr/bin/env node
// Laptopul ca server: pornește site-ul local și „poșta” dintre laptop și telefoane
// (telecomanda și quiz-ul).
//
//   În VS Code: Terminal → New Terminal, apoi   npm start   (sau: node server.js)
//
// Apoi deschizi pe laptop http://localhost:8000/colocviu.html (sau altă prezentare).
// Codul QR din telecomandă și din quiz arată adresa laptopului în rețea,
// așa că telefoanele trebuie să fie în aceeași rețea Wi-Fi (sau pe hotspotul tău).
// Nu are nevoie de internet și nici de pachete instalate: doar Node.js.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = +process.env.PORT || 8000;
const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// adresele laptopului în rețeaua locală: întâi Wi-Fi / Ethernet (en0, en1…, wlan, eth),
// apoi hotspotul de pe Mac (bridge), la urmă restul; fără VPN și mașini virtuale
function lanIPs() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    if (/^(utun|tun|tap|vmnet|vboxnet|docker|br-|veth|llw|awdl|lo)/i.test(name)) continue;
    for (const i of list || []) {
      if ((i.family === "IPv4" || i.family === 4) && !i.internal && !i.address.startsWith("169.254.")) out.push({ name, ip: i.address });
    }
  }
  const rank = (x) => (/^(en|wlan|wl|eth|wi-?fi|ethernet)/i.test(x.name) ? 0 : /^bridge/i.test(x.name) ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b)).map((x) => x.ip);
}

// ---------- poșta: cine ascultă ce subiect ----------
const subs = new Map(); // subiect → Set(răspunsuri SSE)
function listen(req, res, topics) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 1500\n: salut\n\n");
  for (const t of topics) {
    if (!subs.has(t)) subs.set(t, new Set());
    subs.get(t).add(res);
  }
  const beat = setInterval(() => res.write(": ping\n\n"), 15000);
  req.on("close", () => {
    clearInterval(beat);
    for (const t of topics) {
      const s = subs.get(t);
      if (!s) continue;
      s.delete(res);
      if (!s.size) subs.delete(t);
    }
  });
}
function post(req, res, topic) {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (c) => {
    body += c;
    if (body.length > 65536) req.destroy();
  });
  req.on("end", () => {
    const line = "data: " + JSON.stringify({ t: topic, m: body }) + "\n\n";
    for (const r of subs.get(topic) || []) r.write(line);
    res.writeHead(204, { "Cache-Control": "no-store" });
    res.end();
  });
}

// ---------- fișierele site-ului ----------
function serve(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch (e) {
    rel = pathname;
  }
  let file = path.normalize(path.join(ROOT, rel));
  // nimic în afara folderului și nimic ascuns (.git, .DS_Store…)
  if ((file !== ROOT && !file.startsWith(ROOT + path.sep)) || /(^|[\\/])\./.test(path.relative(ROOT, file))) {
    res.writeHead(403);
    return res.end("403");
  }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, "index.html");
    fs.stat(file, (err2, st2) => {
      if (err2 || !st2.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("404 · nu există " + rel);
      }
      const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
      const head = { "Content-Type": type, "Cache-Control": "no-store" };
      // audio/video: suport pentru Range, ca să meargă derularea
      const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
      if (range) {
        const size = st2.size;
        const start = range[1] ? +range[1] : 0;
        const end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
        head["Content-Range"] = `bytes ${start}-${end}/${size}`;
        head["Accept-Ranges"] = "bytes";
        head["Content-Length"] = end - start + 1;
        res.writeHead(206, head);
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      head["Content-Length"] = st2.size;
      res.writeHead(200, head);
      fs.createReadStream(file).pipe(res);
    });
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/bus/info") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ ok: true, ips: lanIPs(), port: PORT }));
  }
  if (u.pathname === "/bus/s") {
    const topics = u.searchParams.getAll("t").filter(Boolean).slice(0, 8);
    return listen(req, res, topics);
  }
  if (u.pathname === "/bus/p" && req.method === "POST") return post(req, res, u.searchParams.get("t") || "");
  serve(req, res, u.pathname);
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error(`\nPortul ${PORT} e ocupat. Încearcă:  PORT=8080 node server.js\n`);
  else console.error(e);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  const ips = lanIPs();
  const pages = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html") && !/^(index|remote|quiz)\.html$/.test(f))
    .sort();
  console.log("\n  ✦ Serverul de pe laptop e pornit\n");
  console.log(`  Acasă:  http://localhost:${PORT}/`);
  console.log("  Prezentări (Cmd + click):");
  for (const f of pages) console.log(`    http://localhost:${PORT}/${f}`);
  if (ips.length) console.log(`\n  Telefoanele intră pe:  http://${ips[0]}:${PORT}/  (codul QR o face singur)`);
  else console.log("\n  ⚠ Laptopul nu e conectat la nicio rețea: telefoanele nu-l vor găsi.");
  if (ips.length > 1) console.log(`  Alte adrese ale laptopului: ${ips.slice(1).join(", ")}`);
  console.log("\n  Telefoanele trebuie să fie în aceeași rețea Wi-Fi ca laptopul (sau pe hotspotul tău).");
  console.log("  Oprești serverul cu Ctrl+C.\n");
});
