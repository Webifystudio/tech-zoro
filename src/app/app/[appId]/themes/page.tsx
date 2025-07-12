
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type, CheckCircle, Smartphone, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const themes = [
  { id: 'default', name: 'Default', colors: ['bg-slate-100', 'bg-slate-900', 'bg-emerald-400'] },
  { id: 'dark', name: 'Dark', colors: ['bg-slate-800', 'bg-white', 'bg-emerald-500'] },
  { id: 'matrix', name: 'Matrix', colors: ['bg-black', 'bg-green-400', 'bg-green-600'] },
  { id: 'neon', name: 'Neon', colors: ['bg-indigo-900', 'bg-fuchsia-400', 'bg-cyan-400'] },
  { id: 'blurple', name: 'Blurple', colors: ['bg-indigo-600', 'bg-white', 'bg-indigo-400'] },
  { id: 'midnight', name: 'Midnight', colors: ['bg-gray-900', 'bg-blue-500', 'bg-gray-200'] },
  { id: 'glass', name: 'Glass', colors: ['bg-slate-500/10', 'bg-white', 'bg-blue-400'] },
  { id: 'gradient', name: 'Gradient', colors: ['bg-purple-600', 'bg-pink-500', 'bg-yellow-400'] },
];

interface ThemeSettings {
  theme: string;
  primaryColor: string;
  fontFamily: string;
}

export default function ThemesPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<ThemeSettings>({
    theme: 'default',
    primaryColor: '#34D399',
    fontFamily: 'inter',
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/store/${appId}` : '';

  useEffect(() => {
    if (appId) {
      const fetchSettings = async () => {
        setIsLoading(true);
        const appDocRef = doc(db, 'apps', appId);
        try {
          const appDocSnap = await getDoc(appDocRef);
          if (appDocSnap.exists()) {
            const appData = appDocSnap.data();
            if (appData.customization) {
              setSettings(prev => ({ ...prev, ...appData.customization }));
            }
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: "Could not fetch theme settings." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    }
  }, [appId, toast]);

  useEffect(() => {
    const message = { type: 'theme-change', theme: settings.theme };
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  }, [settings.theme]);


  const handleInputChange = (field: keyof ThemeSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveChanges = async () => {
    if (!db || !appId) return;
    setIsSaving(true);
    try {
      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, { customization: settings });
      setIframeKey(Date.now());
      toast({ title: "Theme saved!" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Save failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
       <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-80" />
              </div>
              <div className="lg:col-span-1">
                  <Skeleton className="h-[600px] sticky top-20" />
              </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Themes</h1>
        <p className="text-muted-foreground">Select a theme to change the appearance of your storefront.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Select a Theme</CardTitle>
              <CardDescription>Click on a theme to apply it to your store preview.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {themes.map((theme) => (
                <div key={theme.id} className="cursor-pointer group" onClick={() => handleInputChange('theme', theme.id)}>
                  <div className={cn(
                    "relative border-2 rounded-lg p-2 transition-all",
                    settings.theme === theme.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                  )}>
                    <div className="aspect-video w-full flex items-center justify-center gap-1 rounded-md overflow-hidden bg-muted p-2">
                      {theme.colors.map((color, i) => (
                         <div key={i} className={cn("h-full w-full rounded-sm", color)} />
                      ))}
                    </div>
                     {settings.theme === theme.id && (
                        <div className="absolute -top-2 -right-2 bg-background rounded-full">
                           <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                     )}
                  </div>
                  <p className="text-center text-sm font-medium mt-2">{theme.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <CardTitle>Primary Color</CardTitle>
                    </div>
                    <CardDescription>Set the main accent color for your theme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="color" 
                            value={settings.primaryColor} 
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="p-1 h-10 w-12"
                        />
                        <Input 
                            value={settings.primaryColor} 
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        <CardTitle>Font Family</CardTitle>
                    </div>
                    <CardDescription>Choose the font for your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={settings.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="poppins">Poppins</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1 lg:sticky top-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Smartphone />
                    <CardTitle>Store Preview</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIframeKey(Date.now())} title="Refresh Preview">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-full shadow-xl">
                 <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background flex flex-col items-center justify-center text-center p-4">
                     {publicUrl ? (
                           <iframe
                                key={iframeKey}
                                ref={iframeRef}
                                src={publicUrl}
                                className="w-full h-full border-0"
                                title="Store Preview"
                           />
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center text-center p-4">
                                <Palette className="mx-auto h-16 w-16 text-muted-foreground" />
                                <p className="mt-4 text-sm font-semibold text-muted-foreground">Your beautiful store preview will appear here.</p>
                            </div>
                        )}
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

       <div className="flex justify-end pt-8">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
    </div>
  );
}

    