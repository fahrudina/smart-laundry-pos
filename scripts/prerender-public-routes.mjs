// Generates static dist/<route>/index.html copies of the built SPA shell for
// public routes other than "/", each with its own <title>/description/canonical
// (and no homepage-only JSON-LD). The SPA rewrite in vercel.json otherwise
// serves the exact same index.html for every route, so a crawler that doesn't
// execute JS (many AI/answer-engine bots) would see the homepage's title,
// description, canonical, and FAQPage schema on /login and /install too -
// telling Google those routes are duplicates of "/" and misrepresenting what's
// on those pages to answer engines. React still hydrates and renders normally
// client-side; only the pre-hydration HTML in <head> differs per route.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, '..', 'dist');
const SITE_URL = 'https://pos.fahrudina.my.id';

const ROUTES = [
  {
    path: '/login',
    title: 'Login - Smart Laundry POS',
    description:
      'Masuk atau daftar sebagai pemilik toko laundry di Smart Laundry POS. Gratis dipakai, tanpa kartu kredit, siap pakai dalam 5 menit.',
  },
  {
    path: '/install',
    title: 'Cara Install Aplikasi Smart Laundry POS - Android, iOS, Desktop',
    description:
      'Panduan instal Smart Laundry POS sebagai aplikasi (PWA) di Android, iOS, Windows, dan Mac. Akses offline dan tampilan seperti aplikasi native langsung dari layar utama.',
  },
];

const stripJsonLd = (html) =>
  html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/, '\n');

const setTagContent = (html, regex, replacement) => {
  if (!regex.test(html)) throw new Error(`Expected tag not found: ${regex}`);
  return html.replace(regex, replacement);
};

const buildRouteHtml = (baseHtml, route) => {
  const canonical = `${SITE_URL}${route.path}`;
  let html = baseHtml;
  html = setTagContent(html, /<title>.*?<\/title>/, `<title>${route.title}</title>`);
  html = setTagContent(
    html,
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`
  );
  html = setTagContent(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = setTagContent(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${route.title}" />`);
  html = setTagContent(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = setTagContent(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = setTagContent(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${route.title}" />`);
  html = setTagContent(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${route.description}" />`
  );
  html = stripJsonLd(html);
  return html;
};

const baseHtml = await readFile(join(DIST, 'index.html'), 'utf8');

for (const route of ROUTES) {
  const outDir = join(DIST, route.path.slice(1));
  await mkdir(outDir, { recursive: true });
  const html = buildRouteHtml(baseHtml, route);
  await writeFile(join(outDir, 'index.html'), html, 'utf8');
  console.log(`Prerendered ${route.path} -> dist${route.path}/index.html`);
}
