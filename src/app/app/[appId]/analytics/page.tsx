"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Lightbulb, Map, Smartphone } from 'lucide-react';

// Mock data for demonstration
const visitorsData = [
  { name: 'Mon', visitors: 240 },
  { name: 'Tue', visitors: 139 },
  { name: 'Wed', visitors: 980 },
  { name: 'Thu', visitors: 390 },
  { name: 'Fri', visitors: 480 },
  { name: 'Sat', visitors: 380 },
  { name: 'Sun', visitors: 430 },
];

const productData = [
  { name: 'Classic Tee', views: 4000 },
  { name: 'Summer Shorts', views: 3000 },
  { name: 'Denim Jacket', views: 2000 },
  { name: 'Leather Boots', views: 2780 },
  { name: 'Sun Hat', views: 1890 },
];

const platformData = [
  { name: 'Instagram', value: 400 },
  { name: 'WhatsApp', value: 300 },
  { name: 'Direct', value: 300 },
  { name: 'Other', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const params = useParams();
  const appId = params.appId as string;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your store's performance.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Lightbulb className="h-8 w-8 text-primary mt-1" />
            <div>
              <CardTitle>How to Enable Analytics</CardTitle>
              <CardDescription>Follow these steps to connect your Google Analytics account and view live data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Go to your <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">Google Analytics</a> account and create a new property for your store.</li>
            <li>Find your <strong>Measurement ID</strong> for the web data stream. It will look like <code className="bg-muted px-1.5 py-0.5 rounded">G-XXXXXXXXXX</code>.</li>
            <li>
              Navigate to the{' '}
              <Button variant="link" asChild className="p-0 h-auto font-medium"><Link href={`/app/${appId}/marketing`}>Marketing</Link></Button>
              {' '}page in this dashboard.
            </li>
            <li>Scroll down to the <strong>Google Analytics</strong> card and paste your Measurement ID into the "Google Tag ID" field.</li>
            <li>Click "Save Changes". Data will start appearing here within 24-48 hours.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Visitors Overview</CardTitle>
            <CardDescription>A look at your daily visitors over the last week. (Sample Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={visitorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" name="Unique Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Products</CardTitle>
              <CardDescription>Your top 5 most viewed products. (Sample Data)</CardDescription>
            </CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                    <Legend />
                    <Bar dataKey="views" fill="hsl(var(--primary))" name="Product Views" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform Clicks</CardTitle>
              <CardDescription>Breakdown of clicks by platform. (Sample Data)</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Geo & Device Info</CardTitle>
                <CardDescription>Geographical and device analytics will appear here once Google Analytics is connected.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex items-center gap-4">
                        <Map className="h-12 w-12 text-muted-foreground" />
                        <Smartphone className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Connect Google Analytics</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Follow the guide above to see this data.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
