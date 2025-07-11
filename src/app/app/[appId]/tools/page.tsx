
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Puzzle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useParams } from 'next/navigation';

const availableExtensions = [
  {
    id: 'coupons',
    name: 'Discount Coupons',
    description: 'Create and manage discount codes for your customers to boost sales.',
    href: 'tools/coupons',
  },
  {
    id: 'qrcode',
    name: 'QR Code Generator',
    description: 'Generate a QR code that links to your store or any URL.',
    href: 'tools/qrcode',
  },
  {
    id: 'reviews',
    name: 'Testimonials / Reviews',
    description: 'Manage customer feedback and display it on your store.',
    href: 'tools/reviews',
    comingSoon: true,
  },
];

export default function ExtensionsPage() {
  const { toast } = useToast();
  const params = useParams();
  const appId = params.appId as string;
  const [installedExtensions, setInstalledExtensions] = useLocalStorage<string[]>(`installed_extensions_${appId}`, ['coupons']);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInstall = (extensionId: string) => {
    if (!installedExtensions.includes(extensionId)) {
      setInstalledExtensions([...installedExtensions, extensionId]);
      toast({
        title: 'Extension Installed!',
        description: `${availableExtensions.find(e => e.id === extensionId)?.name} is now available in your sidebar.`,
      });
      // Force a re-render of the sidebar if it's dynamic
      window.dispatchEvent(new Event('storage'));
    }
  };
  
  const filteredExtensions = availableExtensions.filter(ext => ext.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Extensions</h1>
        <p className="text-muted-foreground">Discover and install tools to enhance your store.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for extensions..."
          className="w-full pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExtensions.map(ext => (
           <Card key={ext.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Puzzle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{ext.name}</CardTitle>
                  {ext.comingSoon && <span className="text-xs font-semibold text-primary">COMING SOON</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{ext.description}</CardDescription>
            </CardContent>
            <CardContent>
              {installedExtensions.includes(ext.id) ? (
                 <Button variant="outline" className="w-full" disabled>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Installed
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleInstall(ext.id)} disabled={ext.comingSoon}>
                  Install Extension
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
