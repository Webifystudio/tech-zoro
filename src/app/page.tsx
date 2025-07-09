"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import Image from 'next/image';

import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [apps, setApps] = useState<{ id: number; name: string }[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
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

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppName.trim()) {
      setApps([...apps, { id: Date.now(), name: newAppName.trim() }]);
      setNewAppName('');
      setIsDialogOpen(false);
      toast({
        title: "App Created",
        description: `Your new app "${newAppName.trim()}" has been created.`,
      })
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

  if (!isFirebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Firebase Not Configured</CardTitle>
            <CardDescription className="pt-2">
              Please configure your Firebase credentials to enable authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              Create a <code>.env.local</code> file in the root of your project and add your Firebase credentials. See <code>src/lib/firebase.ts</code> for more details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col h-screen bg-muted/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
          
          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search all..."
                className="pl-10 w-full bg-muted/50 border-0 focus-visible:ring-primary focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New App
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create a new app</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new application. This can be changed later.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateApp}>
                        <div className="grid gap-4 py-4">
                            <Input
                                id="name"
                                placeholder="My Awesome App"
                                value={newAppName}
                                onChange={(e) => setNewAppName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Create App</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
            {apps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {apps.map((app) => (
                        <Card key={app.id} className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                             <CardContent className="p-0">
                                <Image
                                    src="https://placehold.co/600x400.png"
                                    alt={app.name}
                                    width={600}
                                    height={400}
                                    className="object-cover w-full h-40"
                                    data-ai-hint="app interface"
                                />
                            </CardContent>
                            <CardHeader>
                                <CardTitle className="truncate">{app.name}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold">Create your first app</h2>
                    <p className="mt-2 text-muted-foreground max-w-xs">
                        Get started by clicking the &quot;New App&quot; button to create your first application.
                    </p>
                </div>
            )}
        </main>
      </div>
    );
  }

  return null;
}
