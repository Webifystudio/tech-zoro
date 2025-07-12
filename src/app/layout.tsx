
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isGlassEffectEnabled] = useLocalStorage('glass-effect-enabled', false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isStorePath = pathname.startsWith('/store');
  const isAuthPath = pathname === '/login' || pathname === '/register';

  const shouldApplyGlassEffect = isMounted && isGlassEffectEnabled && !isStorePath && !isAuthPath;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="antialiased flex min-h-screen flex-col bg-background" data-theme={shouldApplyGlassEffect ? 'glass' : undefined}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <main className="flex-grow">{children}</main>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
