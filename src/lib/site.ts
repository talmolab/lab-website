/** Site-wide facts, in one place so the header, footer and pages agree. */

export const LAB = 'Talmo Lab';
export const INSTITUTE = 'Salk Institute for Biological Studies';
export const EMAIL = 'talmo@salk.edu';
export const ADDRESS = ['10010 North Torrey Pines Road', 'La Jolla, California 92037'];
export const DESCRIPTION =
  "Talmo Pereira's lab at the Salk Institute for Biological Studies builds computational tools that use deep learning and computer vision to study complex biological systems.";

export const NAV = [
  { href: '/research/', label: 'Research' },
  { href: '/publications/', label: 'Publications' },
  { href: '/tools/', label: 'Tools' },
  { href: '/team/', label: 'Team' },
  { href: '/join/', label: 'Join' },
];

/** The live site's footer links (email, Google Scholar, GitHub, Twitter). The live
 *  Scholar link passed a name where Scholar expects a profile id; this is the id.
 *  Bluesky, LinkedIn and the Salk faculty page were added after the move (2026-11). */
export const ELSEWHERE = [
  { href: 'https://www.salk.edu/scientist/talmo-pereira/', label: 'Salk faculty page' },
  { href: 'https://github.com/talmolab', label: 'GitHub' },
  { href: 'https://scholar.google.com/citations?user=tFrElIUAAAAJ', label: 'Google Scholar' },
  { href: 'https://bsky.app/profile/talmo.bsky.social', label: 'Bluesky' },
  { href: 'https://www.linkedin.com/in/talmo/', label: 'LinkedIn' },
  { href: 'https://x.com/talmop', label: 'X (Twitter)' },
  { href: 'https://github.com/talmolab/lab-website/tree/main/brand', label: 'Brand kit' },
];

export const EXPORTS = [
  { href: '/publications.bib', label: 'BibTeX' },
  { href: '/publications.csl.json', label: 'CSL JSON' },
  { href: '/publications.json', label: 'JSON' },
  { href: '/feed.xml', label: 'RSS' },
];

/** True when `path` is inside the section `href` names. Member pages belong to Team. */
export function inSection(path: string, href: string): boolean {
  if (href === '/team/' && path.startsWith('/members/')) return true;
  return path === href || path.startsWith(href);
}
