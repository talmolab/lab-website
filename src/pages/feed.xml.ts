import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

/** /feed.xml does not exist on the live site — jekyll-feed is commented out in
 *  _config.yaml — so this is purely additive, with no preservation concern. */
export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: 'talmolab',
    description: 'Posts and news from the Talmo Lab at the Salk Institute.',
    site: context.site!,
    items: posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((p) => ({
        title: p.data.title,
        pubDate: p.data.date,
        description: p.data.description,
        link: `/blog/${p.id}/`,
      })),
  });
}
