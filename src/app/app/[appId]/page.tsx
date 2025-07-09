"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, ShoppingCart, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AppDashboardPage() {
  const params = useParams();
  const appId = params.appId as string;

  const cardStats = [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1% from last month", icon: DollarSign },
    { title: "Total Users", value: "+2350", change: "+180.1% from last month", icon: Users },
    { title: "New Orders", value: "+12", change: "+5 since yesterday", icon: ShoppingCart },
    { title: "Pending Inquiries", value: "3", change: "Respond to them in the orders tab", icon: ListChecks },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground">A quick summary of your app's performance.</p>
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
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
        ))}
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild><Link href={`/app/${appId}/customization`}>Customize Store</Link></Button>
              <Button variant="outline" asChild><Link href={`/app/${appId}/marketing`}>Create Promotion</Link></Button>
              <Button variant="outline" asChild><Link href={`/app/${appId}/orders`}>View Orders</Link></Button>
              <Button variant="outline" asChild><Link href={`/app/${appId}/team`}>Invite Team Member</Link></Button>
          </CardContent>
      </Card>
    </div>
  );
}
