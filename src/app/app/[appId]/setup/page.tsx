
"use client";

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
}

interface AppSettings {
    setup: {
        firebaseConfig: FirebaseConfig;
    }
}

export default function AppSetupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const appId = params?.appId as string;

  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    setup: {
        firebaseConfig: {
            apiKey: '',
            authDomain: '',
            projectId: '',
            storageBucket: ''
        },
    }
  });

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
              setup: appData.setup || { firebaseConfig: { apiKey: '', authDomain: '', projectId: '', storageBucket: '' } }
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

  const handleConfigChange = (field: keyof FirebaseConfig, value: string) => {
    setSettings(prev => ({
        ...prev,
        setup: {
            ...prev.setup,
            firebaseConfig: {
                ...prev.setup?.firebaseConfig,
                [field]: value
            }
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
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  const config = settings.setup?.firebaseConfig || { apiKey: '', authDomain: '', projectId: '', storageBucket: '' };

  return (
    <form onSubmit={handleSaveChanges}>
        <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">App Setup</h1>
                <p className="text-muted-foreground">Manage your application's technical configuration.</p>
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <KeyRound className="h-6 w-6 text-primary" />
                    <CardTitle>Firebase Configuration</CardTitle>
                </div>
                <CardDescription>
                    Update your app's Firebase project configuration keys.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input id="apiKey" value={config.apiKey} onChange={(e) => handleConfigChange('apiKey', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="authDomain">Auth Domain</Label>
                        <Input id="authDomain" value={config.authDomain} onChange={(e) => handleConfigChange('authDomain', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="projectId">Project ID</Label>
                        <Input id="projectId" value={config.projectId} onChange={(e) => handleConfigChange('projectId', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="storageBucket">Storage Bucket</Label>
                        <Input id="storageBucket" value={config.storageBucket} onChange={(e) => handleConfigChange('storageBucket', e.target.value)} />
                    </div>
                </div>
            </CardContent>
        </Card>

        </div>
    </form>
  );
}
