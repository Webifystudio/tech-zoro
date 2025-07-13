
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  const [isGlassEffectEnabled] = useLocalStorage('glass-effect-enabled', false);
  const [isNitroThemeEnabled] = useLocalStorage('nitro-theme-enabled', false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isStorePath = pathname.startsWith('/store');
  const isAuthPath = pathname === '/login' || pathname === '/register';

  const bodyClass = cn(
    "antialiased flex min-h-screen flex-col bg-background",
    isMounted && !isStorePath && !isAuthPath && isNitroThemeEnabled && "gradient-body",
    isMounted && !isStorePath && !isAuthPath && !isNitroThemeEnabled && isGlassEffectEnabled && "theme-glass",
  );

  if (!isMounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased flex min-h-screen flex-col bg-background" />
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className={bodyClass}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            forcedTheme={isNitroThemeEnabled ? 'gradient' : undefined}
        >
            <main className="flex-grow">{children}</main>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
