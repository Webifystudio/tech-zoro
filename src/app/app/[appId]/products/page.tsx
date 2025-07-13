
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { uploadImage } from '@/lib/imgbb';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2, Upload, Instagram, MessageCircle, ShoppingBag, Link as LinkIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number | null;
  platform: 'instagram' | 'whatsapp' | 'affiliate';
  instagramPostUrl?: string;
  affiliateUrl?: string;
  categories?: string[];
  createdAt: { seconds: number; nanoseconds: number; } | null;
}

interface Category {
  id: string;
  name: string;
}

const platformIcons = {
    instagram: <Instagram className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
    affiliate: <LinkIcon className="h-4 w-4" />,
};

export default function ProductsPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productPlatform, setProductPlatform] = useState<Product['platform'] | ''>('');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [instagramPostUrl, setInstagramPostUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db && appId) {
      const q = query(collection(db, "apps", appId, "products"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
        setProducts(userProducts);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching products:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch products." });
        setIsLoading(false);
      });

      const catQuery = query(collection(db, "apps", appId, "categories"), orderBy("name"));
      const unsubCategories = onSnapshot(catQuery, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      });

      return () => {
        unsubscribe();
        unsubCategories();
      };
    } else {
        setIsLoading(false);
    }
  }, [user, appId, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImageFile(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };
  
  const resetForm = () => {
      setProductName('');
      setProductDesc('');
      setProductPrice('');
      setProductQuantity('');
      setProductPlatform('');
      setProductCategories([]);
      setInstagramPostUrl('');
      setAffiliateUrl('');
      setProductImageFile(null);
      setProductImagePreview(null);
  }

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice || !productImageFile || !productPlatform || !user || !db || (productPlatform === 'instagram' && !instagramPostUrl) || (productPlatform === 'affiliate' && !affiliateUrl)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all required fields." });
        return;
    }

    setIsCreating(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(productImageFile);
      reader.onloadend = async () => {
          const base64Image = reader.result as string;
          const result = await uploadImage(base64Image, appId);

          if (result.error) {
            throw new Error(`Image upload failed: ${result.error}`);
          }
          if (!result.url) {
            throw new Error('Image upload failed to return a URL.');
          }

          const newProduct: any = {
            name: productName.trim(),
            description: productDesc.trim(),
            price: parseFloat(productPrice),
            quantity: productQuantity.trim() === '' ? null : parseInt(productQuantity, 10),
            platform: productPlatform,
            categories: productCategories,
            imageUrl: result.url,
            createdAt: serverTimestamp(),
          };

          if (productPlatform === 'instagram') {
            newProduct.instagramPostUrl = instagramPostUrl;
          }
          if (productPlatform === 'affiliate') {
            newProduct.affiliateUrl = affiliateUrl;
          }

          await addDoc(collection(db, "apps", appId, "products"), newProduct);

          resetForm();
          setIsDialogOpen(false);
          toast({ title: "Product Added", description: `"${productName.trim()}" has been added.` });
      }
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        throw new Error("Could not read the image file.");
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add product", description: error.message });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "apps", appId, "products", productId));
      toast({ title: "Product Deleted" });
    } catch (error: any) {
       toast({ variant: "destructive", title: "Failed to delete product", description: error.message });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setProductCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage the products for your app.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the details for your new product.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct}>
              <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDesc">Description</Label>
                    <Textarea id="productDesc" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="productPrice">Price</Label>
                            <Input id="productPrice" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="productQuantity">Quantity</Label>
                           <Input id="productQuantity" type="number" placeholder="Infinity" value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)} />
                        </div>
                   </div>
                   <div className="space-y-2">
                     <Label>Categories</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start font-normal">
                             {productCategories.length > 0 ? `${productCategories.length} selected` : "Select categories"}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                           <div className="p-2 space-y-1">
                              {categories.map(cat => (
                                 <div key={cat.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                                     <Checkbox id={`cat-${cat.id}`} checked={productCategories.includes(cat.id)} />
                                     <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">{cat.name}</Label>
                                 </div>
                              ))}
                           </div>
                        </PopoverContent>
                     </Popover>
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="productPlatform">Sell Platform</Label>
                       <Select onValueChange={(v) => setProductPlatform(v as any)} value={productPlatform} required>
                           <SelectTrigger id="productPlatform">
                               <SelectValue placeholder="Select a platform" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="instagram">Instagram</SelectItem>
                               <SelectItem value="whatsapp">WhatsApp</SelectItem>
                               <SelectItem value="affiliate">Affiliate</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>
                   {productPlatform === 'instagram' && (
                     <div className="space-y-2">
                       <Label htmlFor="instagramPostUrl">Instagram Post URL</Label>
                       <Input id="instagramPostUrl" placeholder="https://instagram.com/p/..." value={instagramPostUrl} onChange={(e) => setInstagramPostUrl(e.target.value)} required />
                     </div>
                   )}
                   {productPlatform === 'affiliate' && (
                     <div className="space-y-2">
                       <Label htmlFor="affiliateUrl">Affiliate Link</Label>
                       <Input id="affiliateUrl" placeholder="https://product.com/link" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} required />
                     </div>
                   )}
                </div>
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <Card className="p-4 border-dashed">
                    <input type="file" accept="image/*" ref={productImageInputRef} onChange={handleFileChange} className="hidden" required />
                    {productImagePreview ? (
                      <div className="relative group">
                        <Image src={productImagePreview} alt="Product preview" width={400} height={400} className="w-full rounded-md object-cover aspect-square" />
                        <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button type="button" variant="secondary" onClick={() => productImageInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4"/> Change Image
                           </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2 text-center p-8 cursor-pointer aspect-square" onClick={() => productImageInputRef.current?.click()}>
                        <div className="border-2 border-dashed border-muted-foreground/50 rounded-full p-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold">Click to upload image</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
              </ScrollArea>
              <DialogFooter className="pt-4 pr-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
                <CardContent className="p-0 relative">
                    <Image src={product.imageUrl} alt={product.name} width={400} height={400} className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-1 rounded-md">
                        {platformIcons[product.platform]}
                    </div>
                    {product.quantity !== null && product.quantity <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Out of Stock</span>
                      </div>
                    )}
                </CardContent>
                <CardHeader>
                    <CardTitle className="truncate">{product.name}</CardTitle>
                     <div className="flex flex-wrap gap-1">
                        {product.categories?.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            return cat ? <Badge key={catId} variant="secondary">{cat.name}</Badge> : null;
                        })}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-lg text-primary">₹{parseFloat(String(product.price)).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity === null ? '∞ in stock' : `${product.quantity} in stock`}
                      </p>
                    </div>
                </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg py-24 px-8">
            <div className="bg-primary/10 p-4 rounded-full"><ShoppingBag className="h-8 w-8 text-primary" /></div>
            <h2 className="mt-6 text-2xl font-semibold">Add your first product</h2>
            <p className="mt-2 text-muted-foreground max-w-xs">Get started by clicking the button to add your first product.</p>
        </div>
      )}
    </div>
  );
}

    