import React from 'react';
import './globals.css';
import type { Metadata } from 'next';

const CANONICAL_DOMAIN = 'https://notterpad.in';

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_DOMAIN),
  title: {
    default: 'NotterPad – Offline-First Novel Writing & Story Bible Platform',
    template: '%s | NotterPad',
  },
  description:
    'The distraction-free, privacy-first writing platform for fiction authors. Organize novels, extract Story Bibles with AI, and write offline — no cloud, no subscription.',
  keywords: [
    'novel writing app',
    'story bible',
    'fiction writing tool',
    'offline writing',
    'AI chapter extraction',
    'character manager',
    'worldbuilding tool',
    'writing sprint',
    'distraction free editor',
    'notterpad',
  ],
  authors: [{ name: 'NotterPad' }],
  creator: 'NotterPad',
  publisher: 'NotterPad',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: CANONICAL_DOMAIN,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: CANONICAL_DOMAIN,
    siteName: 'NotterPad',
    title: 'NotterPad – Offline-First Novel Writing & Story Bible Platform',
    description:
      'The distraction-free, privacy-first writing platform for fiction authors. Organize novels, extract Story Bibles with AI, and write offline.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NotterPad – Offline-First Novel Writing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotterPad – Offline-First Novel Writing & Story Bible Platform',
    description:
      'The distraction-free, privacy-first writing platform for fiction authors. Write offline, extract Story Bibles with AI.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-[#f4f4f5] antialiased">
        {children}
      </body>
    </html>
  );
}
