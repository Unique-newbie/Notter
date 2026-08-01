import { MetadataRoute } from 'next';

/**
 * NotterPad Production robots.txt
 * 
 * Allows crawling of public pages only.
 * Blocks all dashboard, API, book, settings, and internal app routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
        ],
        disallow: [
          '/dashboard',
          '/books',
          '/books/*',
          '/settings',
          '/analytics',
          '/api/',
          '/api/*',
          '/_next/',
          '/_next/*',
        ],
      },
    ],
    sitemap: 'https://notterpad.in/sitemap.xml',
  };
}
