import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { latest, displayTitle, roleHistory, isCurrent } from '../lib/people';
import { nameKey } from '../lib/names';

/** The site search index (src/components/SearchDialog.astro). Small, static, rebuilt
 *  with the site, so it never disagrees with the pages it points to. */
export const GET: APIRoute = async () => {
  const docs: { type: string; title: string; detail?: string; url: string; text: string }[] = [];

  const pages = [
    ['Home', '/', 'Computational tools for studying complex biological systems'],
    ['Research', '/research/', 'Biological motion capture, phenoinformatics, virtual biology'],
    ['Publications', '/publications/', 'Papers, preprints and proceedings; BibTeX, CSL JSON'],
    ['Tools', '/tools/', 'Open-source software: SLEAP and related tools'],
    ['Team', '/team/', 'Current members and alumni'],
    ['Join us', '/join/', 'Opportunities: software engineers, postdocs, graduate students, interns; contact'],
    ['Blog', '/blog/', 'Posts and news'],
  ];
  for (const [title, url, detail] of pages) docs.push({ type: 'Page', title, url, detail, text: '' });

  for (const a of await getCollection('areas', ({ data }) => !data.draft)) {
    docs.push({ type: 'Research', title: a.data.name, url: `/research/#${a.id}`, detail: a.data.summary, text: a.body ?? '' });
  }

  for (const p of await getCollection('people')) {
    const cur = isCurrent(p);
    const detail = cur ? displayTitle(latest(p)) : `Alumni · ${roleHistory(p).join(', ')}`;
    docs.push({
      type: 'Person',
      title: p.data.name,
      url: p.data.page ? `/members/${p.id}` : cur ? '/team/#current' : '/team/#alumni',
      detail,
      text: [p.data.aliases.join(' '), p.data.next?.org ?? '', cur ? 'current' : 'alumni'].join(' '),
    });
  }

  for (const r of await getCollection('repos')) {
    const d = r.data;
    docs.push({
      type: 'Tool',
      title: d.title ?? d.name,
      url: `/tools/#${d.name}`,
      detail: (d.blurb ?? d.description ?? '').split(/(?<=\.)\s/)[0],
      text: [d.repo, d.blurb, d.description, d.topics.join(' '), d.language].filter(Boolean).join(' '),
    });
  }

  for (const p of await getCollection('publications')) {
    const d = p.data;
    docs.push({
      type: 'Paper',
      title: d.title,
      url: `/publications/#${d.key}`,
      detail: [d.venue, (d.date ?? '').slice(0, 4)].filter(Boolean).join(' · '),
      text: [d.authors.join(', '), d.authors.map(nameKey).join(' '), d.doi, d.tags.join(' ')].filter(Boolean).join(' '),
    });
  }

  return new Response(JSON.stringify(docs), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
