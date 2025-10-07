const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4200;
const host = '0.0.0.0';
const publicDir = path.join(__dirname, 'public');

function sendFile(res, filePath, contentType, statusCode = 200) {
  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(statusCode, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    stream.pipe(res);
  });
  stream.on('error', (err) => {
    if (err.code === 'ENOENT') return send404(res);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  });
}

function send404(res) {
  const notFoundPath = path.join(publicDir, '404.html');
  fs.access(notFoundPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    sendFile(res, notFoundPath, 'text/html; charset=utf-8', 404);
  });
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let safePath = path.normalize(urlPath).replace(/^([.][.][/\\])+/, '');

    if (safePath === '/' || safePath === '') safePath = '/index.html';

    const requestedPath = path.join(publicDir, safePath);
    const ext = path.extname(safePath).toLowerCase();

    fs.stat(requestedPath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        const idx = path.join(requestedPath, 'index.html');
        fs.access(idx, fs.constants.F_OK, (e) => {
          if (e) return send404(res);
          sendFile(res, idx, 'text/html; charset=utf-8');
        });
        return;
      }
      if (!err && stats.isFile()) {
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        return sendFile(res, requestedPath, contentType);
      }

      if (!ext) {
        const idx = path.join(publicDir, 'index.html');
        return sendFile(res, idx, 'text/html; charset=utf-8');
      }
      return send404(res);
    });
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
