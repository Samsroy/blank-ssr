const fs = require('fs');
const path = require('path');

const projectRoot = __dirname ? path.join(__dirname, '..') : process.cwd();
const publicDir = path.join(projectRoot, 'public');
const distDir = path.join(projectRoot, 'dist');
const routesConfigPath = path.join(projectRoot, 'routes.config.json');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanDir(p) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
  ensureDir(p);
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function routeToOutPath(route) {
  const clean = route === '/' ? '' : route.replace(/^\//, '');
  return path.join(distDir, clean, 'index.html');
}

function normalizeRoute(route) {
  if (!route || typeof route !== 'string') return '/';
  if (!route.startsWith('/')) return '/' + route;
  return route;
}

function loadRoutes() {
  if (!fs.existsSync(routesConfigPath)) return ['/'];
  try {
    const cfg = JSON.parse(fs.readFileSync(routesConfigPath, 'utf8'));
    const routes = Array.isArray(cfg.routes) ? cfg.routes : ['/'];
    return routes.map(normalizeRoute);
  } catch (e) {
    console.warn('Failed to read routes.config.json, defaulting to ["/"]');
    return ['/'];
  }
}

function main() {
  if (!fs.existsSync(publicDir)) {
    console.error('Missing public directory at', publicDir);
    process.exit(1);
  }

  const routes = loadRoutes();
  cleanDir(distDir);
  copyDir(publicDir, distDir);

  const templatePath = path.join(publicDir, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  for (const route of routes) {
    const outPath = routeToOutPath(route);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, template, 'utf8');
    console.log('Prerendered', route, '->', path.relative(projectRoot, outPath));
  }

  console.log('Prerender complete. Output:', path.relative(projectRoot, distDir));
}

main();
