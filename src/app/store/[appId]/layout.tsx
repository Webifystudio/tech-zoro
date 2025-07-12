
"use client";

import { useState, useEffect, useRef, type ReactNode, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, onSnapshot, query, where, orderBy, limit, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, Trash2, Globe, RefreshCw, Loader2, Home, FileText, Heart, PanelLeft, Contact } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';
import { CartProvider, useCart } from '@/context/CartProvider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

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
  pages?: {
    contact?: { isEnabled?: boolean };
    privacy?: { isEnabled?: boolean };
    terms?: { isEnabled?: boolean };
  }
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appId = params.appId as string;
  
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { cartItems, removeFromCart, clearCart } = useCart();
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);

  const [linkStatus, setLinkStatus] = useState<'offline' | 'online'>('offline');
  const [theme, setTheme] = useState('default');
  
  const statusKey = useMemo(() => `storefront_status_${appId}`, [appId]);
  const isPubliclyHosted = appData?.isPublic === true;
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionPopoverOpen, setIsSuggestionPopoverOpen] = useState(false);

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

    const intervalId = setInterval(checkPreviewStatus, 5000);
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
        setAppData(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [appId]);

  useEffect(() => {
    if (appId && db && (isPubliclyHosted || linkStatus === 'online')) {
      const visitorKey = `zoro_visited_${appId}`;
      const hasVisited = sessionStorage.getItem(visitorKey);
      if (!hasVisited) {
        const appRef = doc(db, 'apps', appId);
        updateDoc(appRef, { visitors: increment(1) }).catch(console.error);
        sessionStorage.setItem(visitorKey, 'true');
      }
    }
  }, [appId, isPubliclyHosted, linkStatus]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsSuggestionPopoverOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSuggestionPopoverOpen(true);
    const q = query(
      collection(db, 'apps', appId, 'products'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setIsSearching(false);
    });

    return () => unsubscribe();
  }, [searchTerm, appId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSuggestionPopoverOpen(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('q', searchTerm.trim());
      router.push(`/store/${appId}/products?${newParams.toString()}`);
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
  
  const StoreSidebar = () => {
      const menuItems = [
          { href: `/store/${appId}`, label: 'Home', icon: Home },
          { href: `/store/${appId}/cart`, label: 'Cart', icon: ShoppingCart },
          { href: `/store/${appId}/wishlist`, label: 'Wishlist', icon: Heart },
      ];

      const pageItems = [
          { id: 'contact', label: 'Contact Us', icon: Contact, href: `/store/${appId}/page/contact` },
          { id: 'privacy', label: 'Privacy Policy', icon: FileText, href: `/store/${appId}/page/privacy` },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText, href: `/store/${appId}/page/terms` },
      ];
      
      const enabledPages = pageItems.filter(p => appData?.pages?.[p.id as keyof typeof appData.pages]?.isEnabled);

      return (
        <Sidebar>
            <SidebarHeader>
                 <Link href={`/store/${appId}`} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={appData?.customization?.logoUrl} alt={appData?.name} />
                    <AvatarFallback>{appData?.name?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-xl font-bold text-foreground">{appData?.name || 'My Store'}</h1>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                                <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                    {enabledPages.length > 0 && <SidebarSeparator />}
                     {enabledPages.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                                <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col", (theme === 'glass' || theme === 'gradient') ? '' : 'bg-muted/40')} data-theme={theme}>
      {appData?.marketing?.isBannerActive && appData.marketing.bannerText && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-semibold animate-slide-in-from-bottom">
          {appData.marketing.bannerText}
        </div>
      )}
      <SidebarProvider>
      <StoreSidebar />
      <div className={cn("flex-1 flex flex-col", theme === 'glass' && 'glass-card m-0 md:m-4 md:rounded-xl')}>
        <header className="bg-background/80 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 md:h-24 gap-4 md:gap-8">
              
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div className="hidden md:flex items-center gap-4">
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
              </div>

              <div className="flex-1 max-w-2xl">
                <Popover open={isSuggestionPopoverOpen} onOpenChange={setIsSuggestionPopoverOpen}>
                    <PopoverTrigger asChild>
                        <form className="relative" onSubmit={handleSearchSubmit}>
                          <Input 
                            placeholder="Search products..." 
                            className="pl-5 pr-12 h-12 rounded-full w-full" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                           <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full" type="submit">
                              <Search className="h-5 w-5 text-muted-foreground" />
                              <span className="sr-only">Search</span>
                          </Button>
                        </form>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        {isSearching ? (
                            <div className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        ) : suggestions.length > 0 ? (
                             <div className="flex flex-col">
                              {suggestions.map(product => (
                                  <Link key={product.id} href={`/store/${appId}/product/${product.id}`} className="flex items-center gap-4 p-3 hover:bg-muted" onClick={() => setIsSuggestionPopoverOpen(false)}>
                                      <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                      <span className="font-medium">{product.name}</span>
                                      <span className="ml-auto text-sm text-primary">₹{product.price.toFixed(2)}</span>
                                  </Link>
                              ))}
                             </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">No suggestions found.</div>
                        )}
                    </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full relative">
                          <ShoppingCart className="h-6 w-6" />
                          <span className="sr-only">Cart</span>
                          {cartItems.length > 0 && (
                              <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-ping once"></span>
                          )}
                          <span className="absolute top-0 right-0 h-4 w-4 text-xs flex items-center justify-center rounded-full bg-primary text-primary-foreground">{cartItems.length}</span>
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
            </div>
          </div>
        </header>
      
        <main className="flex-grow bg-background">
          {children}
        </main>

        <Footer />
      </div>
      </SidebarProvider>
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
