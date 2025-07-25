
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
import { Loader2, Copy, Upload, Image as ImageIcon2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppSettings {
    name: string;
    description: string;
    logoUrl?: string;
    coverUrl?: string;
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
    logoUrl: '',
    coverUrl: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
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
              logoUrl: appData.customization?.logoUrl || '',
              coverUrl: appData.customization?.coverUrl || '',
          });
          setLogoPreview(appData.customization?.logoUrl);
          setCoverPreview(appData.customization?.coverUrl);
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

  const handleInputChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else {
        setCoverFile(file);
        setCoverPreview(previewUrl);
      }
    }
  };


  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !appId) return;
    setIsSaving(true);

    try {
      let logoUrl = settings.logoUrl;
      let coverUrl = settings.coverUrl;

      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
      };

      if (logoFile) {
        const base64Image = await fileToBase64(logoFile);
        const result = await uploadImage(base64Image);
        if (result.url) {
            logoUrl = result.url;
        } else {
            throw new Error(`Logo upload failed: ${result.error}`);
        }
      }

      if (coverFile) {
        const base64Image = await fileToBase64(coverFile);
        const result = await uploadImage(base64Image);
        if (result.url) {
            coverUrl = result.url;
        } else {
            throw new Error(`Cover image upload failed: ${result.error}`);
        }
      }

      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, {
        name: settings.name,
        description: settings.description,
        'customization.logoUrl': logoUrl,
        'customization.coverUrl': coverUrl,
      });
      
      toast({
        title: 'Settings Saved',
        description: 'Your application settings have been updated.',
      });
      setLogoFile(null);
      setCoverFile(null);
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
                        <CardTitle>Branding Images</CardTitle>
                        <CardDescription>Upload your app's logo and cover image.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>App Logo</Label>
                            <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} className="hidden" />
                            <Card className="aspect-square border-dashed flex items-center justify-center" onClick={() => logoInputRef.current?.click()}>
                            {logoPreview ? (
                                <Image src={logoPreview} alt="Logo preview" width={200} height={200} className="w-full h-full object-contain rounded-md p-4" />
                            ) : (
                                <div className="text-center cursor-pointer p-4">
                                <ImageIcon2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Click to upload logo</p>
                                </div>
                            )}
                            </Card>
                        </div>
                        <div className="space-y-2">
                            <Label>Cover Image</Label>
                            <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} className="hidden" />
                            <Card className="aspect-square border-dashed flex items-center justify-center" onClick={() => coverInputRef.current?.click()}>
                            {coverPreview ? (
                                <Image src={coverPreview} alt="Cover preview" width={200} height={200} className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <div className="text-center cursor-pointer p-4">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Click to upload cover</p>
                                </div>
                            )}
                            </Card>
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
