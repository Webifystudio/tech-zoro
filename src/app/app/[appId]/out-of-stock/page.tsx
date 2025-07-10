
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, PackageX, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number | null;
}

export default function OutOfStockPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [isRestocking, setIsRestocking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db && appId) {
      const q = query(collection(db, "apps", appId, "products"), where("quantity", "==", 0));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setOutOfStockProducts(products);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching out of stock products:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch products." });
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        setIsLoading(false);
    }
  }, [user, appId, toast]);

  const openRestockDialog = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity('');
    setIsRestockDialogOpen(true);
  };
  
  const handleRestock = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !restockQuantity || !db) return;
    
    setIsRestocking(true);
    try {
      const productRef = doc(db, "apps", appId, "products", selectedProduct.id);
      await updateDoc(productRef, {
        quantity: parseInt(restockQuantity, 10)
      });
      toast({ title: "Product Restocked!", description: `${selectedProduct.name} is back in stock.` });
      setIsRestockDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Restock Failed", description: error.message });
    } finally {
      setIsRestocking(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Out of Stock Products</h1>
        <p className="text-muted-foreground">Manage and restock your unavailable items.</p>
      </div>

       {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : outOfStockProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {outOfStockProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
                <CardContent className="p-0">
                    <Image src={product.imageUrl} alt={product.name} width={400} height={400} className="object-cover w-full h-48" />
                </CardContent>
                <CardHeader>
                    <CardTitle className="truncate">{product.name}</CardTitle>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" onClick={() => openRestockDialog(product)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Restock
                    </Button>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg py-24 px-8">
            <div className="bg-primary/10 p-4 rounded-full"><PackageX className="h-8 w-8 text-primary" /></div>
            <h2 className="mt-6 text-2xl font-semibold">No products out of stock</h2>
            <p className="mt-2 text-muted-foreground max-w-xs">
              All your products are currently available.
            </p>
        </div>
      )}
      
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>Add new quantity for {selectedProduct?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRestock}>
            <div className="py-4">
              <Label htmlFor="restock-quantity">New Quantity</Label>
              <Input
                id="restock-quantity"
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isRestocking}>
                {isRestocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
