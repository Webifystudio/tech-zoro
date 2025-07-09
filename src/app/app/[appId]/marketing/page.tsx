"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Instagram, Search, Facebook, BarChart } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground">Promote your store and reach more customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                <CardTitle>Promo Banners</CardTitle>
            </div>
            <CardDescription>Create promotional banners to display on your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="banner-text">Banner Text</Label>
                <Input id="banner-text" placeholder="e.g., Free Shipping on all orders!" />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="banner-active" className="text-base">
                  Activate Banner
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show this banner on your storefront.
                </p>
              </div>
              <Switch id="banner-active" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Instagram className="h-6 w-6" />
                <CardTitle>Instagram Feed</CardTitle>
            </div>
            <CardDescription>Integrate your Instagram feed directly into your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ig-username">Instagram Username</Label>
                <Input id="ig-username" placeholder="@your-username" />
            </div>
            <Button>Connect Instagram</Button>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Search className="h-6 w-6" />
                <CardTitle>SEO Settings</CardTitle>
            </div>
            <CardDescription>Optimize your store for search engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="seo-title">Meta Title</Label>
                <Input id="seo-title" placeholder="Your Store Name - Tagline" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="seo-desc">Meta Description</Label>
                <Textarea id="seo-desc" placeholder="A short, catchy description of your store." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <Facebook className="h-6 w-6" />
                <CardTitle>Facebook Pixel</CardTitle>
            </div>
            <CardDescription>Track conversions from Facebook ads.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
                <Input id="fb-pixel" placeholder="Enter your Pixel ID" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <BarChart className="h-6 w-6" />
                <CardTitle>Google Analytics</CardTitle>
            </div>
            <CardDescription>Integrate Google Analytics for detailed insights.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                <Label htmlFor="ga-tag">Google Tag ID</Label>
                <Input id="ga-tag" placeholder="G-XXXXXXXXXX" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
