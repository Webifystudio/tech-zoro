"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Instagram, Search, Facebook, BarChart, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface MarketingSettings {
  bannerText: string;
  isBannerActive: boolean;
  instagramUsername: string;
  seoTitle: string;
  seoDescription: string;
  facebookPixelId: string;
  googleTagId: string;
}

export default function MarketingPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<MarketingSettings>>({
    bannerText: '',
    isBannerActive: false,
    instagramUsername: '',
    seoTitle: '',
    seoDescription: '',
    facebookPixelId: '',
    googleTagId: ''
  });

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else setUser(currentUser);
    });
  }, [router]);

  useEffect(() => {
    if (user && db && appId) {
      const fetchSettings = async () => {
        setIsLoading(true);
        const appDocRef = doc(db, 'apps', appId);
        const appDocSnap = await getDoc(appDocRef);
        if (appDocSnap.exists()) {
          const appData = appDocSnap.data();
          if (appData.marketing) {
            setSettings(appData.marketing);
          }
        }
        setIsLoading(false);
      };
      fetchSettings();
    }
  }, [user, appId]);

  const handleInputChange = (field: keyof MarketingSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !appId) return;

    setIsSaving(true);
    try {
      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, { marketing: settings });
      toast({ title: "Marketing settings saved!" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Save failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSaveChanges}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
            <p className="text-muted-foreground">Promote your store and reach more customers.</p>
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
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
                  <Input id="banner-text" placeholder="e.g., Free Shipping on all orders!" value={settings.bannerText} onChange={(e) => handleInputChange('bannerText', e.target.value)} />
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
                <Switch id="banner-active" checked={settings.isBannerActive} onCheckedChange={(checked) => handleInputChange('isBannerActive', checked)}/>
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
                  <Input id="ig-username" placeholder="@your-username" value={settings.instagramUsername} onChange={(e) => handleInputChange('instagramUsername', e.target.value)} />
              </div>
              <Button type="button" disabled>Connect Instagram</Button>
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
                  <Input id="seo-title" placeholder="Your Store Name - Tagline" value={settings.seoTitle} onChange={(e) => handleInputChange('seoTitle', e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="seo-desc">Meta Description</Label>
                  <Textarea id="seo-desc" placeholder="A short, catchy description of your store." value={settings.seoDescription} onChange={(e) => handleInputChange('seoDescription', e.target.value)} />
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
                  <Input id="fb-pixel" placeholder="Enter your Pixel ID" value={settings.facebookPixelId} onChange={(e) => handleInputChange('facebookPixelId', e.target.value)} />
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
                  <Input id="ga-tag" placeholder="G-XXXXXXXXXX" value={settings.googleTagId} onChange={(e) => handleInputChange('googleTagId', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
