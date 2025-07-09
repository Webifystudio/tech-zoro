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
import { Instagram, MessageCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface IntegrationSettings {
  instagramUsername: string;
  whatsappNumber: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<IntegrationSettings>>({
    instagramUsername: '',
    whatsappNumber: '',
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
          if (appData.integrations) {
            setSettings(appData.integrations);
          }
        }
        setIsLoading(false);
      };
      fetchSettings();
    }
  }, [user, appId]);

  const handleInputChange = (field: keyof IntegrationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !appId) return;

    setIsSaving(true);
    try {
      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, { integrations: settings });
      toast({ title: "Integration settings saved!" });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveChanges}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">Connect your social and messaging platforms.</p>
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                  <Instagram className="h-6 w-6" />
                  <CardTitle>Instagram</CardTitle>
              </div>
              <CardDescription>Connect your Instagram account to display your feed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="ig-username">Instagram Username</Label>
                  <Input id="ig-username" placeholder="@your-username" value={settings.instagramUsername} onChange={(e) => handleInputChange('instagramUsername', e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  <CardTitle>WhatsApp</CardTitle>
              </div>
              <CardDescription>Enable direct ordering via WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                  <Input id="whatsapp-number" placeholder="+1234567890 (with country code)" value={settings.whatsappNumber} onChange={(e) => handleInputChange('whatsappNumber', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
