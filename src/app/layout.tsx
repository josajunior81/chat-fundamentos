import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: 'Chat Fundamentos',
  description: 'Chat com IA do projeto Fundamentos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SpeedInsights />
      <Analytics />
      <body>{children}</body>
    </html>
  );
}