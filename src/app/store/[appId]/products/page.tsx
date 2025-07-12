
"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Instagram, PackageX, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number | null;
  platform: 'instagram' | 'whatsapp' | 'affiliate';
}

export default function AllProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appId = params.appId as string;
  const { toast } = useToast();
    
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !db) return;
    setIsLoading(true);

    const q = query(collection(db, "apps", appId, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [appId]);

  useEffect(() => {
    const searchTerm = searchParams.get('q');
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
  
  const searchTerm = searchParams.get('q');
  const productsToShow = searchTerm ? filteredProducts : products;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section id="products">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
          </h1>
        </div>
        {productsToShow.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsToShow.map(product => {
              const isOutOfStock = product.quantity !== null && product.quantity <= 0;
              return (
                <Link 
                  key={product.id} 
                  href={`/store/${appId}/product/${product.id}`} 
                  className={cn("block", isOutOfStock && 'cursor-not-allowed')}
                  onClick={(e) => handleProductClick(e, isOutOfStock)}
                  aria-disabled={isOutOfStock}
                >
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
                        <p className="font-bold text-xl text-primary">₹{product.price.toFixed(2)}</p>
                        <Badge variant="outline" className="capitalize">
                            {product.platform === 'whatsapp' ? <MessageCircle className="h-4 w-4 mr-1.5"/> : product.platform === 'instagram' ? <Instagram className="h-4 w-4 mr-1.5"/> : <LinkIcon className="h-4 w-4 mr-1.5"/>}
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
              <h3 className="mt-4 text-xl font-semibold">{searchTerm ? 'No Products Found' : 'No Products Yet'}</h3>
              <p className="mt-1 text-muted-foreground">{searchTerm ? 'Try a different search term.' : 'Products added in the dashboard will appear here.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
