
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LayoutGrid } from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalApps: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!db) return;
      setIsLoading(true);
      try {
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        const appsSnapshot = await getCountFromServer(collection(db, 'apps'));
        setStats({
          totalUsers: usersSnapshot.data().count,
          totalApps: appsSnapshot.data().count,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardStats = [
    { title: "Total Users", value: stats.totalUsers, icon: Users },
    { title: "Total Apps", value: stats.totalApps, icon: LayoutGrid },
  ];
  
  if (isLoading) {
    return (
       <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide statistics and management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
