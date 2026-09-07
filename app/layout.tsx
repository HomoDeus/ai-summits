import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'AI Summits — An open atlas of human challenges',
  description:
    'Explore known human challenges and evidence-backed AI breakthroughs across the sciences and humanities. An open-source, multilingual interactive terrain.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
