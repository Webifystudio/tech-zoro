"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WifiOff, AreaChart, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

const ComingSoonPlaceholder = ({title}: {title: string}) => (
    <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg p-8 min-h-[300px]">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
            {title.includes("Visitor") && <AreaChart className="h-8 w-8 text-primary" />}
            {title.includes("Product") && <BarChart2 className="h-8 w-8 text-primary" />}
            {title.includes("Platform") && <PieChartIcon className="h-8 w-8 text-primary" />}
            {title.includes("Geo") && <WifiOff className="h-8 w-8 text-primary" />}
        </div>
        <h3 className="text-xl font-semibold">Analytics Coming Soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">Connect your data source to see live analytics.</p>
    </div>
);


export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your store's performance.</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Visitors Overview</CardTitle>
            <CardDescription>A look at your daily visitors over the last week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ComingSoonPlaceholder title="Visitors Overview" />
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Products</CardTitle>
              <CardDescription>Your top 5 most viewed products.</CardDescription>
            </CardHeader>
            <CardContent>
                <ComingSoonPlaceholder title="Most Viewed Products" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform Clicks</CardTitle>
              <CardDescription>Breakdown of clicks on your selling platforms.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComingSoonPlaceholder title="Platform Clicks" />
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Geo & Device Info</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-border rounded-lg">
                    <WifiOff className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Coming Soon!</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Geographical and device analytics are under development.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
