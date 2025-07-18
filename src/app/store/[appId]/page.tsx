
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MessageCircle, Instagram, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  quantity: number | null;
  platform: 'instagram' | 'whatsapp' | 'affiliate';
  categories?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface AppData {
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  customization?: {
    logoUrl?: string;
    coverUrl?: string;
  };
}

export default function StorefrontPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
    
  const [appData, setAppData] = useState<AppData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
  
  const handleProductClick = (e: React.MouseEvent<HTMLAnchorElement>, isOutOfStock: boolean) => {
    if (isOutOfStock) {
      e.preventDefault();
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "This item is currently unavailable.",
      });
    }
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const isOutOfStock = product.quantity !== null && product.quantity <= 0;
    const primaryImage = (product.imageUrls && product.imageUrls[0]) || product.imageUrl || "https://placehold.co/400x400.png";

    return (
      <Link 
        href={`/store/${appId}/product/${product.id}`} 
        className={cn("block", isOutOfStock && 'cursor-not-allowed')}
        onClick={(e) => handleProductClick(e, isOutOfStock)}
        aria-disabled={isOutOfStock}
      >
        <div className="bg-background rounded-lg border overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1 h-full">
          <div className="relative w-full overflow-hidden h-48">
            <Image src={primaryImage} alt={product.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-base px-4 py-2">Out of Stock</Badge>
                </div>
            )}
          </div>
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="font-semibold text-md truncate">{product.name}</h3>
            <p className="text-muted-foreground text-sm mt-1 flex-grow truncate">{product.description}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="font-bold text-lg text-primary">₹{product.price.toFixed(2)}</p>
              <Badge variant="outline" className="capitalize">
                  {product.platform === 'whatsapp' ? <MessageCircle className="h-4 w-4 mr-1.5"/> : product.platform === 'instagram' ? <Instagram className="h-4 w-4 mr-1.5"/> : <LinkIcon className="h-4 w-4 mr-1.5"/>}
                  {product.platform}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  const coverImageUrl = appData?.customization?.coverUrl || appData?.coverUrl;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <Skeleton className="w-full h-80 rounded-lg" />
        <div className="space-y-4 container mx-auto">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-4">
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

  return (
    <>
      <section className="relative w-full h-64 md:h-80 bg-muted/40 flex items-center justify-center text-center p-4">
          {coverImageUrl && (
              <Image src={coverImageUrl} layout="fill" objectFit="cover" alt="Store banner" className="opacity-30" data-ai-hint="website banner" />
          )}
          <div className="relative z-10 max-w-2xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-center md:text-left">{appData?.name || 'Welcome to Our Store'}</h1>
              <p className="mt-4 text-base md:text-lg text-muted-foreground text-center md:text-left">{appData?.description || 'Find the best products here.'}</p>
          </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <section id="categories">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            </div>
             {categories.length > 0 ? (
                <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                    <CarouselContent className="-ml-2">
                        {categories.map(category => (
                            <CarouselItem key={category.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                                <Link href={`/store/${appId}/category/${category.id}`}>
                                  <div className="bg-background border rounded-lg p-4 h-full flex items-center justify-center text-center hover:shadow-lg transition-shadow cursor-pointer">
                                      <p className="font-semibold">{category.name}</p>
                                  </div>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
             ) : (
                <p className="text-muted-foreground">No categories yet.</p>
             )}
        </section>

        <section id="new-arrivals">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">New Arrivals</h2>
            <Button variant="ghost" asChild>
              <Link href={`/store/${appId}/products`}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {products.length > 0 ? (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-4">
                {products.slice(0, 8).map(product => (
                  <CarouselItem key={product.id} className="pl-4 basis-1/2 lg:basis-1/4">
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          ) : (
            <p className="text-muted-foreground text-center py-8">No new products yet.</p>
          )}
        </section>

        {categories.map(category => {
            const categoryProducts = products.filter(p => p.categories?.includes(category.id));
            if (categoryProducts.length === 0) return null;
            return (
                <section key={category.id} id={`category-${category.id}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                        <Button variant="ghost" asChild>
                            <Link href={`/store/${appId}/category/${category.id}`}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                     <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                        {categoryProducts.slice(0, 8).map(product => (
                            <CarouselItem key={product.id} className="pl-4 basis-1/2 lg:basis-1/4">
                                <ProductCard product={product} />
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex"/>
                    </Carousel>
                </section>
            );
        })}

      </div>
    </>
  );
}
