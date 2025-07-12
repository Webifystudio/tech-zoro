
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ListChecks, ShoppingBag, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppDashboardPage() {
  const params = useParams();
  const appId = params.appId as string;

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingInquiries: 0,
    totalCategories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId || !db) {
      setIsLoading(false);
      return;
    }

    const collections = {
      products: collection(db, 'apps', appId, 'products'),
      orders: collection(db, 'apps', appId, 'orders'),
      pendingOrders: query(collection(db, 'apps', appId, 'orders'), where('status', '==', 'pending')),
      categories: collection(db, 'apps', appId, 'categories'),
    };

    let loadedCount = 0;
    const totalListeners = Object.keys(collections).length;
    
    const createListener = (q: any, statKey: keyof typeof stats) => {
        return onSnapshot(q, snapshot => {
            setStats(prev => ({ ...prev, [statKey]: snapshot.size }));
            loadedCount++;
            if (loadedCount === totalListeners) {
                setIsLoading(false);
            }
        });
    }

    const unsubscribers = [
      createListener(collections.products, 'totalProducts'),
      createListener(collections.orders, 'totalOrders'),
      createListener(collections.pendingOrders, 'pendingInquiries'),
      createListener(collections.categories, 'totalCategories'),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [appId]);

  const cardStats = [
    { title: "Total Products", value: stats.totalProducts, icon: ShoppingBag, description: "All products in your store" },
    { title: "Total Categories", value: stats.totalCategories, icon: LayoutGrid, description: "Product categories created" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, description: "All orders and inquiries" },
    { title: "Pending Inquiries", value: stats.pendingInquiries, icon: ListChecks, description: "Orders needing a response" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">A real-time summary of your app's performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/app/${appId}/products`}>Add Product</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/app/${appId}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardStats.map((stat, index) => (
          <Card
            key={stat.title}
            className="transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-in-from-bottom"
            style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'backwards' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" asChild><Link href={`/app/${appId}/settings`}>Branding Settings</Link></Button>
          <Button variant="outline" asChild><Link href={`/app/${appId}/marketing`}>Create Promotion</Link></Button>
          <Button variant="outline" asChild><Link href={`/app/${appId}/orders`}>View Orders</Link></Button>
          <Button variant="outline" asChild><Link href={`/app/${appId}/team`}>Invite Team Member</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
