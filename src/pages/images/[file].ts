import { readFile } from 'node:fs/promises';
import type { APIRoute, GetStaticPaths } from 'astro';

/**
 * The live Jekyll site served every photo at /images/<name>. Those URLs are in Google
 * Images and linked from outside (talks, CVs, other labs' pages), so the rebuild keeps
 * answering them with the same bytes. The pages themselves use the optimised copies
 * Astro makes from src/assets/; this route only republishes the originals at their
 * old addresses, so nothing is stored twice in the repo.
 *
 * The list is closed: it is the live site's /images/ directory as of the cutover
 * (lab-website @ 345c678), matched to src/assets/ by content hash. A new portrait
 * does not belong here. Files that moved rather than stayed are in public/_redirects;
 * `test/live-urls.txt` holds every one of these paths, so the gate checks them.
 */
const SAME_NAME: Record<'people' | 'pages', string[]> = {
  pages: [
    '2024-08-06.lab-group1.jpg',
    '2024-08-06.lab-group2.jpg',
    '2024-09-05.action.jpg',
    'lab-action.jpg',
    'salk_sunset.jpg',
    'the-lab.jpg',
    'the-team.jpg',
  ],
  people: [
    'adam-lee.jpg',
    'advaith-ravishankar.jpg',
    'amick-licup.jpg',
    'andrew-park.jpg',
    'arlo-sheridan.jpg',
    'benfica-xavier.jpg',
    'carlos-robles.jpeg',
    'david-samy.jpg',
    'dexter-tsin.png',
    'elise-davis.jpg',
    'elizabeth-berrigan.jpg',
    'eric-leonardis.jpg',
    'fabian-plum.jpg',
    'frederico-kiffer.jpg',
    'jason-foat.jpg',
    'joshua-park.jpg',
    'kaela-evans.jpg',
    'kaii-bijlani.jpg',
    'ketan-mittal.jpg',
    'kevin-bian.jpg',
    'keya-loding.jpg',
    'liezl-maree.jpg',
    'lin-wang.png',
    'marcus-intal.jpg',
    'mariela-mendoza.jpg',
    'max-weinberg.jpg',
    'mustafa-shaikh.jpg',
    'nancy-guo.jpg',
    'nathaniel-nono.jpg',
    'nick-andrews.png',
    'scott-yang.jpg',
    'sean-afshar.jpg',
    'shrivaths-shyam.jpg',
    'theo-couris.jpg',
    'tom-han.jpg',
    'will-knickrehm.jpg',
    'zaher-abbara.jpg',
  ],
};

/** Live name → source, where the file was renamed on the way into src/assets/. */
const RENAMED: Record<string, string> = {
  'aaditiya-prasad.jpg': 'people/aaditya-prasad.jpg',
  'ck.png': 'people/chaitanya-kapoor.png',
  'divya-murali.jpg': 'people/divya-seshari-murali.jpg',
  'member.jpg': 'people/vincent-tu.jpg',
  'talmo-pereira-2024-09-alt@1x.png': 'people/talmo-pereira.png',
};

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const getStaticPaths: GetStaticPaths = () => {
  const entries: [string, string][] = [
    ...SAME_NAME.pages.map((f): [string, string] => [f, `pages/${f}`]),
    ...SAME_NAME.people.map((f): [string, string] => [f, `people/${f}`]),
    ...Object.entries(RENAMED),
  ];
  return entries.map(([file, source]) => ({ params: { file }, props: { source } }));
};

export const GET: APIRoute = async ({ props, params }) => {
  // A missing source throws, which fails the build: a legacy URL never silently 404s.
  // Relative to the project root, as the build runs there (src/lib/pubs.ts does the same).
  const bytes = await readFile(`src/assets/${props.source}`);
  const ext = params.file!.split('.').pop()!.toLowerCase();
  return new Response(new Uint8Array(bytes), { headers: { 'content-type': TYPES[ext] } });
};
