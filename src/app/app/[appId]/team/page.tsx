
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendTeamInvitation } from '@/ai/flows/send-team-invitation-flow';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeamMember {
  id: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Owner';
  avatar?: string;
  name?: string;
  uid?: string;
}

interface AppData {
    name: string;
}

export default function TeamPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Staff' | ''>('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db && appId) {
      // Fetch app data
      const appDocRef = doc(db, "apps", appId);
      const unsubApp = onSnapshot(appDocRef, (doc) => {
          if (doc.exists()) {
            setAppData(doc.data() as AppData);
          }
      });
      
      const teamCollectionRef = collection(db, "apps", appId, "team");
      const q = query(teamCollectionRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
        
        const ownerMember: TeamMember = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || 'Owner',
          email: user.email || '',
          role: 'Owner',
          avatar: user.photoURL || '',
        };

        // Check if owner is already in the list to avoid duplicates
        if (!members.some(m => m.uid === ownerMember.uid)) {
            setTeam([ownerMember, ...members]);
        } else {
            setTeam([ownerMember, ...members.filter(m => m.uid !== ownerMember.uid)]);
        }
        setIsLoading(false);
      }, (error) => {
          console.error("Error fetching team:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not fetch team members." });
          setIsLoading(false);
      });

      return () => {
        unsubscribe();
        unsubApp();
      }
    } else if (!user) {
        setIsLoading(false);
    }
  }, [user, appId, toast]);
  
  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole || !db || !user?.displayName || !appData?.name) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide an email and a role.' });
        return;
    }
    setIsInviting(true);
    try {
        const newInviteRef = await addDoc(collection(db, "invitations"), {
            recipientEmail: inviteEmail,
            role: inviteRole,
            appId: appId,
            appName: appData.name,
            inviterName: user.displayName,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        const invitationLink = `${window.location.origin}/invite/${newInviteRef.id}`;
        await sendTeamInvitation({
            recipientEmail: inviteEmail,
            inviterName: user.displayName,
            appName: appData.name,
            invitationLink: invitationLink
        });

        toast({ title: 'Invite Sent', description: `An invitation has been sent to ${inviteEmail}.` });
        setInviteEmail('');
        setInviteRole('');
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Invite Failed', description: error.message });
    } finally {
        setIsInviting(false);
    }
  }

  const handleRemoveMember = async (memberId: string) => {
      if(!db) return;
      try {
        await deleteDoc(doc(db, "apps", appId, "team", memberId));
        toast({ title: 'Member Removed' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to remove member', description: error.message });
      }
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team & Access</h1>
        <p className="text-muted-foreground">Manage your team members and their roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite New Member</CardTitle>
          <CardDescription>Enter the email and select a role for your new team member.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                  <Label htmlFor="email" className="sr-only">Email Address</Label>
                  <Input type="email" id="email" placeholder="member@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required/>
              </div>
              <div className="w-full sm:w-48 space-y-2">
                  <Label htmlFor="role" className="sr-only">Role</Label>
                   <Select onValueChange={(value) => setInviteRole(value as 'Admin' | 'Staff')} value={inviteRole} required>
                      <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="flex items-end">
                  <Button type="submit" disabled={isInviting}>
                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invite
                  </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Team</CardTitle>
          <CardDescription>A list of all team members in your store.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {team.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{(member.name || member.email).charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.name || 'Invited'}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>{member.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.role !== 'Owner' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
