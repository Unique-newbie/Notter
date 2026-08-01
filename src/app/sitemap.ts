import { MetadataRoute } from 'next';

const CANONICAL_DOMAIN = 'https://notterpad.in';

/**
 * NotterPad Production Sitemap
 * 
 * Only includes public, SEO-indexable pages.
 * All dashboard, book, chapter, character, settings, and API routes are excluded.
 * 
 * To add a new public page:
 * 1. Create the page in src/app/ (outside the (dashboard) group)
 * 2. Add an entry to the `publicPages` array below
 */

interface PublicPage {
  path: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const publicPages: PublicPage[] = [
  { path: '/',      changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: `${CANONICAL_DOMAIN}${page.path === '/' ? '' : page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
