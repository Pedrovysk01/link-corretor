// Servidor local sem dependencias. Mantem suporte a busca nos videos (HTTP Range).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.join(__dirname, 'site');
const portArg = process.argv.find(a => a.startsWith('--port='));
const port = Number(portArg ? portArg.slice(7) : 5190);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Porta invalida. Exemplo: node servidor.cjs --port=5191');
  process.exit(1);
}
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8'
};
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const rel = path.relative(root, filename);
    if (rel.startsWith('..') || path.isAbsolute(rel) || pathname.includes('\0')) {
      res.writeHead(403).end();
      return;
    }
  } catch {
    res.writeHead(400).end();
    return;
  }
  let stat;
  try {
    stat = await fs.promises.stat(filename);
    if (!stat.isFile()) throw new Error('not-file');
  } catch {
    res.writeHead(404).end('Arquivo nao encontrado');
    return;
  }
  const headers = {
    'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes'
  };
  let start = 0, end = stat.size - 1, status = 200;
  if (req.headers.range && req.method === 'GET') {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (match && (match[1] || match[2])) {
      start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    } else start = -1;
    if (start < 0 || start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
      res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` }).end();
      return;
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = Math.max(0, end - start + 1);
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || stat.size === 0) { res.end(); return; }
  const stream = fs.createReadStream(filename, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});
server.on('error', err => {
  console.error(err.code === 'EADDRINUSE'
    ? `A porta ${port} esta ocupada. Feche o outro servidor ou execute: node servidor.cjs --port=5191 --open`
    : `Falha ao iniciar: ${err.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/index.html`;
  console.log(`Villa Montemerano\n${url}\nMantenha esta janela aberta. Para encerrar, pressione Ctrl+C.`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' });
    child.on('error', () => console.log('Abra o endereco acima no navegador.'));
  }
});
