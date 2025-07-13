
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';

import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, User, MoreVertical, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';

interface App {
    id: string;
    name: string;
    isOwner: boolean;
}

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [apps, setApps] = useState<App[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);
  const [tutorialLink, setTutorialLink] = useState('');

  // Form state for the creation dialog
  const [newAppName, setNewAppName] = useState('');
  const [newFirebaseConfig, setNewFirebaseConfig] = useState('');
  const [newImgbbApiKey, setNewImgbbApiKey] = useState('');
  
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      router.push('/login');
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  useEffect(() => {
    if (db) {
      const fetchSettings = async () => {
        const settingsRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          setTutorialLink(docSnap.data().tutorialLink || '');
        }
      };
      fetchSettings();
    }
  }, []);

  useEffect(() => {
    if (user && db) {
        // Listener for owned apps
        const ownedQuery = query(collection(db, "apps"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubOwned = onSnapshot(ownedQuery, (snapshot) => {
            const ownedApps = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, isOwner: true }));
            setApps(prev => [...ownedApps, ...prev.filter(p => !p.isOwner)]);
        }, (error) => {
            console.error("Error fetching owned apps:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your apps." });
        });

        // Listener for collaborated apps
        const collaboratedQuery = query(collection(db, `users/${user.uid}/collaboratedApps`));
        const unsubCollaborated = onSnapshot(collaboratedQuery, (snapshot) => {
            const collaboratedApps = snapshot.docs.map(doc => ({ id: doc.data().appId, name: doc.data().appName, isOwner: false }));
            setApps(prev => [...collaboratedApps, ...prev.filter(p => p.isOwner)]);
        }, (error) => {
            console.error("Error fetching collaborated apps:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch collaborated apps." });
        });

        return () => {
            unsubOwned();
            unsubCollaborated();
        };
    }
  }, [user, toast]);


  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "Could not log you out.",
      });
    }
  };

  const resetForm = () => {
    setNewAppName('');
    setNewFirebaseConfig('');
    setNewImgbbApiKey('');
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newFirebaseConfig.trim() || !newImgbbApiKey.trim() || !user || !db) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all the required fields.'});
      return;
    }
    
    setIsCreatingApp(true);
    try {
      const newAppRef = await addDoc(collection(db, "apps"), {
        name: newAppName.trim(),
        ownerId: user.uid,
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        setup: {
          firebaseConfig: newFirebaseConfig,
          imgbbApiKey: newImgbbApiKey,
        }
      });
      
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "App Created!",
        description: `Redirecting you to the dashboard for "${newAppName.trim()}".`,
      });
      router.push(`/app/${newAppRef.id}`);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Failed to create app",
            description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleDeleteApp = async () => {
    if (!appToDelete || !db) return;
    
    try {
        await deleteDoc(doc(db, "apps", appToDelete));
        toast({ title: "App Deleted", description: "The application has been successfully deleted." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion failed', description: error.message });
    } finally {
        setAppToDelete(null);
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
     <>
      <AlertDialog>
        <div className="flex min-h-screen w-full flex-col bg-muted/20">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <Link href="/">
              <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || "User"} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>
                    <p className="font-medium truncate">{user.displayName || "No name"}</p>
                    <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                   {user.email === 'xpnetwork.tech@gmail.com' && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/admin">
                            <User className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                        </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex flex-1 flex-col items-center p-4 py-12 sm:p-6 md:p-8">
            <div className="w-full max-w-3xl text-center animate-slide-in-from-bottom [animation-fill-mode:backwards]">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Make your business websites by creating an app
              </h2>
              <div className="mt-8 flex w-full items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search all..."
                    className="w-full rounded-full bg-background pl-11 pr-4 py-2 text-base h-12 shadow-sm focus-visible:ring-primary focus-visible:ring-2"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="rounded-full h-12 w-12 flex-shrink-0 shadow-sm">
                      <Plus className="h-6 w-6" />
                      <span className="sr-only">New App</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                          <DialogTitle>Create a new app</DialogTitle>
                          <DialogDescription>
                              Enter a name for your new application and provide the necessary keys to get started.
                          </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateApp}>
                          <ScrollArea className="max-h-[70vh] p-1">
                              <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="name">App Name</Label>
                                      <Input
                                          id="name"
                                          placeholder="My Awesome App"
                                          value={newAppName}
                                          onChange={(e) => setNewAppName(e.target.value)}
                                          autoFocus
                                          required
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="firebaseConfig">Firebase Config</Label>
                                       <Textarea
                                          id="firebaseConfig"
                                          placeholder="{ apiKey: '...', authDomain: '...', ... }"
                                          value={newFirebaseConfig}
                                          onChange={(e) => setNewFirebaseConfig(e.target.value)}
                                          rows={6}
                                          className="font-mono text-xs"
                                          required
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="imgbbApiKey">ImgBB API Key</Label>
                                      <Input
                                          id="imgbbApiKey"
                                          placeholder="Your ImgBB API Key"
                                          value={newImgbbApiKey}
                                          onChange={(e) => setNewImgbbApiKey(e.target.value)}
                                          required
                                      />
                                  </div>
                                  {tutorialLink && (
                                    <p className="text-sm text-muted-foreground">
                                        Need help finding these keys? <a href={tutorialLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">Click here and watch the tutorial</a>.
                                    </p>
                                  )}
                              </div>
                          </ScrollArea>
                          <DialogFooter className="pt-4">
                            <DialogClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isCreatingApp}>
                              {isCreatingApp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Create App
                            </Button>
                          </DialogFooter>
                      </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="mt-12 w-full max-w-7xl">
              {apps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {apps.map((app) => (
                          <Card key={app.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                             <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80">
                                          <MoreVertical className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      {app.isOwner ? (
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAppToDelete(app.id); }} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                      ) : (
                                          <DropdownMenuItem disabled>Leave (coming soon)</DropdownMenuItem>
                                      )}
                                  </DropdownMenuContent>
                              </DropdownMenu>

                            <Link href={`/app/${app.id}`} className="block">
                                <CardContent className="p-0 relative">
                                    <Image
                                        src="https://placehold.co/600x400.png"
                                        alt={app.name}
                                        width={600}
                                        height={400}
                                        className="object-cover w-full h-40 group-hover:scale-105 transition-transform duration-300"
                                        data-ai-hint="app interface"
                                    />
                                    {!app.isOwner && (
                                        <div title="Collaborated App" className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                    )}
                                </CardContent>
                                <CardHeader>
                                    <CardTitle className="truncate">{app.name}</CardTitle>
                                </CardHeader>
                            </Link>
                          </Card>
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg py-24 px-8">
                      <div className="bg-primary/10 p-4 rounded-full">
                          <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="mt-6 text-2xl font-semibold">Create your first app</h2>
                      <p className="mt-2 text-muted-foreground max-w-xs">
                          Get started by clicking the plus button to create your first application.
                      </p>
                  </div>
              )}
            </div>
          </main>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              application and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApp} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
     </>
    );
  }

  return null;
}
