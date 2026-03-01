import { writeFile } from 'node:fs/promises';

const BASE = 'https://webcamera24.com';
const COUNTRIES = ['usa', 'united-kingdom', 'france', 'germany', 'japan', 'australia'];
const MAX_PER_COUNTRY = 8;

const COUNTRY_FALLBACK = {
  usa: { lat: 39.8283, lng: -98.5795 },
  'united-kingdom': { lat: 54.5, lng: -3.0 },
  france: { lat: 46.2276, lng: 2.2137 },
  germany: { lat: 51.1657, lng: 10.4515 },
  japan: { lat: 36.2048, lng: 138.2529 },
  australia: { lat: -25.2744, lng: 133.7751 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, userAgent = 'Mozilla/5.0') {
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const geoCache = new Map();

async function geocode(query) {
  if (!query) return null;
  const key = query.trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  try {
    const txt = await fetchText(url.toString(), 'madama-webcamera24-mvp/1.0');
    const arr = JSON.parse(txt);
    const out = arr?.[0]
      ? { lat: Number.parseFloat(arr[0].lat), lng: Number.parseFloat(arr[0].lon) }
      : null;
    geoCache.set(key, out);
    await sleep(220);
    return out;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

function extractCards(html) {
  const rx = /<a class="WebcamItemBlockView-module-sass-module__zbeElG__linkArea[^>]*title="([^"]+)" href="([^"]+)"[^>]*>[\s\S]*?<div class="WebcamItemBlockView-module-sass-module__zbeElG__locationText">([^<]+)<\/div>/g;
  const cards = [];
  let m;
  while ((m = rx.exec(html)) !== null) {
    cards.push({ title: m[1], href: m[2], locationText: m[3] });
  }
  return cards;
}

function extractEmbedUrl(html) {
  const m1 = html.match(/src="(https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[^"]+)"/);
  if (m1) return m1[1];
  const m2 = html.match(/https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/);
  return m2 ? `https://www.youtube-nocookie.com/embed/${m2[1]}` : undefined;
}

function extractThumbnail(html) {
  const m = html.match(/property="og:image" content="([^"]+)"/);
  return m?.[1];
}

async function main() {
  const items = [];

  for (const country of COUNTRIES) {
    const countryUrl = `${BASE}/countries/${country}/`;
    const html = await fetchText(countryUrl);
    const cards = extractCards(html).slice(0, MAX_PER_COUNTRY);

    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      const pageUrl = new URL(card.href, BASE).toString();

      let camHtml = '';
      try {
        camHtml = await fetchText(pageUrl);
      } catch {
        continue;
      }

      const embedUrl = extractEmbedUrl(camHtml);
      const thumbnail = extractThumbnail(camHtml);

      let coords = await geocode(`${card.title}, ${card.locationText}`);
      if (!coords) coords = await geocode(card.locationText);
      if (!coords) coords = COUNTRY_FALLBACK[country] ?? { lat: 0, lng: 0 };

      items.push({
        id: `wc24-${country}-${i}`,
        name: card.title,
        lat: coords.lat,
        lng: coords.lng,
        pageUrl,
        thumbnail,
        embedUrl,
        locationText: card.locationText,
        source: 'webcamera24',
      });

      await sleep(120);
    }
  }

  await writeFile(new URL('../public/webcamera24-mvp.json', import.meta.url), JSON.stringify(items, null, 2));
  console.log(`Generated ${items.length} cameras`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
