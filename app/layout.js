import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata = {
  title: 'My Atlas — places you have been',
  description: 'A personal map of the countries, states, and cities you have visited.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body bg-parchment text-ink antialiased">{children}</body>
    </html>
  );
}
