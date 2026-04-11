import * as cheerio from 'cheerio';

export async function fetchReadableUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    cache: 'no-store',
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  $('script, style, noscript').remove();

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const headings = $('h1, h2, h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 20);

  const paragraphs = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 40);

  return [
    `TITLE: ${title}`,
    `META: ${metaDescription}`,
    `HEADINGS:\n${headings.join('\n')}`,
    `PARAGRAPHS:\n${paragraphs.join('\n')}`,
  ].join('\n\n');
}