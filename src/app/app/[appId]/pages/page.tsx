
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type PageContent = {
  content: string;
  isEnabled: boolean;
};

type AllPagesContent = {
  contact: PageContent;
  privacy: PageContent;
  terms: PageContent;
};

export default function PagesManager() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  
  const [pagesContent, setPagesContent] = useState<AllPagesContent>({
    contact: { content: '', isEnabled: false },
    privacy: { content: '', isEnabled: false },
    terms: { content: '', isEnabled: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (appId) {
      const fetchPagesContent = async () => {
        setIsLoading(true);
        const appRef = doc(db, 'apps', appId);
        const appSnap = await getDoc(appRef);
        if (appSnap.exists() && appSnap.data().pages) {
          setPagesContent(appSnap.data().pages);
        }
        setIsLoading(false);
      };
      fetchPagesContent();
    }
  }, [appId]);

  const handleContentChange = (page: keyof AllPagesContent, content: string) => {
    setPagesContent(prev => ({
      ...prev,
      [page]: { ...prev[page], content },
    }));
  };

  const handleToggleChange = (page: keyof AllPagesContent, isEnabled: boolean) => {
    setPagesContent(prev => ({
      ...prev,
      [page]: { ...prev[page], isEnabled },
    }));
  };
  
  const handleSaveChanges = async () => {
    if (!appId) return;
    setIsSaving(true);
    try {
      const appRef = doc(db, 'apps', appId);
      await setDoc(appRef, { pages: pagesContent }, { merge: true });
      toast({ title: 'Success', description: 'Pages have been updated successfully.' });
    } catch (error) {
      console.error('Error saving pages:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save page content.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Pages</h1>
          <p className="text-muted-foreground">Edit content for your static pages like Contact, Privacy Policy, etc.</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="contact">
        <TabsList>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
        </TabsList>

        {Object.keys(pagesContent).map(pageKey => {
          const key = pageKey as keyof AllPagesContent;
          return (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center justify-between">
                    <span>{key.replace(/([A-Z])/g, ' $1')} Content</span>
                     <div className="flex items-center space-x-2">
                        <Switch
                          id={`${key}-enabled`}
                          checked={pagesContent[key].isEnabled}
                          onCheckedChange={(checked) => handleToggleChange(key, checked)}
                        />
                        <Label htmlFor={`${key}-enabled`} className="flex items-center gap-2 text-sm font-medium">
                           {pagesContent[key].isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          {pagesContent[key].isEnabled ? 'Visible' : 'Hidden'}
                        </Label>
                    </div>
                  </CardTitle>
                  <CardDescription>Use Markdown for formatting (e.g., `# Heading`, `**bold**`, `*italic*`).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={`Enter content for the ${key} page...`}
                    value={pagesContent[key].content}
                    onChange={(e) => handleContentChange(key, e.target.value)}
                    rows={15}
                    className="font-mono"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
