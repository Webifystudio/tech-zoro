
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Eye, Palette, Copy, Check, Timer, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type LinkStatus = 'offline' | 'online' | 'expired';

export default function StorefrontManagementPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();

  const [linkStatus, setLinkStatus] = useState<LinkStatus>('offline');
  const [countdown, setCountdown] = useState(60);
  const [copied, setCopied] = useState(false);
  
  const publicUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/store/${appId}`;
    }
    return '';
  }, [appId]);
  
  const statusKey = useMemo(() => `storefront_status_${appId}`, [appId]);

  // Sync state with localStorage on initial load
  useEffect(() => {
    const currentStatus = localStorage.getItem(statusKey) as LinkStatus | null;
    if (currentStatus === 'online') {
      setLinkStatus('online');
    } else {
      setLinkStatus(currentStatus || 'offline');
    }
  }, [statusKey]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (linkStatus === 'online') {
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else {
            setLinkStatus('expired');
            localStorage.setItem(statusKey, 'expired');
            toast({
                title: "Preview Link Expired",
                description: "Your temporary storefront link has gone offline.",
            });
        }
    }
    return () => clearInterval(timer);
  }, [linkStatus, countdown, toast, statusKey]);

  const handleStart = () => {
    setLinkStatus('online');
    localStorage.setItem(statusKey, 'online');
    setCountdown(60);
  };

  const handleCopy = () => {
    if (!publicUrl || linkStatus !== 'online') {
        toast({ variant: 'destructive', title: "Link is Offline", description: "You can only copy the link when it's online." });
        return;
    };
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({ title: "Link Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getButton = () => {
      switch(linkStatus) {
          case 'online':
              return (
                 <Button size="lg" disabled className="w-full md:w-auto bg-green-500 hover:bg-green-600">
                    <Timer className="mr-2 h-5 w-5 animate-pulse" />
                    Online ({countdown}s)
                </Button>
              );
          case 'expired':
               return (
                <Button size="lg" onClick={handleStart} className="w-full md:w-auto">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Renew Link
                </Button>
              );
          case 'offline':
          default:
              return (
                <Button size="lg" onClick={handleStart} className="w-full md:w-auto">
                    <Globe className="mr-2 h-5 w-5" />
                    Start Preview
                </Button>
              );
      }
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storefront</h1>
        <p className="text-muted-foreground">Your customer-facing e-commerce portal.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Live Preview Link</CardTitle>
            <CardDescription>
                Generate a temporary link to preview your storefront. The link will automatically go offline after 60 seconds for security.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-2">
                <Input value={publicUrl} readOnly className="text-muted-foreground" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopy} disabled={linkStatus !== 'online'}>
                        {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        Copy
                    </Button>
                    <Button asChild variant="outline" disabled={linkStatus !== 'online'}>
                        <Link href={publicUrl} target="_blank">
                             <Eye className="mr-2 h-4 w-4"/> Visit
                        </Link>
                    </Button>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-b-lg">
            {getButton()}
            <p className="text-sm text-muted-foreground text-center md:text-right">
                Status: <span className={`font-semibold ${linkStatus === 'online' ? 'text-green-600' : 'text-destructive'}`}>{linkStatus.toUpperCase()}</span>
            </p>
        </CardFooter>
      </Card>

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
                  <Palette className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Customize Your Store</h2>
              </div>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto md:mx-0">
                  This is the public-facing entry point for your customers. Customize it, share it, and start selling.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                 <Button asChild size="lg">
                  <Link href={`/app/${appId}/customization`}>
                    <Palette className="mr-2 h-5 w-5" />
                    Customize Store
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
