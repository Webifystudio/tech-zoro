
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Link as LinkIcon, Trash2, Globe } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface DomainMapping {
  id: string;
  domain: string;
  appId: string;
  createdAt: { seconds: number; nanoseconds: number; };
}

export default function DomainManagementPage() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [appId, setAppId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [mappings, setMappings] = useState<DomainMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'domains'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const domainMappings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DomainMapping[];
      setMappings(domainMappings);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching domain mappings: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load domain mappings.' });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleConnectDomain = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !domain.trim() || !appId.trim()) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please enter both a domain and an App ID.' });
        return;
    }
    setIsConnecting(true);
    try {
        await addDoc(collection(db, 'domains'), {
            domain: domain.trim(),
            appId: appId.trim(),
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Domain Connected', description: `Domain ${domain.trim()} is now pointing to app ${appId.trim()}.` });
        setDomain('');
        setAppId('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: error.message });
    } finally {
        setIsConnecting(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
      if (!db) return;
      try {
          await deleteDoc(doc(db, 'domains', id));
          toast({ title: 'Mapping Deleted' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
        <p className="text-muted-foreground">Connect custom domains to user applications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect New Domain</CardTitle>
          <CardDescription>
            Map a custom domain to an App ID. Make sure you have configured the domain's DNS records (A record) to point to this server's IP address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnectDomain} className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Enter domain (e.g., mystore.com)..."
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Enter App ID to connect..."
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Connected Domains</CardTitle>
              <CardDescription>List of all custom domains connected to applications.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Custom Domain</TableHead>
                              <TableHead>App ID</TableHead>
                              <TableHead>Connected At</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mappings.length > 0 ? mappings.map(m => (
                           <TableRow key={m.id}>
                               <TableCell className="font-medium">
                                 <Link href={`http://${m.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-primary">
                                    {m.domain} <Globe className="h-4 w-4" />
                                 </Link>
                               </TableCell>
                               <TableCell>
                                 <Link href={`/app/${m.appId}`} className="hover:underline">
                                  {m.appId}
                                 </Link>
                               </TableCell>
                               <TableCell>{m.createdAt ? format(new Date(m.createdAt.seconds * 1000), 'PPP p') : 'N/A'}</TableCell>
                               <TableCell className="text-right">
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteMapping(m.id)}>
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                               </TableCell>
                           </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No domains connected yet.</TableCell>
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
