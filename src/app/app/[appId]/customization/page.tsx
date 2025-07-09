"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Palette, Smartphone, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/imgbb';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomizationSettings {
  logoUrl: string | null;
  coverUrl: string | null;
  primaryColor: string;
  fontFamily: string;
}

export default function CustomizationPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<CustomizationSettings>({
    logoUrl: null,
    coverUrl: null,
    primaryColor: '#34D399',
    fontFamily: 'inter',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  useEffect(() => {
    if (user && db && appId) {
      const fetchSettings = async () => {
        setIsLoading(true);
        const appDocRef = doc(db, 'apps', appId);
        const appDocSnap = await getDoc(appDocRef);
        if (appDocSnap.exists()) {
          const appData = appDocSnap.data();
          if (appData.customization) {
            setSettings(appData.customization);
            setLogoPreview(appData.customization.logoUrl);
            setCoverPreview(appData.customization.coverUrl);
          }
        }
        setIsLoading(false);
      };
      fetchSettings();
    }
  }, [user, appId]);

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

  const handleInputChange = (field: keyof CustomizationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!db || !appId) return;
    setIsSaving(true);
    try {
      let updatedSettings = { ...settings };

      if (logoFile) {
        const formData = new FormData();
        formData.append('image', logoFile);
        const result = await uploadImage(formData);
        if(result.url) updatedSettings.logoUrl = result.url;
        else throw new Error('Logo upload failed');
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append('image', coverFile);
        const result = await uploadImage(formData);
        if(result.url) updatedSettings.coverUrl = result.url;
        else throw new Error('Cover upload failed');
      }

      const appDocRef = doc(db, 'apps', appId);
      await updateDoc(appDocRef, { customization: updatedSettings });
      setSettings(updatedSettings);
      setLogoFile(null);
      setCoverFile(null);
      toast({ title: "Customization saved!" });

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
        <h1 className="text-3xl font-bold tracking-tight">Store Customization</h1>
        <p className="text-muted-foreground">Tailor the look and feel of your online store.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload your store's logo and cover image.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} className="hidden" />
                <Card className="aspect-square border-dashed flex items-center justify-center" onClick={() => logoInputRef.current?.click()}>
                  {logoPreview ? (
                     <Image src={logoPreview} alt="Logo preview" width={200} height={200} className="w-full h-full object-contain rounded-md p-4" />
                  ) : (
                    <div className="text-center cursor-pointer p-4">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
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

          <Card>
            <CardHeader>
              <CardTitle>Colors & Fonts</CardTitle>
              <CardDescription>Choose your brand colors and typography.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: settings.primaryColor }}/>
                    <Input value={settings.primaryColor} onChange={(e) => handleInputChange('primaryColor', e.target.value)} className="max-w-xs" />
                </div>
              </div>
              <Separator />
               <div className="space-y-4">
                <Label>Font Family</Label>
                <Select value={settings.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center gap-2">
                <Smartphone />
                <CardTitle>Store Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="w-[140px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-background">
                        <div className="h-full w-full bg-muted flex items-center justify-center text-center p-4">
                            <div>
                                <Palette className="mx-auto h-16 w-16 text-muted-foreground" />
                                <p className="mt-4 text-sm font-semibold text-muted-foreground">Your beautiful store preview will appear here.</p>
                            </div>
                        </div>
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
