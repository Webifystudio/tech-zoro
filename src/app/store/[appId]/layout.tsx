
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, User, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = params.appId as string;
  
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleToggleSearch = () => {
    setIsSearchExpanded(prev => {
        if (!prev) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return !prev;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
      if (encodedSearchTerm) {
          router.push(`/store/${appId}?search=${encodedSearchTerm}`);
      } else {
          router.push(`/store/${appId}`);
      }
  };

  return (
    <div className="bg-muted/40 min-h-screen flex flex-col">
      <header className="bg-background/80 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 gap-4 md:gap-8">
            <div className={cn("flex items-center gap-4 transition-opacity", isSearchExpanded && "opacity-0 pointer-events-none w-0")}>
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-32 hidden sm:block" />
                </>
              ) : (
                <Link href={`/store/${appId}`} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={appData?.customization?.logoUrl} alt={appData?.name} />
                    <AvatarFallback>{appData?.name?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-xl font-bold text-foreground hidden sm:block">{appData?.name || 'My Store'}</h1>
                </Link>
              )}
            </div>

            <div className={cn("flex-1 w-full transition-all duration-300", isSearchExpanded ? "max-w-full" : "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl")}>
              <form className="relative" onSubmit={handleSearchSubmit}>
                <Input 
                  ref={searchInputRef}
                  placeholder="Search products, brands and more..." 
                  className="pl-5 pr-12 h-12 rounded-full w-full" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                />
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full" type="submit">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Search</span>
                </Button>
              </form>
            </div>

            <div className={cn("flex items-center gap-2 md:gap-4 transition-opacity", isSearchExpanded && "opacity-0 pointer-events-none w-0")}>
              <Button size="icon" variant="ghost" className="rounded-full">
                <User className="h-6 w-6" />
                <span className="sr-only">Account</span>
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="sr-only">Cart</span>
                <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </Button>
            </div>
             {isSearchExpanded && (
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setIsSearchExpanded(false)}>
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close search</span>
                </Button>
            )}
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
