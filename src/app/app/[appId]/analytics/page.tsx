"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';

const mostViewedProductsData = [
  { name: 'Classic Tee', views: 4000 },
  { name: 'Denim Jeans', views: 3000 },
  { name: 'Leather Jacket', views: 2000 },
  { name: 'Sneakers', views: 2780 },
  { name: 'Beanie', views: 1890 },
];

const platformClicksData = [
  { name: 'Instagram', value: 400, color: '#8884d8' },
  { name: 'WhatsApp', value: 300, color: '#82ca9d' },
];

const dailyVisitorsData = [
  { date: 'Mon', visitors: 220 },
  { date: 'Tue', visitors: 180 },
  { date: 'Wed', visitors: 250 },
  { date: 'Thu', visitors: 210 },
  { date: 'Fri', visitors: 300 },
  { date: 'Sat', visitors: 350 },
  { date: 'Sun', visitors: 330 },
];

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyVisitorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Products</CardTitle>
              <CardDescription>Your top 5 most viewed products.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={mostViewedProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform Clicks</CardTitle>
              <CardDescription>Breakdown of clicks on your selling platforms.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformClicksData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {platformClicksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
