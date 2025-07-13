"use client";

import type { FormEvent, ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { uploadImage } from '@/lib/imgbb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Upload, KeyRound, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface AppSettings {
    name: string;
    description: string;
    logoUrl?: string;
    coverUrl?: string;
    setup: {
        firebaseConfig: string;
        imgbbApiKey: string;
    }
}

export default function AppSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const appId = params?.appId as string;

  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    name: '',
    description: '',
    setup: {
        firebaseConfig: '',
        imgbbApiKey: ''
    }
  });
  
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && appId) {
      setPublicUrl(`${window.location.origin}/store/${appId}`);
    }
  }, [appId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user || !db || !appId) return;

    const fetchAppData = async () => {
      setIsLoading(true);
      const appDocRef = doc(db, 'apps', appId);
      try {
        const appDocSnap = await getDoc(appDocRef);
        if (appDocSnap.exists()) {
          const appData = appDocSnap.data();
          if (appData.ownerId !== user.uid) {
            toast({ variant: 'destructive', title: 'Unauthorized', description: "You don't have permission to view these settings." });
            router.push('/');
            return;
          }
          setSettings({
              name: appData.name || '',
              description: appData.description || '',
              setup: appData.setup || { firebaseConfig: '', imgbbApiKey: '' }
          });

        } else {
          toast({ variant: 'destructive', title: 'App not found', description: 'The requested app does not exist.' });
          router.push('/');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch app data.' });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppData();
  }, [user, appId, router, toast]);

  const handleInputChange = (field: keyof Omit<AppSettings, 'setup'>, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSetupChange = (field: 'firebaseConfig' | 'imgbbApiKey', value: string) => {
    setSettings(prev => ({
        ...prev,
        setup: {
            ...(prev.setup || { firebaseConfig: '', imgbbApiKey: '' }),
            [field]: value
        }
    }));
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !appId) return;
    setIsSaving(true);

    try {
      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, {
        name: settings.name,
        description: settings.description,
        setup: settings.setup
      });
      
      toast({
        title: 'Settings Saved',
        description: 'Your application settings have been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save your settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: 'Link Copied!',
      description: 'Your public store URL is now on your clipboard.',
    });
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-2/5" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveChanges}>
        <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
                <p className="text-muted-foreground">Manage your application's configuration and public details.</p>
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Update your app's public information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="appName">Website Name</Label>
                        <Input
                            id="appName"
                            value={settings.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="appDescription">Website Description</Label>
                        <Textarea
                            id="appDescription"
                            value={settings.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Tell us about your website"
                        />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-primary" />
                            <CardTitle>Firebase Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            Update your app's Firebase project configuration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="firebaseConfig">Firebase Config Object</Label>
                            <Textarea id="firebaseConfig" placeholder="{ apiKey: '...', authDomain: '...', ... }" value={settings.setup?.firebaseConfig} onChange={(e) => handleSetupChange('firebaseConfig', e.target.value)} rows={8} className="font-mono"/>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-6 w-6 text-primary" />
                            <CardTitle>ImgBB API Key</CardTitle>
                        </div>
                        <CardDescription>
                            Update your ImgBB API key for image hosting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="imgbbApiKey">API Key</Label>
                            <Input id="imgbbApiKey" placeholder="Your ImgBB API Key" value={settings.setup?.imgbbApiKey} onChange={(e) => handleSetupChange('imgbbApiKey', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle>Share Your Store</CardTitle>
                    <CardDescription>This is the public link to your storefront.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex gap-2">
                        <Input value={publicUrl} readOnly />
                        <Button type="button" variant="outline" size="icon" onClick={handleCopyLink} aria-label="Copy public URL">
                        <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        </div>
    </form>
  );
}