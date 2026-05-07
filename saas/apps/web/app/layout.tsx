import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HireOS — AI Recruitment OS',
  description: 'AI-powered recruitment operating system for remote startups, agencies, and hiring teams.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
