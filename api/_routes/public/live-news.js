import { success, error, methodNotAllowed, parseQuery } from '../../_lib/response.js';

const FEEDS = {
  geopolitics: [
    ['The Hindu', 'https://www.thehindu.com/news/international/feeder/default.rss'],
    ['The Indian Express', 'https://indianexpress.com/section/world/feed/'],
  ],
  international: [
    ['The Hindu', 'https://www.thehindu.com/news/international/feeder/default.rss'],
    ['The Indian Express', 'https://indianexpress.com/section/world/feed/'],
  ],
  national: [
    ['The Hindu', 'https://www.thehindu.com/news/national/feeder/default.rss'],
    ['The Indian Express', 'https://indianexpress.com/section/india/feed/'],
    ['Press Information Bureau', 'https://pib.gov.in/RssMain.aspx'],
  ],
  state: [
    ['The Hindu', 'https://www.thehindu.com/news/states/feeder/default.rss'],
    ['The Indian Express', 'https://indianexpress.com/section/cities/feed/'],
  ],
};

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function stripHtml(value = '') {
  return decodeXml(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function tagValue(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function parseFeed(xml, source, category) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    const title = stripHtml(tagValue(item, 'title'));
    const link = tagValue(item, 'link');
    const description = stripHtml(tagValue(item, 'description'));
    const publishedAt = tagValue(item, 'pubDate') || tagValue(item, 'published');
    return title && link ? { title, link, description, publishedAt, source, category } : null;
  }).filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const { category } = parseQuery(req);
  const categories = category && FEEDS[category] ? [category] : Object.keys(FEEDS);
  const requests = categories.flatMap((name) => FEEDS[name].map(async ([source, url]) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
    if (!response.ok) throw new Error(`${source} returned ${response.status}`);
    return parseFeed(await response.text(), source, name);
  }));

  const results = await Promise.allSettled(requests);
  const articles = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const uniqueArticles = [...new Map(articles.map((article) => [article.link, article])).values()]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 60);

  if (!uniqueArticles.length) return error(res, 'Live news feeds are temporarily unavailable', 502);
  return success(res, uniqueArticles);
}
