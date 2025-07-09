"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const appId = params?.appId as string;

  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');

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
          setAppName(appData.name || '');
          setAppDescription(appData.description || '');
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

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !appId) return;
    setIsSaving(true);

    try {
      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, {
        name: appName,
        description: appDescription,
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
    <div className="space-y-8">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground">Manage your application's configuration and public details.</p>
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
