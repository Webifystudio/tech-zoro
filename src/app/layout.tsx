
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  const [theme] = useLocalStorage<'default' | 'dark' | 'glass'>('theme', 'default');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if(user && db) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if(userData.backgroundUrl) {
                    setBackgroundUrl(userData.backgroundUrl);
                }
            }
        }
    });

    return () => unsubscribe();

  }, []);
  
  const isStorePath = pathname.startsWith('/store');
  const isAuthPath = pathname === '/login' || pathname === '/register';

  if (!isMounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased flex min-h-screen flex-col bg-background" />
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning className={theme === 'glass' ? 'theme-glass' : ''}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body 
        className={cn(
          "antialiased flex min-h-screen flex-col bg-background"
        )}
        style={{
            backgroundImage: theme === 'glass' && backgroundUrl ? `url(${backgroundUrl})` : 'none'
        }}
      >
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
