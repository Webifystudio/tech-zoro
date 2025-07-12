
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Eye, Palette, Copy, Check, Timer, RefreshCw, MessageCircle, Zap, StopCircle, CheckCircle, WifiOff } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

type LinkStatus = 'offline' | 'online' | 'expired';

interface AppData {
    canBePublic?: boolean;
    isPublic?: boolean;
}

export default function StorefrontManagementPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [linkStatus, setLinkStatus] = useState<LinkStatus>('offline');
  const [countdown, setCountdown] = useState(1800);
  const [copied, setCopied] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  
  const statusKey = `storefront_status_${appId}`;

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setPublicUrl(`${window.location.origin}/store/${appId}`);
  }, [appId]);

  useEffect(() => {
    if (!appId || !db) return;
    const unsub = onSnapshot(doc(db, 'apps', appId), (doc) => {
      if (doc.exists()) {
        setAppData(doc.data() as AppData);
      }
    });
    return () => unsub();
  }, [appId]);

  useEffect(() => {
    const currentStatus = localStorage.getItem(statusKey) as LinkStatus | null;
    if (currentStatus === 'online') {
      const startTime = localStorage.getItem(`${statusKey}_start_time`);
      if (startTime) {
        const elapsed = (Date.now() - parseInt(startTime, 10)) / 1000;
        if (elapsed < 1800) {
          setLinkStatus('online');
          setCountdown(1800 - Math.floor(elapsed));
        } else {
          setLinkStatus('expired');
          localStorage.setItem(statusKey, 'expired');
        }
      }
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
    localStorage.setItem(`${statusKey}_start_time`, Date.now().toString());
    setCountdown(1800); // 30 minutes
  };
  
  const handleTogglePublish = async () => {
    if (!appId || !db) return;
    setIsUpdating(true);
    try {
        const appRef = doc(db, 'apps', appId);
        await updateDoc(appRef, {
            isPublic: !appData?.isPublic,
            publishedAt: serverTimestamp(),
        });
        toast({ title: `Store ${!appData?.isPublic ? 'Published' : 'Unpublished'}!`, description: `Your store is now ${!appData?.isPublic ? 'live' : 'offline'}.`});
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsUpdating(false);
    }
  }

  const handleCopy = () => {
    const isLive = linkStatus === 'online' || appData?.isPublic;
    if (!publicUrl || !isLive) {
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
                    Online ({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')})
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
                Generate a temporary link to preview your storefront. The link will automatically go offline after 30 minutes for security.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-2">
                <Input value={publicUrl} readOnly className="text-muted-foreground" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopy} disabled={linkStatus !== 'online' && !appData?.isPublic}>
                        {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        Copy
                    </Button>
                    <Button asChild variant="outline" disabled={!publicUrl || (linkStatus !== 'online' && !appData?.isPublic)}>
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
                Preview Status: <span className={`font-semibold ${linkStatus === 'online' ? 'text-green-600' : 'text-destructive'}`}>{linkStatus.toUpperCase()}</span>
            </p>
        </CardFooter>
      </Card>
      
      {appData?.canBePublic ? (
        <Card className="border-primary/20 bg-primary/5">
             <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Go Live! Publish Your Store</CardTitle>
                    <CardDescription>Your store is approved for public access. Publish it to make it available 24/7.</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed">
                   Your permanent link is the same as the preview link. Once published, it will never expire. You can unpublish your store at any time from here.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center">
                 <Button onClick={handleTogglePublish} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (
                        appData.isPublic ? <StopCircle className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>
                    )}
                    {appData.isPublic ? 'Unpublish' : 'Publish'}
                 </Button>
                 <p className="text-sm text-muted-foreground mt-4 sm:mt-0">
                    Public Status: 
                    <span className={`font-semibold ${appData.isPublic ? 'text-green-600' : 'text-destructive'}`}>
                       {appData.isPublic ? ' LIVE' : ' OFFLINE'}
                    </span>
                 </p>
            </CardFooter>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Go Live! Publish Your Store</CardTitle>
                    <CardDescription>Make your store permanently available 24/7 to all your customers.</CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed">
                We provide free services for image hosting and storage, but making your website live 24/7 requires a small hosting fee. 
                The cost is very affordable, under <span className="font-bold">₹100</span>.
                </p>
            </CardContent>
            <CardFooter>
                <Button asChild>
                    <a href={`https://wa.me/9526339491?text=Hi, I'm interested in making my store public. My App ID is: ${appId}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4"/> Pay on WhatsApp
                    </a>
                </Button>
            </CardFooter>
        </Card>
      )}

      {appData?.isPublic && (
        <Card>
            <CardHeader>
                <CardTitle>Connect a Custom Domain</CardTitle>
                <CardDescription>Point your own domain (e.g., your-store.com) to your ZORO store.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>To connect a custom domain, please contact support via WhatsApp with your domain name and App ID.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="outline">
                    <a href={`https://wa.me/9526339491?text=Hi, I want to connect a custom domain. My App ID is: ${appId}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4"/> Contact Support
                    </a>
                 </Button>
            </CardFooter>
        </Card>
      )}

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
