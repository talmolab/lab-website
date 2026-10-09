import type { APIContext } from 'astro';

/** Production allows everything; any other host is a preview and asks not to be
 *  crawled, so it never competes with talmolab.org in search results. */
export function GET({ site }: APIContext) {
  const prod = site?.hostname === 'talmolab.org';
  const body = prod
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
