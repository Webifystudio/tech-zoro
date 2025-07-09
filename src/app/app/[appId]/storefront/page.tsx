"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { collection, doc, getDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingCart, MessageCircle, Instagram } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  platform: 'instagram' | 'whatsapp';
  createdAt: { seconds: number; nanoseconds: number; } | null;
}

interface Category {
  id: string;
  name: string;
}

interface AppData {
  name: string;
  description?: string;
  customization?: {
    logoUrl?: string;
    coverUrl?: string;
  };
  integrations?: {
    whatsappNumber?: string;
    instagramUsername?: string;
  };
}

export default function StorefrontPage() {
  const params = useParams();
  const appId = params.appId as string;
    
  const [appData, setAppData] = useState<AppData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !db) return;

    const fetchAllData = async () => {
      setIsLoading(true);

      // Fetch App Data
      const appDocRef = doc(db, 'apps', appId);
      const appDocSnap = await getDoc(appDocRef);
      if (appDocSnap.exists()) {
        setAppData(appDocSnap.data() as AppData);
      }

      // Subscribe to Categories
      const catQuery = query(collection(db, "apps", appId, "categories"), orderBy("name"));
      const unsubCategories = onSnapshot(catQuery, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      });

      // Subscribe to Products
      const prodQuery = query(collection(db, "apps", appId, "products"), orderBy("createdAt", "desc"));
      const unsubProducts = onSnapshot(prodQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      });
      
      setIsLoading(false);

      return () => {
        unsubCategories();
        unsubProducts();
      };
    };

    fetchAllData();
  }, [appId]);

  const getWhatsAppLink = (product: Product) => {
    const whatsAppNumber = appData?.integrations?.whatsappNumber;
    if (!whatsAppNumber) return '#';
    const message = encodeURIComponent(`I want to buy this: ${product.name} (ID: ${product.id.substring(0, 6)})`);
    return `https://wa.me/${whatsAppNumber.replace(/\D/g, '')}?text=${message}`;
  };

  const getInstagramLink = () => {
    const instagramUsername = appData?.integrations?.instagramUsername;
    if (!instagramUsername) return '#';
    return `https://instagram.com/${instagramUsername.replace('@', '')}`;
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="w-full h-64" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-background shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={appData?.customization?.logoUrl} alt={appData?.name} />
                <AvatarFallback>{appData?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-foreground">{appData?.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10" />
              </div>
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appData?.customization?.coverUrl && (
          <div className="mb-8 rounded-lg overflow-hidden h-64 w-full relative">
            <Image src={appData.customization.coverUrl} layout="fill" objectFit="cover" alt="Store banner" />
          </div>
        )}

        <section id="categories" className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <Badge key={category.id} variant="secondary" className="text-lg px-4 py-1 cursor-pointer hover:bg-primary/20">{category.name}</Badge>
            ))}
          </div>
        </section>

        <section id="products">
          <h2 className="text-2xl font-bold tracking-tight mb-4">All Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-background rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="relative h-56 w-full">
                  <Image src={product.imageUrl} layout="fill" objectFit="cover" alt={product.name} />
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                  <p className="text-muted-foreground text-sm flex-grow mt-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-bold text-xl text-primary">${product.price.toFixed(2)}</p>
                    {product.platform === 'whatsapp' && (
                      <Button asChild size="sm">
                        <Link href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4"/> Order
                        </Link>
                      </Button>
                    )}
                    {product.platform === 'instagram' && (
                       <Button asChild size="sm" variant="outline">
                        <Link href={getInstagramLink()} target="_blank" rel="noopener noreferrer">
                          <Instagram className="mr-2 h-4 w-4"/> Message
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
