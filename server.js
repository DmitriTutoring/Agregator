import express from 'express';
import Parser from 'rss-parser';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('./.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* .env is optional */ }

const app = express();
const port = process.env.PORT || 3000;
const refreshIntervalMs = 60 * 60 * 1000;
const weatherApiKey = process.env.WEATHERAPI_KEY || '';
const weatherCache = new Map();
const weatherCacheTtlMs = 30 * 60 * 1000;

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['media:group', 'mediaGroup', { keepArray: true }]
    ]
  }
});

const FEEDS = [
  {
    name: 'RMF24 · Białystok',
    sourceGroup: 'rmf24',
    url: 'https://www.rmf24.pl/regiony/bialystok/feed',
    weight: 5,
    region: 'podlasie'
  },
  {
    name: 'RMF24 · Polska',
    sourceGroup: 'rmf24',
    url: 'https://www.rmf24.pl/fakty/polska/feed',
    weight: 3,
    region: 'polska'
  },
  {
    name: 'RMF24 · Świat',
    sourceGroup: 'rmf24',
    url: 'https://www.rmf24.pl/fakty/swiat/feed',
    weight: 2,
    region: 'swiat'
  },
  {
    name: 'PAP MediaRoom',
    sourceGroup: 'pap',
    url: 'https://pap-mediaroom.pl/rss.xml',
    weight: 3,
    region: 'polska'
  },
  {
    name: 'Interia Wydarzenia',
    sourceGroup: 'interia',
    url: 'https://wydarzenia.interia.pl/feed',
    weight: 2,
    region: 'polska'
  },
  {
    name: 'Polsat News',
    sourceGroup: 'polsat',
    url: 'https://www.polsatnews.pl/rss/',
    weight: 2,
    region: 'polska'
  },
  {
    name: 'Białystok — oficjalny portal miasta', sourceGroup: 'bialystok-pl',
    url: 'https://www.bialystok.pl/rss/index/feed/id.2', weight: 4, region: 'bialystok'
  },
  {
    name: 'Wyborcza Białystok', sourceGroup: 'wyborcza',
    url: 'https://bialystok.wyborcza.pl/pub/rss/bialystok.xml', weight: 4, region: 'bialystok'
  },
  {
    name: 'TVN24 — Polska', sourceGroup: 'tvn24',
    url: 'https://tvn24.pl/polska.xml', weight: 3, region: 'polska'
  },
  {
    name: 'OKO.press', sourceGroup: 'oko',
    url: 'https://oko.press/feed', weight: 2, region: 'polska'
  },
  {
    name: 'BBC News — Świat', sourceGroup: 'bbc',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml', weight: 2, region: 'swiat'
  },
  {
    name: 'The Guardian — World', sourceGroup: 'guardian',
    url: 'https://www.theguardian.com/world/rss', weight: 2, region: 'swiat'
  },
  {
    name: 'RMF24 — Nauka', sourceGroup: 'rmf24-nauka',
    url: 'https://www.rmf24.pl/nauka/feed', weight: 2, region: 'nauka', category: 'nauka'
  },
  {
    name: 'Nauka w Polsce (PAP)', sourceGroup: 'science-in-poland',
    url: 'https://scienceinpoland.pap.pl/all/rss.xml', weight: 3, region: 'nauka', category: 'nauka'
  },
  {
    name: 'RMF24 — Sport', sourceGroup: 'rmf24-sport',
    url: 'https://www.rmf24.pl/sport/feed', weight: 2, region: 'sport', category: 'sport'
  },
  {
    name: 'BBC News — Technology', sourceGroup: 'bbc-technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', weight: 2, region: 'technologia', category: 'technologia'
  },
  {
    name: 'The Guardian — Technology', sourceGroup: 'guardian-technology',
    url: 'https://www.theguardian.com/technology/rss', weight: 2, region: 'technologia', category: 'technologia'
  },
  {
    name: 'RMF24 — Kultura', sourceGroup: 'rmf24-kultura',
    url: 'https://www.rmf24.pl/kultura/feed', weight: 2, region: 'kultura', category: 'kultura'
  },
  {
    name: 'PAP MediaRoom — Ludzie i kultura', sourceGroup: 'pap-kultura',
    url: 'https://pap-mediaroom.pl/kategoria/ludzie-i-kultura/rss.xml', weight: 1, region: 'kultura', category: 'kultura'
  },
  {
    name: 'Nauka w Polsce — Zdrowie', sourceGroup: 'science-in-poland-health',
    url: 'https://scienceinpoland.pap.pl/zdrowie/rss.xml', weight: 2, region: 'zdrowie', category: 'zdrowie'
  },
  {
    name: 'BBC News — Health', sourceGroup: 'bbc-health',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml', weight: 2, region: 'zdrowie', category: 'zdrowie'
  },
];

