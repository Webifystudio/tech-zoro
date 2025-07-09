"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/Footer';

interface AppData {
  name: string;
  customization?: {
    logoUrl?: string;
  };
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const appId = params.appId as string;
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !db) return;
    const unsub = onSnapshot(doc(db, 'apps', appId), (doc) => {
      if (doc.exists()) {
        setAppData(doc.data() as AppData);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [appId]);

  return (
    <div className="bg-muted/40 min-h-screen flex flex-col">
      <header className="bg-background shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : (
              <Link href={`/store/${appId}`} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={appData?.customization?.logoUrl} alt={appData?.name} />
                  <AvatarFallback>{appData?.name?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold text-foreground">{appData?.name || 'My Store'}</h1>
              </Link>
            )}
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search products, brands and more..." className="pl-10 h-11" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost">
                <User className="h-6 w-6" />
                <span className="sr-only">Account</span>
              </Button>
              <Button size="icon" variant="ghost">
                <ShoppingCart className="h-6 w-6" />
                <span className="sr-only">Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-background">
        {children}
      </main>

      <Footer />
    </div>
  );
}
