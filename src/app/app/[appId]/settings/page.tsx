"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/imgbb';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppSettingsPage({ params }: { params: { appId: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [loginBannerFile, setLoginBannerFile] = useState<File | null>(null);
  const [loginBannerUrl, setLoginBannerUrl] = useState<string | null>(null);
  const [loginBannerPreview, setLoginBannerPreview] = useState<string | null>(null);

  const loginBannerInputRef = useRef<HTMLInputElement>(null);

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
    if (!user || !db || !params.appId) return;

    const fetchAppData = async () => {
      setIsLoading(true);
      const appDocRef = doc(db, 'apps', params.appId);
      try {
        const appDocSnap = await getDoc(appDocRef);
        if (appDocSnap.exists()) {
          const appData = appDocSnap.data();
          if (appData.ownerId !== user.uid) {
            toast({ variant: 'destructive', title: 'Unauthorized', description: "You don't have permission to view these settings." });
            router.push('/');
            return;
          }
          setAppName(appData.name || '');
          setAppDescription(appData.description || '');
          setLoginBannerUrl(appData.loginBannerUrl || null);
          setLoginBannerPreview(appData.loginBannerUrl || null);
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
  }, [user, params.appId, router, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoginBannerFile(file);
      setLoginBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);

    try {
      let finalLoginBannerUrl = loginBannerUrl;

      if (loginBannerFile) {
        const formData = new FormData();
        formData.append('image', loginBannerFile);
        const result = await uploadImage(formData);
        if (result.url) {
          finalLoginBannerUrl = result.url;
        } else {
          throw new Error(result.error || 'Banner upload failed');
        }
      }
      
      const appDocRef = doc(db, 'apps', params.appId);
      await updateDoc(appDocRef, {
        name: appName,
        description: appDescription,
        loginBannerUrl: finalLoginBannerUrl,
      });
      
      setLoginBannerUrl(finalLoginBannerUrl);
      setLoginBannerFile(null);

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
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-48 w-full" />
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
    <div className="space-y-8">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground">Manage your application's configuration and appearance.</p>
      </div>

      <Card>
        <form onSubmit={handleSaveChanges}>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update your app's public information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Website Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appDescription">Website Description</Label>
              <Textarea
                id="appDescription"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Tell us about your website"
              />
            </div>
            <div className="space-y-2">
              <Label>Login Banner (Optional)</Label>
              <Card className="p-4 border-dashed">
                <input type="file" accept="image/*" ref={loginBannerInputRef} onChange={handleFileChange} className="hidden" />
                {loginBannerPreview ? (
                  <div className="relative group">
                    <Image 
                      src={loginBannerPreview}
                      alt="Login banner preview"
                      width={800}
                      height={450}
                      className="w-full rounded-md object-cover"
                      data-ai-hint="website banner"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button type="button" variant="secondary" onClick={() => loginBannerInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4"/> Change Banner
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center space-y-2 text-center p-8 cursor-pointer"
                    onClick={() => loginBannerInputRef.current?.click()}
                  >
                    <div className="border-2 border-dashed border-muted-foreground/50 rounded-full p-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-semibold">Click to upload banner</p>
                    <p className="text-sm text-muted-foreground">Recommended size: 1200x630px</p>
                  </div>
                )}
              </Card>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
