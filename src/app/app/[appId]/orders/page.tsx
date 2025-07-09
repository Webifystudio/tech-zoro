"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, FileText, Instagram, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
    id: string;
    customer: string;
    platform: 'instagram' | 'whatsapp';
    status: 'pending' | 'responded';
    createdAt: Timestamp;
}

const platformIcons = {
    instagram: <Instagram className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
};

const statusVariant = {
  pending: 'secondary',
  responded: 'default',
} as const;

export default function OrdersPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      return () => unsubscribe();
    } else if (!user) {
        setIsLoading(false);
    }
  }, [user, appId, toast]);

  const handleUpdateStatus = async (orderId: string, newStatus: 'pending' | 'responded') => {
    if (!db) return;
    const orderRef = doc(db, "apps", appId, "orders", orderId);
    try {
        await updateDoc(orderRef, { status: newStatus });
        toast({ title: "Order Updated", description: `Order marked as ${newStatus}.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
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

  const renderTableRows = (statusFilter?: 'pending' | 'responded') => {
      const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

      if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </TableCell>
            </TableRow>
        );
      }

      if (filteredOrders.length === 0) {
        return (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No orders found.
            </TableCell>
          </TableRow>
        );
      }

      return filteredOrders.map((order) => (
         <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id.substring(0,6)}...</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>
                <Badge variant="outline" className="flex items-center gap-2 max-w-min">
                   {platformIcons[order.platform]}
                   <span className="capitalize">{order.platform}</span>
                </Badge>
            </TableCell>
            <TableCell>
                <Badge variant={statusVariant[order.status]}>
                    {order.status}
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
                    {order.status === 'pending' && <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'responded')}>Mark as Responded</DropdownMenuItem>}
                    {order.status === 'responded' && <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'pending')}>Mark as Pending</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteOrder(order.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
      ));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders & Inquiries</h1>
        <p className="text-muted-foreground">Manage and track all customer orders and inquiries.</p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="responded">Responded</TabsTrigger>
            </TabsList>
            <Button variant="outline">
                <FileText className="mr-2 h-4 w-4"/>
                Export
            </Button>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows()}
                    </TableBody>
                </Table>
            </TabsContent>
            <TabsContent value="pending" className="m-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows('pending')}
                    </TableBody>
                </Table>
            </TabsContent>
            <TabsContent value="responded" className="m-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows('responded')}
                    </TableBody>
                </Table>
            </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
