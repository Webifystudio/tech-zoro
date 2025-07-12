
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, MoreHorizontal, Trash2, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface FoundApp {
  id: string; // doc id
  name: string;
  ownerId: string;
  ownerEmail?: string;
}

interface PublishedApp {
  id: string; // doc id
  appId: string;
  appName: string;
  ownerEmail: string;
  publishedAt: { seconds: number; nanoseconds: number; };
}

export default function AccessControlPage() {
  const { toast } = useToast();
  const [appIdSearch, setAppIdSearch] = useState('');
  const [foundApp, setFoundApp] = useState<FoundApp | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  
  const [publishedApps, setPublishedApps] = useState<PublishedApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'apps'), where('isPublic', '==', true), orderBy('publishedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        appId: doc.id,
        appName: doc.data().name,
        ownerEmail: doc.data().ownerEmail || 'Unknown',
        publishedAt: doc.data().publishedAt,
      })) as PublishedApp[];
      setPublishedApps(apps);
      setIsLoadingApps(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSearchApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !appIdSearch) return;
    setIsSearching(true);
    setFoundApp(null);
    try {
      const appRef = doc(db, 'apps', appIdSearch);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists()) {
        toast({ variant: 'destructive', title: 'App not found' });
      } else {
        const appData = appSnap.data();
        let ownerEmail = appData.ownerEmail;

        if (!ownerEmail && appData.ownerId) {
          const userRef = doc(db, 'users', appData.ownerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            ownerEmail = userSnap.data().email;
          }
        }
        
        setFoundApp({
            id: appSnap.id,
            name: appData.name,
            ownerId: appData.ownerId,
            ownerEmail: ownerEmail || 'Not found',
        });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error searching app', description: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!db || !foundApp) return;
    setIsGranting(true);
    try {
      const appRef = doc(db, 'apps', foundApp.id);
      await updateDoc(appRef, {
        canBePublic: true,
        ownerEmail: foundApp.ownerEmail
      });
      toast({ title: 'Access Granted', description: `User ${foundApp.ownerEmail} can now publish app ${foundApp.name}.` });
      setFoundApp(null);
      setAppIdSearch('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to grant access', description: error.message });
    } finally {
      setIsGranting(false);
    }
  };

  const handleStopAccess = async (app: PublishedApp) => {
      if (!db) return;
      try {
          const appRef = doc(db, 'apps', app.appId);
          await updateDoc(appRef, {
            isPublic: false,
            canBePublic: false,
          });
          toast({ title: 'Access Revoked', description: `Access for app ${app.appName} has been stopped.`});
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
      }
  };

  const handleDeleteAccess = async (app: PublishedApp) => {
      if (!db) return;
      // This is a more destructive action, for now it will just revoke access.
      // In a real scenario, you might want to delete related data.
      await handleStopAccess(app);
      toast({ title: 'App Un-published', description: `App ${app.appName} has been unpublished.`});
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground">Grant and manage public access for user applications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grant Publishing Access</CardTitle>
          <CardDescription>Search for an application by its ID to grant publishing rights.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchApp} className="flex gap-2">
            <Input
              placeholder="Enter App ID..."
              value={appIdSearch}
              onChange={(e) => setAppIdSearch(e.target.value)}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search App
            </Button>
          </form>
          {foundApp && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div>
                <p>App Name: <span className="font-semibold">{foundApp.name}</span></p>
                <p>Owner Email: <span className="font-semibold">{foundApp.ownerEmail}</span></p>
              </div>
              <Button onClick={handleGrantAccess} disabled={isGranting}>
                {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Give Access
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Published Applications</CardTitle>
              <CardDescription>List of all applications that are currently live.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoadingApps ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>App Name</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Published At</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publishedApps.length > 0 ? publishedApps.map(app => (
                           <TableRow key={app.id}>
                               <TableCell className="font-medium">{app.appName}</TableCell>
                               <TableCell>{app.ownerEmail}</TableCell>
                               <TableCell>{app.publishedAt ? format(new Date(app.publishedAt.seconds * 1000), 'PPP p') : 'N/A'}</TableCell>
                               <TableCell className="text-right">
                                   <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleStopAccess(app)}>
                                                <StopCircle className="mr-2 h-4 w-4" />
                                                Stop Access
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteAccess(app)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                               </TableCell>
                           </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No published apps yet.</TableCell>
                            </TableRow>
                        )}
                      </TableBody>
                  </Table>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
