"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Palette, Smartphone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CustomizationPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setter(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Customization</h1>
        <p className="text-muted-foreground">Tailor the look and feel of your online store.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload your store's logo and cover image.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleFileChange(e, setLogoPreview)} className="hidden" />
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
                <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleFileChange(e, setCoverPreview)} className="hidden" />
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
                    <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: 'hsl(var(--primary))' }}/>
                    <Input defaultValue="#34D399" className="max-w-xs" />
                </div>
              </div>
              <Separator />
               <div className="space-y-4">
                <Label>Font Family</Label>
                <Select defaultValue="inter">
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
            <CardFooter>
                <Button>Save Changes</Button>
            </CardFooter>
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
    </div>
  );
}