function decodeHtml(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstUrl(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstUrl(entry);
      if (found) return found;
    }
  }
  if (typeof value === 'object') {
    return value.$?.url || value.url || value.href || value['@_url'] || null;
  }
  return null;
}

function extractImage(item) {
  const candidates = [
    item.enclosure?.url,
    firstUrl(item.mediaContent),
    firstUrl(item.mediaThumbnail),
    firstUrl(item.mediaGroup),
    item.image?.url
  ].filter(Boolean);

  if (candidates[0]) return candidates[0];

  // Google News often places a thumbnail inside the RSS description.
  const html = item.contentSnippet || item.content || item.description || '';
  const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imageMatch?.[1] || null;
}

function sourceName(item, fallback) {
  if (typeof item.source === 'string') return item.source;
  if (item.source?.name) return item.source.name;
  return fallback;
}

async function fetchPageImage(url) {
  if (!url) return null;
  try {
    let response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        accept: 'text/html,application/xhtml+xml'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;

    let pageUrl = response.url || url;
    let html = await response.text();
    if (/consent\.google\.com/i.test(pageUrl)) {
      const formMatch = html.match(/<form[^>]+action=["']([^"']*\/save[^"']*)["'][^>]*>([\s\S]*?)<\/form>/i);
      if (formMatch) {
        const fields = {};
        for (const input of formMatch[2].matchAll(/<input\b[^>]*>/gi)) {
          const name = input[0].match(/\bname=["']([^"']+)["']/i)?.[1];
          const value = input[0].match(/\bvalue=["']([^"']*)["']/i)?.[1] || '';
          if (name) fields[name] = value;
        }
        const consentResponse = await fetch(formMatch[1], {
          method: 'POST',
          headers: {
            'user-agent': 'Mozilla/5.0',
            'content-type': 'application/x-www-form-urlencoded',
            ...(consentCookie ? { cookie: consentCookie } : {})
          },
          body: new URLSearchParams(fields),
          redirect: 'follow',
          signal: AbortSignal.timeout(8000)
        });
        if (consentResponse.ok && !/consent\.google\.com/i.test(consentResponse.url)) {
          pageUrl = consentResponse.url || url;
          html = await consentResponse.text();
        }
      }
    }

    const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
    const metaImage = metaTags
      .map((tag) => {
        const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
        const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
        return ['og:image', 'twitter:image', 'twitter:image:src'].includes(property) ? content : null;
      })
      .find(Boolean);
    if (metaImage) return new URL(metaImage, pageUrl).href;

    const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    for (const tag of imageTags) {
      const source = tag.match(/(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i)?.[1]
        || tag.match(/srcset=["']([^"']+)["']/i)?.[1]?.split(',')[0]?.trim()?.split(/\s+/)[0];
      if (!source || /^(data:|blob:|javascript:)/i.test(source)) continue;
      const lower = source.toLowerCase();
      if (/logo|icon|avatar|emoji|sprite|tracking|pixel/.test(lower)) continue;
      const width = Number.parseInt(tag.match(/width=["'](\d+)/i)?.[1] || '0', 10);
      const height = Number.parseInt(tag.match(/height=["'](\d+)/i)?.[1] || '0', 10);
      if ((width && width < 160) || (height && height < 120)) continue;
      return new URL(source, pageUrl).href;
    }
  } catch {
    return null;
  }
  return null;
}


function articleRegion(item, feed) {
  if (feed.region !== 'podlasie') return feed.region;
  const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.description || ''}`.toLowerCase();
  return /bialystok|bialymstok|bialostoc|stolicy podlasia/.test(text) ? 'bialystok' : 'podlasie';
}

const REGION_WEIGHTS = {
  bialystok: 5, podlasie: 4, polska: 3, swiat: 2,
  nauka: 3, sport: 3, technologia: 3, kultura: 3, zdrowie: 3
};
function normalize(item, feed) {
  const title = decodeHtml(item.title || '').replace(/\s*[-|] [^-|]+$/, '').trim() || 'Bez tytułu';
  const description = decodeHtml(item.contentSnippet || item.content || item.description || '');
  const region = articleRegion(item, feed);

  return {
    title,
    description,
    image: extractImage(item),
    source: sourceName(item, feed.name),
    sourceGroup: feed.sourceGroup || feed.name,
    sourceId: feed.sourceGroup || feed.name,
    url: item.link,
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    region,
    category: feed.category || null,
    weight: REGION_WEIGHTS[region] || feed.weight,
    publisherUrl: item.source?.url || null
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectBalanced(items, limit, maxPerSource = 2) {
  const selected = [];
  const counts = new Map();

  for (const item of items) {
    const source = item.sourceGroup || item.source || 'unknown';
    const count = counts.get(source) || 0;
    if (count >= maxPerSource) continue;
    selected.push(item);
    counts.set(source, count + 1);
    if (selected.length === limit) return selected;
  }

  if (selected.length < limit) {
    for (const item of items) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length === limit) break;
    }
  }

  return selected;
}

const STORY_STOP_WORDS = new Set(['the', 'and', 'dla', 'jest', 'czy', 'jak', 'co', 'na', 'w', 'z', 'do', 'po', 'o', 'i', 'a', 'się', 'nie', 'to', 'że', 'kto', 'ma', 'nowy', 'nowa', 'nowe']);

function storyTokens(title = '') {
  return new Set(title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ąęćłńóśźż ]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STORY_STOP_WORDS.has(token)));
}

function tokenSimilarity(left, right) {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  const smaller = Math.min(left.size, right.size);
  return union ? Math.max(intersection / union, smaller ? intersection / smaller : 0) : 0;
}

function topStories(items, limit = 5) {
  const clusters = [];
  const ordered = [...items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  for (const item of ordered) {
    const tokens = storyTokens(item.title);
    const cluster = clusters.find((candidate) => tokenSimilarity(tokens, candidate.tokens) >= 0.65);
    if (cluster) {
      cluster.items.push(item);
      cluster.tokens = new Set([...cluster.tokens, ...tokens]);
    } else {
      clusters.push({ items: [item], tokens });
    }
  }

  const stories = clusters.map((cluster) => {
    const sources = [...new Set(cluster.items.map((item) => item.source))];
    const representative = [...cluster.items].sort((a, b) => {
      const imageDiff = Number(Boolean(b.image)) - Number(Boolean(a.image));
      return imageDiff || (new Date(b.publishedAt) - new Date(a.publishedAt));
    })[0];
    const latest = cluster.items.reduce((latestItem, item) =>
      new Date(item.publishedAt) > new Date(latestItem.publishedAt) ? item : latestItem, cluster.items[0]);

    return {
      ...representative,
      source: sources.join(' · '),
      sourceCount: sources.length,
      publishedAt: latest.publishedAt,
      popularityScore: sources.length * 1000000000 + new Date(latest.publishedAt).getTime()
    };
  }).sort((a, b) => b.popularityScore - a.popularityScore);

  return selectBalanced(stories, limit, 2);
}

async function readFeed(feed) {
  const data = await parser.parseURL(feed.url);
  const items = data.items.map((item) => normalize(item, feed));
  const pageImageCandidates = items.filter((item) => !item.image && item.url).slice(0, 20);

  await Promise.all(pageImageCandidates.map(async (item) => {
    const pageImage = await fetchPageImage(item.url);
    if (pageImage) item.image = pageImage;
  }));

  return items;
}

let newsCache = {
  articles: [],
  fetchedAt: null,
  failedSources: []
};
let refreshPromise = null;

async function refreshNews() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const results = await Promise.allSettled(FEEDS.map(readFeed));
    const articles = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);

    const ranked = dedupe(articles).sort((a, b) => {
      const dateDiff = new Date(b.publishedAt) - new Date(a.publishedAt);
      const weightDiff = b.weight - a.weight;
      return weightDiff * 1000000000 + dateDiff;
    });

    newsCache = {
      articles: ranked,
      fetchedAt: new Date().toISOString(),
      failedSources: results
        .map((result, index) => result.status === 'rejected' ? FEEDS[index].name : null)
        .filter(Boolean)
    };

    console.log('News refreshed: ' + ranked.length + ' articles');
  })().catch((error) => {
    console.error('News refresh failed:', error.message);
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

app.get('/api/weather', async (req, res) => {
  const location = String(req.query.location || 'Bia?ystok').trim().slice(0, 80) || 'Bia?ystok';
  const cacheKey = location.toLocaleLowerCase('pl-PL');
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < weatherCacheTtlMs) {
    return res.json({ ...cached.data, cached: true });
  }
  if (!weatherApiKey) {
    return res.status(503).json({ error: 'weather_key_missing', message: 'Dodaj klucz WeatherAPI do ustawie? serwera.' });
  }

  try {
    const url = new URL('https://api.weatherapi.com/v1/forecast.json');
    url.searchParams.set('key', weatherApiKey);
    url.searchParams.set('q', location);
    url.searchParams.set('days', '3');
    url.searchParams.set('aqi', 'no');
    url.searchParams.set('alerts', 'no');
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload.error?.code === 1006 ? 'Nie znaleziono tej miejscowo?ci.' : 'Nie uda?o si? pobra? prognozy.';
      return res.status(response.status === 400 ? 404 : 502).json({ error: 'weather_unavailable', message });
    }
    const data = {
      location: { name: payload.location.name, region: payload.location.region, country: payload.location.country },
      current: {
        tempC: payload.current.temp_c, feelsLikeC: payload.current.feelslike_c, code: payload.current.condition.code,
        condition: payload.current.condition.text, icon: payload.current.condition.icon,
        humidity: payload.current.humidity, windKph: payload.current.wind_kph
      },
      days: payload.forecast.forecastday.map((day) => ({
        date: day.date, maxC: day.day.maxtemp_c, minC: day.day.mintemp_c,
        condition: day.day.condition.text, icon: day.day.condition.icon, code: day.day.condition.code,
        chanceOfRain: day.day.daily_chance_of_rain
      })),
      updatedAt: payload.current.last_updated
    };
    weatherCache.set(cacheKey, { fetchedAt: Date.now(), data });
    return res.json({ ...data, cached: false });
  } catch (error) {
    console.error('Weather request failed:', error.message);
    return res.status(502).json({ error: 'weather_unavailable', message: 'Prognoza jest chwilowo niedost?pna.' });
  }
});

app.use(express.static('public'));

app.get('/api/news', (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit || '8', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 8;

  res.json({
    articles: topStories(newsCache.articles, limit),
    sources: [...new Map(newsCache.articles.map((article) => [article.sourceId, { id: article.sourceId, name: article.source }])).values()].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    latest: newsCache.articles.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 100),
    fetchedAt: newsCache.fetchedAt,
    failedSources: newsCache.failedSources
  });
});

async function start() {
  await refreshNews();
  setInterval(refreshNews, refreshIntervalMs);

  app.listen(port, () => {
    console.log('News aggregator running at http://localhost:' + port);
    console.log('Automatic RSS refresh interval: 1 hour');
  });
}

start();
