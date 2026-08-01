import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NotterPad – Offline-First Novel Writing Platform',
    short_name: 'NotterPad',
    description: 'The distraction-free, privacy-first writing platform and Story Bible extraction engine for fiction authors.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/logo-icon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/logo-full.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}
