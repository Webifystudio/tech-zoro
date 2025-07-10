
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, Timestamp, addDoc, serverTimestamp, writeBatch, where, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { MoreHorizontal, FileText, Instagram, MessageCircle, Loader2, PlusCircle, Package, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number | null;
}

interface Order {
    id: string;
    customer: string;
    contact?: string;
    platform: 'instagram' | 'whatsapp' | 'manual';
    status: 'pending' | 'responded' | 'completed' | 'shipped' | 'cancelled';
    productName: string;
    productId: string;
    quantity: number;
    price: number;
    createdAt: Timestamp;
}

const platformIcons = {
    instagram: <Instagram className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
    manual: <Package className="h-4 w-4" />,
};

const statusVariant = {
  pending: 'secondary',
  responded: 'default',
  completed: 'default',
  shipped: 'default',
  cancelled: 'destructive'
} as const;

export default function OrdersPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new order
  const [newOrderProduct, setNewOrderProduct] = useState('');
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderContact, setNewOrderContact] = useState('');
  const [newOrderPrice, setNewOrderPrice] = useState('');
  const [newOrderQuantity, setNewOrderQuantity] = useState('1');
  const [newOrderStatus, setNewOrderStatus] = useState<Order['status']>('completed');
  
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db && appId) {
      const q = query(collection(db, "apps", appId, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(userOrders);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching orders:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch orders." });
        setIsLoading(false);
      });
      
      const productsQuery = query(collection(db, "apps", appId, "products"), where("quantity", "!=", 0));
      const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
          setProducts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Product)))
      });

      return () => {
        unsubscribe();
        unsubProducts();
      }
    } else if (!user) {
        setIsLoading(false);
    }
  }, [user, appId, toast]);

  useEffect(() => {
    if (productSearch) {
        setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())));
    } else {
        setFilteredProducts(products);
    }
  }, [productSearch, products]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.customer.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [orders, searchTerm]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!db) return;
    const orderRef = doc(db, "apps", appId, "orders", orderId);
    try {
        await updateDoc(orderRef, { status: newStatus });
        toast({ title: "Order Updated", description: `Order marked as ${newStatus}.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  }
  
  const resetForm = () => {
    setNewOrderProduct('');
    setNewOrderCustomer('');
    setNewOrderContact('');
    setNewOrderPrice('');
    setNewOrderQuantity('1');
    setNewOrderStatus('completed');
    setProductSearch('');
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newOrderProduct || !newOrderCustomer || !newOrderPrice || !db) {
        toast({variant: 'destructive', title: 'Missing fields', description: 'Please fill out all required fields.'});
        return;
    }
    setIsCreating(true);
    try {
      const selectedProduct = products.find(p => p.id === newOrderProduct);
      if (!selectedProduct) throw new Error("Selected product not found.");

      const productRef = doc(db, 'apps', appId, 'products', selectedProduct.id);
      const quantityPurchased = parseInt(newOrderQuantity, 10);
      
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Product does not exist!");
        
        const currentQuantity = productDoc.data().quantity;
        if (currentQuantity !== null && currentQuantity < quantityPurchased) {
          throw new Error("Not enough stock available.");
        }

        if (currentQuantity !== null) {
          transaction.update(productRef, { quantity: currentQuantity - quantityPurchased });
        }
        
        const orderRef = doc(collection(db, 'apps', appId, 'orders'));
        transaction.set(orderRef, {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            customer: newOrderCustomer,
            contact: newOrderContact,
            price: parseFloat(newOrderPrice) * quantityPurchased,
            quantity: quantityPurchased,
            platform: 'manual',
            status: newOrderStatus,
            createdAt: serverTimestamp(),
        });
      });

      toast({ title: "Order Created", description: `A new order has been created.` });
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to create order", description: error.message });
    } finally {
        setIsCreating(false);
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
      if (!db) return;
      try {
          await deleteDoc(doc(db, "apps", appId, "orders", orderId));
          toast({ title: "Order Deleted" });
      } catch (error: any) {
          toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      }
  }

  const renderTableRows = (statusFilter?: Order['status']) => {
      let ordersToRender = filteredOrders;
      if (statusFilter) {
          ordersToRender = ordersToRender.filter(o => o.status === statusFilter);
      }

      if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </TableCell>
            </TableRow>
        );
      }

      if (ordersToRender.length === 0) {
        return (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              No orders found.
            </TableCell>
          </TableRow>
        );
      }

      return ordersToRender.map((order) => (
         <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id.substring(0,6)}...</TableCell>
            <TableCell className="font-medium">{order.productName}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>{order.quantity}</TableCell>
            <TableCell>${order.price.toFixed(2)}</TableCell>
            <TableCell>
                <Badge variant="outline" className="flex items-center gap-2 max-w-min">
                   {platformIcons[order.platform] || <Package className="h-4 w-4"/>}
                   <span className="capitalize">{order.platform}</span>
                </Badge>
            </TableCell>
            <TableCell>
                <Badge variant={statusVariant[order.status]}>
                    <span className="capitalize">{order.status}</span>
                </Badge>
            </TableCell>
            <TableCell>{order.createdAt ? format(order.createdAt.toDate(), 'PPP') : '...'}</TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'pending')}>Mark as Pending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'responded')}>Mark as Responded</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'completed')}>Mark as Completed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>Mark as Shipped</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelled')}>Mark as Cancelled</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteOrder(order.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
      ));
  }
  
  const THead = () => (
    <TableHeader>
        <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
        </TableRow>
    </TableHeader>
  )
  
  const allTabs: Order['status'][] = ['pending', 'responded', 'completed', 'shipped', 'cancelled'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders & Inquiries</h1>
          <p className="text-muted-foreground">Manage and track all customer orders and inquiries.</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Create Order</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Manual Order</DialogTitle>
                        <DialogDescription>Add an order that was placed outside of the storefront.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateOrder}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="product">Product</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            {newOrderProduct ? products.find(p => p.id === newOrderProduct)?.name : "Select a product"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Input 
                                            placeholder="Search products..." 
                                            className="m-2 w-[calc(100%-1rem)]"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                        />
                                        <div className="max-h-48 overflow-y-auto">
                                        {filteredProducts.map(p => (
                                            <Button
                                                key={p.id}
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    setNewOrderProduct(p.id);
                                                    const price = p.price.toString() || '';
                                                    setNewOrderPrice(price);
                                                }}
                                            >
                                                {p.name}
                                            </Button>
                                        ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer">Customer Name</Label>
                                <Input id="customer" value={newOrderCustomer} onChange={e => setNewOrderCustomer(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact">Customer Contact (Email/Phone)</Label>
                                <Input id="contact" value={newOrderContact} onChange={e => setNewOrderContact(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input id="quantity" type="number" min="1" value={newOrderQuantity} onChange={e => setNewOrderQuantity(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Selling Price (per item)</Label>
                                    <Input id="price" type="number" value={newOrderPrice} onChange={e => setNewOrderPrice(e.target.value)} required />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(v) => setNewOrderStatus(v as any)} value={newOrderStatus} required>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="responded">Responded</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Order
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Button variant="outline">
                <FileText className="mr-2 h-4 w-4"/>
                Export
            </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
            <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {allTabs.map(tab => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">{tab}</TabsTrigger>
                ))}
            </TabsList>
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name..."
                  className="w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
                <Table>
                    <THead />
                    <TableBody>
                        {renderTableRows()}
                    </TableBody>
                </Table>
            </TabsContent>
            {allTabs.map(tab => (
              <TabsContent key={tab} value={tab} className="m-0">
                  <Table>
                      <THead />
                      <TableBody>
                          {renderTableRows(tab)}
                      </TableBody>
                  </Table>
              </TabsContent>
            ))}
            </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
