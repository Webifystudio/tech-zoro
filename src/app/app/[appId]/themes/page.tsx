
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type, CheckCircle, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const themes = [
  { id: 'default', name: 'Default', colors: ['bg-slate-100', 'bg-slate-900', 'bg-emerald-400'] },
  { id: 'dark', name: 'Dark', colors: ['bg-slate-800', 'bg-white', 'bg-emerald-500'] },
  { id: 'matrix', name: 'Matrix', colors: ['bg-black', 'bg-green-400', 'bg-green-600'] },
  { id: 'neon', name: 'Neon', colors: ['bg-indigo-900', 'bg-fuchsia-400', 'bg-cyan-400'] },
  { id: 'blurple', name: 'Blurple', colors: ['bg-indigo-600', 'bg-white', 'bg-indigo-400'] },
  { id: 'midnight', name: 'Midnight', colors: ['bg-gray-900', 'bg-blue-500', 'bg-gray-200'] },
  { id: 'glass', name: 'Glass', colors: ['bg-slate-500/10', 'bg-white', 'bg-blue-400'] },
  { id: 'gradient', name: 'Gradient', colors: ['bg-purple-600', 'bg-pink-500', 'bg-yellow-400'] },
];

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [primaryColor, setPrimaryColor] = useState('#34D399');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Themes</h1>
        <p className="text-muted-foreground">Select a theme to change the appearance of your storefront.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Select a Theme</CardTitle>
              <CardDescription>Click on a theme to apply it to your store preview.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {themes.map((theme) => (
                <div key={theme.id} className="cursor-pointer group" onClick={() => setSelectedTheme(theme.id)}>
                  <div className={cn(
                    "relative border-2 rounded-lg p-2 transition-all",
                    selectedTheme === theme.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                  )}>
                    <div className="aspect-video w-full flex items-center justify-center gap-1 rounded-md overflow-hidden bg-muted p-2">
                      {theme.colors.map((color, i) => (
                         <div key={i} className={cn("h-full w-full rounded-sm", color)} />
                      ))}
                    </div>
                     {selectedTheme === theme.id && (
                        <div className="absolute -top-2 -right-2 bg-background rounded-full">
                           <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                     )}
                  </div>
                  <p className="text-center text-sm font-medium mt-2">{theme.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <CardTitle>Primary Color</CardTitle>
                    </div>
                    <CardDescription>Set the main accent color for your theme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="color" 
                            value={primaryColor} 
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="p-1 h-10 w-12"
                        />
                        <Input 
                            value={primaryColor} 
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        <CardTitle>Font Family</CardTitle>
                    </div>
                    <CardDescription>Choose the font for your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select defaultValue="inter">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="poppins">Poppins</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1 lg:sticky top-20">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone />
                <CardTitle>Store Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-full shadow-xl">
                 <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background flex flex-col items-center justify-center text-center p-4">
                    <Image
                        src="https://placehold.co/600x400.png"
                        alt="Storefront Preview"
                        width={300}
                        height={200}
                        className="rounded-lg shadow-md object-cover"
                        data-ai-hint="ecommerce website"
                    />
                    <p className="mt-4 font-semibold text-muted-foreground">Live preview will be available here.</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

       <div className="flex justify-end pt-8">
            <Button>
                Save Changes
            </Button>
        </div>
    </div>
  );
}
