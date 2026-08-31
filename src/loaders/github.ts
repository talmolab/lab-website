import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { Loader } from 'astro/loaders';

type RepoEntry = {
  repo: string;
  group: 'maintained' | 'research' | 'archived';
  blurb?: string;
  image?: string;
  links?: { label: string; url: string }[];
};

/** Unauthenticated GitHub allows 60 requests/hour and was exhausted in three
 *  calls during planning, so a token is expected in CI and in local .env. */
function headers() {
  const h: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };
  const t = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (t) h.authorization = `Bearer ${t}`;
  return h;
}

export function repos(file = 'src/data/repos.yaml'): Loader {
  return {
    name: 'repos',
    async load({ store, logger, parseData, generateDigest }) {
      const entries = parse(readFileSync(file, 'utf8')) as RepoEntry[];
      logger.info(`${entries.length} curated repos`);
      let live = 0;
      let degraded = 0;

      for (const [index, entry] of entries.entries()) {
        // index is part of the digest: array order IS display order, so a
        // reorder has to invalidate the cache.
        const digest = generateDigest({ ...entry, index });
        if (store.get(entry.repo)?.digest === digest) continue;

        let gh: any = null;
        try {
          const res = await fetch(`https://api.github.com/repos/${entry.repo}`, {
            headers: headers(),
          });
          if (res.ok) {
            gh = await res.json();
            live++;
          } else {
            // §6.3: degrade, never fail the build. A rate-limited or renamed repo
            // must not be able to take the whole site down.
            logger.warn(`${entry.repo}: GitHub returned ${res.status}; rendering from repos.yaml alone`);
            degraded++;
          }
        } catch (err) {
          logger.warn(`${entry.repo}: GitHub unreachable (${err}); rendering from repos.yaml alone`);
          degraded++;
        }

        const [owner, name] = entry.repo.split('/');
        const data = await parseData({
          id: entry.repo,
          data: {
            repo: entry.repo,
            owner,
            name,
            order: index,
            group: entry.group,
            blurb: entry.blurb,
            image: entry.image,
            links: entry.links ?? [],
            // Everything below is enrichment and must tolerate absence.
            description: gh?.description ?? undefined,
            language: gh?.language ?? undefined,
            license: gh?.license?.spdx_id ?? undefined,
            topics: gh?.topics ?? [],
            stars: gh?.stargazers_count ?? undefined,
            forks: gh?.forks_count ?? undefined,
            pushedAt: gh?.pushed_at?.slice(0, 10) ?? undefined,
            homepage: gh?.homepage || undefined,
            archivedOnGitHub: gh?.archived ?? undefined,
          },
        });
        store.set({ id: entry.repo, data, digest });
      }
      logger.info(`github: ${live} fetched, ${degraded} degraded, rest cached`);
    },
  };
}
