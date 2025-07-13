
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
  const [isGlassEffectEnabled] = useLocalStorage('glass-effect-enabled', false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isStorePath = pathname.startsWith('/store');
  const isAuthPath = pathname === '/login' || pathname === '/register';
  
  // This logic now determines if the glass theme *could* be applied.
  // The actual application is handled by the ThemeProvider now.
  const shouldApplyGlassEffect = isMounted && isGlassEffectEnabled && !isStorePath && !isAuthPath;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      {/* 
        The `data-theme` attribute is managed by the ThemeProvider now to avoid hydration mismatches.
        The custom glass effect is handled by a separate class for better compatibility.
      */}
      <body className={cn("antialiased flex min-h-screen flex-col bg-background", shouldApplyGlassEffect && "theme-glass")}>
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
