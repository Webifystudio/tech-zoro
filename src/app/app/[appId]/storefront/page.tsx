"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Eye, Palette } from 'lucide-react';
import Image from 'next/image';

export default function StorefrontManagementPage() {
  const params = useParams();
  const appId = params.appId as string;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storefront</h1>
        <p className="text-muted-foreground">Your customer-facing e-commerce portal.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
               <Image 
                  src="https://placehold.co/600x400.png"
                  alt="Storefront Preview"
                  width={300}
                  height={200}
                  className="rounded-lg shadow-md object-cover"
                  data-ai-hint="ecommerce website"
                />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Globe className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Your Store is Live!</h2>
              </div>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto md:mx-0">
                  This is the public-facing entry point for your customers. Customize it, share it, and start selling.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <Button asChild size="lg">
                  <Link href={`/store/${appId}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-5 w-5" />
                    View Live Storefront
                  </Link>
                </Button>
                 <Button asChild variant="outline" size="lg">
                  <Link href={`/app/${appId}/customization`}>
                    <Palette className="mr-2 h-5 w-5" />
                    Customize
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
