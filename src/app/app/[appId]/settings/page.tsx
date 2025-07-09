"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/imgbb';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';

export default function AppSettingsPage({ params }: { params: { appId: string } }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // In a real app, you'd fetch this data based on appId
  const [appName, setAppName] = useState('My Awesome App');
  const [appDescription, setAppDescription] = useState('This is a great description for an even greater app.');
  const [loginBannerFile, setLoginBannerFile] = useState<File | null>(null);
  const [loginBannerPreview, setLoginBannerPreview] = useState<string | null>(null);

  const loginBannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoginBannerFile(file);
      setLoginBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let loginBannerUrl = loginBannerPreview;

      if (loginBannerFile) {
        const formData = new FormData();
        formData.append('image', loginBannerFile);
        const result = await uploadImage(formData);
        if (result.url) {
          loginBannerUrl = result.url;
          // You would save this URL to your database
          setLoginBannerPreview(loginBannerUrl);
        } else {
          throw new Error(result.error || 'Banner upload failed');
        }
      }
      
      // Here you would save appName, appDescription, and loginBannerUrl to your database
      console.log('Saving data:', { appName, appDescription, loginBannerUrl });

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
