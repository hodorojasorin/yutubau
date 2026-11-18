#!/usr/bin/env node
// Laptopul ca server: pornește site-ul local și „poșta” dintre laptop și telefoane
// (telecomanda și quiz-ul).
//
//   În VS Code: Terminal → New Terminal, apoi
//     npm start        → telefoanele din aceeași rețea Wi-Fi ca laptopul (fără internet)
//     npm run online   → telefoane din orice rețea (Wi-Fi, date mobile): laptopul primește
//                        o adresă https://…trycloudflare.com printr-un tunel Cloudflare
//                        (o dată: brew install cloudflared)
//
// Apoi deschizi pe laptop http://localhost:8000/colocviu.html (sau altă prezentare).
// Codul QR din telecomandă și din quiz arată singur adresa potrivită.
// Toată logica și toate fișierele rămân pe laptop; tunelul doar transmite mai departe.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = +process.env.PORT || 8000;
const ONLINE = process.argv.includes("--online") || !!process.env.ONLINE;
// tunelul: "off" (doar rețeaua locală), "starting", "up", "error"
let tunnel = { state: process.env.PUBLIC_URL ? "up" : ONLINE ? "starting" : "off", url: process.env.PUBLIC_URL || null, why: "" };
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
    "Cache-Control": "no-store, no-transform",
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
    return res.end(JSON.stringify({ ok: true, ips: lanIPs(), port: PORT, tunnel: tunnel.state, public: tunnel.url }));
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

// ---------- tunelul Cloudflare (npm run online) ----------
function startTunnel() {
  const { spawn } = require("child_process");
  let p;
  try {
    p = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://localhost:${PORT}`], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return tunnelFail("nu găsesc cloudflared");
  }
  const seen = (d) => {
    const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d));
    if (m && tunnel.state !== "up") {
      tunnel = { state: "up", url: m[0], why: "" };
      console.log(`\n  🌍 Online, din orice rețea:  ${m[0]}`);
      console.log("     (codul QR din telecomandă și din quiz folosește acum adresa asta)\n");
    }
  };
  p.stdout.on("data", seen);
  p.stderr.on("data", seen);
  p.on("error", (e) => tunnelFail(e.code === "ENOENT" ? "nu găsesc cloudflared" : e.message));
  p.on("exit", (code) => {
    if (tunnel.state === "up") console.log("\n  ⚠ Tunelul s-a oprit. Telefoanele din alte rețele nu mai ajung la laptop.\n");
    if (tunnel.state !== "error") tunnelFail("tunelul s-a oprit (cod " + code + ")");
  });
  const stop = () => {
    try {
      p.kill();
    } catch (e) {}
  };
  process.on("exit", stop);
  process.on("SIGINT", () => {
    stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    stop();
    process.exit(0);
  });
  setTimeout(() => {
    if (tunnel.state === "starting") console.log("  … tunelul încă pornește (dacă durează mult, rețeaua îl blochează: încearcă pe hotspot)");
  }, 20000);
}
function tunnelFail(why) {
  tunnel = { state: "error", url: null, why };
  if (/cloudflared/.test(why)) {
    console.log("\n  ⚠ Pentru „npm run online” ai nevoie de cloudflared (o singură dată):");
    console.log("      brew install cloudflared");
    console.log("    Până atunci merge doar în aceeași rețea Wi-Fi ca laptopul.\n");
  } else console.log(`\n  ⚠ Tunelul nu merge: ${why}. Merge doar în aceeași rețea Wi-Fi ca laptopul.\n`);
}

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
  if (ONLINE && !process.env.PUBLIC_URL) {
    console.log("\n  🌍 Pornesc tunelul pentru telefoanele din alte rețele…");
    startTunnel();
  } else if (tunnel.url) console.log(`\n  🌍 Online:  ${tunnel.url}`);
  else {
    console.log("\n  Telefoanele trebuie să fie în aceeași rețea Wi-Fi ca laptopul (sau pe hotspotul tău).");
    console.log("  Pentru telefoane din orice rețea (date mobile): npm run online");
  }
  console.log("  Oprești serverul cu Ctrl+C.\n");
});
