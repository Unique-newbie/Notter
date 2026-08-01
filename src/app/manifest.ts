import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notter - Living Story Bible & Writing Platform',
    short_name: 'Notter',
    description: 'The ultimate continuity engine, living story bible, and distraction-free writing environment for authors.',
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
