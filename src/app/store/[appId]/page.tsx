
"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { collection, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MessageCircle, Instagram, PackageX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number | null;
  platform: 'instagram' | 'whatsapp';
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
  const searchParams = useSearchParams();
  const appId = params.appId as string;
    
  const [appData, setAppData] = useState<AppData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !db) return;
    setIsLoading(true);

    const unsubApp = onSnapshot(doc(db, 'apps', appId), (doc) => {
      if (doc.exists()) {
        setAppData(doc.data() as AppData);
      }
    });

    const unsubCategories = onSnapshot(query(collection(db, "apps", appId, "categories"), orderBy("name")), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubProducts = onSnapshot(query(collection(db, "apps", appId, "products"), orderBy("createdAt", "desc")), (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
      setIsLoading(false);
    });
    
    return () => {
      unsubApp();
      unsubCategories();
      unsubProducts();
    };
  }, [appId]);

  useEffect(() => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredProducts(filtered);
    } else {
        setFilteredProducts(products);
    }
  }, [searchParams, products]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <Skeleton className="w-full h-80 rounded-lg" />
        <div className="space-y-4 container mx-auto">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex flex-wrap gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-lg" />)}
          </div>
        </div>
        <div className="space-y-4 container mx-auto">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }
  
  const productsToShow = searchParams.get('search') ? filteredProducts : products;

  return (
    <>
      <section className="relative w-full h-80 md:h-96 bg-muted/40 flex items-center justify-center text-center p-4">
          {appData?.customization?.coverUrl && (
              <Image src={appData.customization.coverUrl} layout="fill" objectFit="cover" alt="Store banner" className="opacity-30" data-ai-hint="website banner" />
          )}
          <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">{appData?.name || 'Welcome to Our Store'}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{appData?.description || 'Find the best products here.'}</p>
          </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section id="categories" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Button variant="ghost" asChild>
              <Link href="#">See All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(category => (
                <div key={category.id} className="bg-background border rounded-lg p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <p className="font-semibold">{category.name}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-muted-foreground">No categories yet.</p>
          )}
        </section>

        <section id="products">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{searchParams.get('search') ? `Search results for "${searchParams.get('search')}"` : 'New Arrivals'}</h2>
            {!searchParams.get('search') && 
              <Button variant="ghost" asChild>
                <Link href="#">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            }
          </div>
          {productsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsToShow.map(product => {
                const isOutOfStock = product.quantity !== null && product.quantity <= 0;
                return (
                  <Link key={product.id} href={`/store/${appId}/product/${product.id}`} className="block">
                    <div className="bg-background rounded-lg border overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1 h-full">
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image src={product.imageUrl} layout="fill" objectFit="cover" alt={product.name} className="group-hover:scale-105 transition-transform duration-300"/>
                         {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Badge variant="destructive" className="text-base px-4 py-2">Out of Stock</Badge>
                            </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1 flex-grow">{product.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <p className="font-bold text-xl text-primary">${product.price.toFixed(2)}</p>
                          <Badge variant="outline" className="capitalize">
                              {product.platform === 'whatsapp' ? <MessageCircle className="h-4 w-4 mr-1.5"/> : <Instagram className="h-4 w-4 mr-1.5"/>}
                              {product.platform}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg flex flex-col items-center">
                <PackageX className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">{searchParams.get('search') ? 'No Products Found' : 'No Products Yet'}</h3>
                <p className="mt-1 text-muted-foreground">{searchParams.get('search') ? 'Try a different search term.' : 'Products added in the dashboard will appear here.'}</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
