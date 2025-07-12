
"use client";

import { useState, useEffect, useRef, type ReactNode, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, User, X, Trash2, Globe, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';
import { CartProvider, useCart } from '@/context/CartProvider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppData {
  name: string;
  isPublic?: boolean;
  customization?: {
    logoUrl?: string;
    theme?: string;
  };
  marketing?: {
    isBannerActive?: boolean;
    bannerText?: string;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

const StoreLayoutContent = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = params.appId as string;
  
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { cartItems, removeFromCart, clearCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);

  const [linkStatus, setLinkStatus] = useState<'offline' | 'online'>('offline');
  const [theme, setTheme] = useState('default');
  
  const statusKey = useMemo(() => `storefront_status_${appId}`, [appId]);
  const isPubliclyHosted = appData?.isPublic === true;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'theme-change') {
            document.documentElement.dataset.theme = event.data.theme;
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!appId) return;
    
    // This is for the temporary preview link
    const checkPreviewStatus = () => {
        const status = localStorage.getItem(statusKey);
        const startTime = localStorage.getItem(`${statusKey}_start_time`);

        if (status === 'online' && startTime) {
            const elapsed = (Date.now() - parseInt(startTime, 10)) / 1000;
            if(elapsed < 1800) setLinkStatus('online');
            else setLinkStatus('offline');
        } else {
            setLinkStatus('offline');
        }
    };
    checkPreviewStatus();

    const intervalId = setInterval(checkPreviewStatus, 5000); // Check every 5 seconds
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === statusKey) checkPreviewStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [appId, statusKey]);

  useEffect(() => {
    if (!appId || !db) return;
    const unsub = onSnapshot(doc(db, 'apps', appId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AppData;
        setAppData(data);
        if (data.customization?.theme) {
          setTheme(data.customization.theme);
          document.documentElement.dataset.theme = data.customization.theme;
        }
      } else {
        // App not found, treat as offline
        setAppData(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [appId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
      if (encodedSearchTerm) {
          router.push(`/store/${appId}?search=${encodedSearchTerm}`);
      } else {
          router.push(`/store/${appId}`);
      }
      setIsSearchExpanded(false);
  };

  const isStoreAccessible = isPubliclyHosted || linkStatus === 'online';

  if (!isLoading && !isStoreAccessible && typeof window !== 'undefined' && window.parent === window) {
    return (
        <div className="flex flex-col min-h-screen bg-muted/40" data-theme={theme}>
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                 <Globe className="h-24 w-24 text-primary/30 mb-8" />
                 <h1 className="text-4xl font-bold tracking-tight text-foreground">Store is Offline</h1>
                 <p className="mt-4 text-lg text-muted-foreground max-w-md">
                     This store is not currently available to the public.
                 </p>
                 <p className="mt-2 text-sm text-muted-foreground max-w-md">
                     If you are the store owner, please go to your dashboard under <span className="font-semibold text-foreground">Storefront</span> and either publish your store or activate a temporary preview link.
                 </p>
                 <Button asChild className="mt-8">
                     <Link href={`/app/${appId}`}>
                         <RefreshCw className="mr-2 h-4 w-4" />
                         Go to Dashboard
                     </Link>
                 </Button>
            </div>
             <Footer />
        </div>
    )
  }

  return (
    <div className="bg-muted/40 min-h-screen flex flex-col" data-theme={theme}>
      {appData?.marketing?.isBannerActive && appData.marketing.bannerText && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-semibold animate-slide-in-from-bottom">
          {appData.marketing.bannerText}
        </div>
      )}
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
                 <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full" type="button" onClick={() => searchInputRef.current?.focus()}>
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
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-full relative">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="sr-only">Cart</span>
                        {cartItems.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-ping once">
                                {cartItems.length}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Your Cart ({cartItems.length})</SheetTitle>
                    </SheetHeader>
                    {cartItems.length > 0 ? (
                        <>
                        <ScrollArea className="flex-grow my-4 -mx-6">
                            <div className="px-6">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 py-4 border-b">
                                        <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-muted-foreground">₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <SheetFooter className="mt-auto">
                            <div className="w-full space-y-4">
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <Button size="lg" className="w-full">Proceed to Checkout</Button>
                                <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
                            </div>
                        </SheetFooter>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
                            <p className="text-muted-foreground mt-1">Add some products to get started!</p>
                        </div>
                    )}
                </SheetContent>
               </Sheet>
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

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreLayoutContent>{children}</StoreLayoutContent>
    </CartProvider>
  )
}
