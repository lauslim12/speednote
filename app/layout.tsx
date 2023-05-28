import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Speednote — Quickly input your thoughts',
  description:
    'Speednote, as its name suggests, is an optimized PWA to quickly type notes as fast as possible. Put your thoughts here before you move them to another storage!',
  metadataBase: new URL('https://speednote.vercel.app'),
  manifest: '/manifest.json',
  themeColor: '#f1c40f',
  openGraph: {
    title: 'Speednote',
    description:
      'Speednote, as its name suggests, is an optimized PWA to quickly type notes as fast as possible. Put your thoughts here before you move them to another storage!',
    siteName: 'Speednote',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://speednote.vercel.app/speednote-seo.jpeg',
        width: 512,
        height: 512,
        alt: 'Speednote characteristic image',
      },
    ],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
};

export default RootLayout;
