"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, FileText, Instagram, MessageCircle } from 'lucide-react';

const mockOrders = [
  { id: 'ORD001', customer: 'John Doe', platform: 'instagram', status: 'responded', date: '2023-10-26' },
  { id: 'ORD002', customer: 'Jane Smith', platform: 'whatsapp', status: 'pending', date: '2023-10-25' },
  { id: 'ORD003', customer: 'Sam Wilson', platform: 'instagram', status: 'responded', date: '2023-10-24' },
  { id: 'ORD004', customer: 'Peter Pan', platform: 'whatsapp', status: 'pending', date: '2023-10-23' },
  { id: 'ORD005', customer: 'Alice Wonderland', platform: 'instagram', status: 'pending', date: '2023-10-22' },
];

const platformIcons = {
    instagram: <Instagram className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
};

const statusVariant = {
  pending: 'secondary',
  responded: 'default',
} as const;

export default function OrdersPage() {
  const renderTableRows = (statusFilter?: 'pending' | 'responded') => {
      const orders = statusFilter ? mockOrders.filter(o => o.status === statusFilter) : mockOrders;

      if (orders.length === 0) {
        return (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No orders found.
            </TableCell>
          </TableRow>
        );
      }

      return orders.map((order) => (
         <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>
                <Badge variant="outline" className="flex items-center gap-2">
                   {platformIcons[order.platform as keyof typeof platformIcons]}
                   <span className="capitalize">{order.platform}</span>
                </Badge>
            </TableCell>
            <TableCell>
                <Badge variant={statusVariant[order.status as keyof typeof statusVariant]}>
                    {order.status}
                </Badge>
            </TableCell>
            <TableCell>{order.date}</TableCell>
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
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Responded</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
            <TabsContent value="all">
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
            <TabsContent value="pending">
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
            <TabsContent value="responded">
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
        </Card>
      </Tabs>
    </div>
  );
}
