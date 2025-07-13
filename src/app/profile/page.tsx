
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';

import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
import { uploadImage } from '@/lib/imgbb';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Camera, ImageIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);

  const [theme, setTheme] = useLocalStorage<'default' | 'dark' | 'glass'>('theme', 'default');
  const isGlassEnabled = theme === 'glass';

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      router.push('/login');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setAvatarPreview(currentUser.photoURL);
        
        if (db) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setBannerPreview(userData.bannerUrl || 'https://placehold.co/1200x300.png');
                setBackgroundPreview(userData.backgroundUrl);
            } else {
                 setBannerPreview('https://placehold.co/1200x300.png');
            }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, "apps"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userApps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string }));
        setApps(userApps);
      });
      return () => unsubscribe();
    }
  }, [user]);
  
  const handleThemeToggle = (enabled: boolean) => {
    setTheme(enabled ? 'glass' : 'default');
    // Reload to apply new background styles from root layout
    window.location.reload();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'background') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(previewUrl);
      } else if (type === 'banner') {
        setBannerFile(file);
        setBannerPreview(previewUrl);
      } else {
        setBackgroundFile(file);
        setBackgroundPreview(previewUrl);
      }
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setIsSaving(true);

    try {
      let avatarUrl = user.photoURL;
      let newBannerUrl = bannerPreview;
      let newBackgroundUrl = backgroundPreview;

      const upload = async (file: File, type: string) => {
          const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        const result = await uploadImage(base64Image, `user-${user.uid}-${type}`);
        if(result.url) return result.url;
        throw new Error(`${type} upload failed`);
      };

      if (avatarFile) avatarUrl = await upload(avatarFile, 'avatar');
      if (bannerFile) newBannerUrl = await upload(bannerFile, 'banner');
      if (backgroundFile) newBackgroundUrl = await upload(backgroundFile, 'background');

      await updateProfile(user, {
        displayName: displayName,
        photoURL: avatarUrl,
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
        displayName,
        photoURL: avatarUrl,
        bannerUrl: newBannerUrl,
        backgroundUrl: newBackgroundUrl,
      });

      setUser(auth.currentUser);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully saved.',
      });

      if (backgroundFile) {
          setTimeout(() => window.location.reload(), 1000);
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4 flex justify-between items-center">
        <Link href="/">
           <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
        </Link>
        <Button onClick={() => router.push('/')}>Back to Home</Button>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className={isGlassEnabled ? 'glass-card' : ''}>
          <CardHeader className="p-0">
            <div className="relative">
              <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
              <Image
                src={bannerPreview || "https://placehold.co/1200x300.png"}
                alt="Profile banner"
                width={1200}
                height={300}
                className="w-full h-48 md:h-64 object-cover rounded-t-lg"
                data-ai-hint="profile banner abstract"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4"
                onClick={() => bannerInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Banner
              </Button>
              <div className="absolute -bottom-16 left-8">
                <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
                <div className="relative group">
                   <Avatar className="h-32 w-32 border-4 border-background">
                      <AvatarImage src={avatarPreview || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="text-4xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <div 
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-white" />
                   </div>
                </div>
              </div>
            </div>
            <div className="pt-20 px-6 pb-6">
              <h2 className="text-3xl font-bold">{displayName || 'User'}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Theme Settings</h3>

                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="glass-effect" className="text-base">
                        Enable Glass Effect
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Apply a frosted glass theme to your dashboard.
                      </p>
                    </div>
                    <Switch
                      id="glass-effect"
                      checked={isGlassEnabled}
                      onCheckedChange={handleThemeToggle}
                    />
                  </div>
              </div>

               <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Custom Background</h3>
                     <Card className="p-4 border-dashed">
                        <input type="file" accept="image/*" ref={backgroundInputRef} onChange={(e) => handleFileChange(e, 'background')} className="hidden" />
                        {backgroundPreview ? (
                          <div className="relative group">
                            <Image src={backgroundPreview} alt="Background preview" width={400} height={200} className="w-full rounded-md object-cover aspect-video" />
                            <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button type="button" variant="secondary" onClick={() => backgroundInputRef.current?.click()}>
                                  <Upload className="mr-2 h-4 w-4"/> Change Background
                               </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2 text-center p-8 cursor-pointer aspect-video" onClick={() => backgroundInputRef.current?.click()}>
                            <div className="border-2 border-dashed border-muted-foreground/50 rounded-full p-4">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-semibold">Click to upload background</p>
                            <p className="text-sm text-muted-foreground">This will apply when Glass Effect is on.</p>
                          </div>
                        )}
                      </Card>
                </div>


              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">My Apps</h3>
                {apps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map(app => (
                      <Link href={`/app/${app.id}`} key={app.id}>
                        <div className="border rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer">
                          <p className="font-semibold truncate">{app.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">You haven't created any apps yet. <Link href="/" className="text-primary hover:underline">Create one now!</Link></p>
                )}
              </div>
              <CardFooter className="p-0 pt-6 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
