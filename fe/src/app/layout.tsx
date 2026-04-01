import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { Providers } from './providers';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

// Dynatrace RUM script URL is injected via NEXT_PUBLIC_DYNATRACE_RUM_URL env var.
// Set it to the OneAgent JS snippet URL from your Dynatrace tenant
// (Deploy Dynatrace → Set up an environment → Web → Install OneAgent → Custom application).
// Leave it unset to disable browser-side RUM.
const DYNATRACE_RUM_URL = process.env.NEXT_PUBLIC_DYNATRACE_RUM_URL ?? "";

export const metadata: Metadata = {
  title: 'ALTA - Your Friendly HRIS',
  description: 'ALTA - Your Friendly HRIS',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {DYNATRACE_RUM_URL && (
          <script src={DYNATRACE_RUM_URL} crossOrigin="anonymous" async />
        )}
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Providers>{children}</Providers>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
