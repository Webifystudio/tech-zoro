
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, MoreHorizontal, Trash2, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface User {
  uid: string;
  email: string;
  displayName: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [appId, setAppId] = useState('');
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

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !searchTerm) return;
    setIsSearching(true);
    setFoundUser(null);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchTerm));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'User not found' });
      } else {
        const userData = querySnapshot.docs[0].data() as User;
        setFoundUser({ ...userData, uid: querySnapshot.docs[0].id });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error searching user', description: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!db || !appId || !foundUser) return;
    setIsGranting(true);
    try {
      const appRef = doc(db, 'apps', appId);
      await updateDoc(appRef, {
        canBePublic: true,
        ownerEmail: foundUser.email // Store email for display
      });
      toast({ title: 'Access Granted', description: `${foundUser.email} can now publish app ${appId}.` });
      setFoundUser(null);
      setSearchTerm('');
      setAppId('');
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
          <CardDescription>Search for a user by email to grant them the ability to publish an app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchUser} className="flex gap-2">
            <Input
              placeholder="user@example.com"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search User
            </Button>
          </form>
          {foundUser && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <p>Found user: <span className="font-semibold">{foundUser.displayName}</span> ({foundUser.email})</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter App ID to grant access"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
                <Button onClick={handleGrantAccess} disabled={isGranting || !appId}>
                  {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Give Access
                </Button>
              </div>
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
                               <TableCell>{app.publishedAt ? format(app.publishedAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
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
