import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'NEXUS — The AI Productivity OS',
  description: 'Your second brain. Not a to-do app. An operating system for your mind.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0f] text-white font-sans">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
