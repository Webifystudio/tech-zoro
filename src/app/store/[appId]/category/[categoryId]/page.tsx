
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { collection, doc, onSnapshot, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  categories?: string[];
}

interface Category {
  id: string;
  name: string;
}

export default function CategoryPage() {
  const params = useParams();
  const appId = params.appId as string;
  const categoryId = params.categoryId as string;
  const { toast } = useToast();
    
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !categoryId || !db) return;
    setIsLoading(true);

    const categoryRef = doc(db, 'apps', appId, 'categories', categoryId);
    const unsubCategory = onSnapshot(categoryRef, (doc) => {
      if (doc.exists()) {
        setCategory({ id: doc.id, ...doc.data() } as Category);
      }
    });
    
    const productsQuery = query(collection(db, "apps", appId, "products"), where("categories", "array-contains", categoryId), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
      setIsLoading(false);
    });
    
    return () => {
      unsubCategory();
      unsubProducts();
    };
  }, [appId, categoryId]);
  
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
            {category?.name || 'Category'}
          </h1>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => {
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
              <h3 className="mt-4 text-xl font-semibold">No Products Found</h3>
              <p className="mt-1 text-muted-foreground">There are no products in this category yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
