import type { Metadata } from 'next';
import { Inter, Nunito } from 'next/font/google';
import { JSX } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-logo',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'WeSki — Ski Hotel Search',
  description: 'Find the best ski hotels at the best prices',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body>
        <div
          style={{ height: '4px', backgroundColor: 'var(--color-primary)' }}
        />
        {children}
      </body>
    </html>
  );
}
