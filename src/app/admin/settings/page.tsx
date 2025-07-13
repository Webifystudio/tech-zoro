
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [tutorialLink, setTutorialLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const fetchSettings = async () => {
      setIsLoading(true);
      const settingsRef = doc(db, 'settings', 'general');
      try {
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          setTutorialLink(docSnap.data().tutorialLink || '');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    const settingsRef = doc(db, 'settings', 'general');
    try {
      await setDoc(settingsRef, { tutorialLink }, { merge: true });
      toast({ title: 'Settings Saved', description: 'The tutorial link has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">Manage platform-wide configurations.</p>
      </div>
      <form onSubmit={handleSaveSettings}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Settings className="h-6 w-6" />
                <CardTitle>Global Settings</CardTitle>
            </div>
            <CardDescription>These settings affect all users on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tutorialLink">API Key Tutorial Link</Label>
              <Input
                id="tutorialLink"
                placeholder="https://youtube.com/watch?v=..."
                value={tutorialLink}
                onChange={(e) => setTutorialLink(e.target.value)}
              />
               <p className="text-xs text-muted-foreground">
                This link will be shown to users when they create a new app.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
