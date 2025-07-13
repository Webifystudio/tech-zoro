
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Invitation {
  appId: string;
  appName: string;
  recipientEmail: string;
  inviterName: string;
  role: 'Admin' | 'Staff';
  status: 'pending' | 'accepted' | 'declined';
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.inviteId as string;
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!inviteId || !db) return;

    const fetchInvitation = async () => {
      setIsLoading(true);
      const inviteRef = doc(db, 'invitations', inviteId);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setError("This invitation is invalid or has expired.");
      } else {
        setInvitation(inviteSnap.data() as Invitation);
      }
      setIsLoading(false);
    };

    fetchInvitation();
  }, [inviteId]);

  useEffect(() => {
    if (user && invitation && user.email !== invitation.recipientEmail) {
        setError("This invitation is for a different email address. Please log in with the correct account.");
    } else if (user && invitation && invitation.status !== 'pending') {
        setError("This invitation has already been responded to.");
    } else {
        setError(null);
    }
  }, [user, invitation]);


  const handleAcceptInvite = async () => {
    if (!user || !invitation || !db) return;
    setIsProcessing(true);

    try {
        const batch = writeBatch(db);

        // 1. Update invitation status
        const inviteRef = doc(db, 'invitations', inviteId);
        batch.update(inviteRef, { status: 'accepted' });

        // 2. Add user to the app's team
        const teamMemberRef = doc(collection(db, 'apps', invitation.appId, 'team'));
        batch.set(teamMemberRef, {
            email: user.email,
            role: invitation.role,
            uid: user.uid,
            name: user.displayName,
            avatar: user.photoURL,
        });

        // 3. Add app to the user's list of collaborated apps
        const userRef = doc(db, 'users', user.uid);
        const collaboratedAppRef = doc(collection(userRef, 'collaboratedApps'));
        batch.set(collaboratedAppRef, {
            appId: invitation.appId,
            appName: invitation.appName,
            role: invitation.role,
        });

        await batch.commit();

        toast({
            title: 'Invitation Accepted!',
            description: `You are now a team member of "${invitation.appName}".`,
        });
        router.push('/');

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
        setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md animate-slide-in-from-bottom [animation-fill-mode:backwards]">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">You're Invited!</CardTitle>
                <CardDescription>
                    {invitation ? `${invitation.inviterName} has invited you to collaborate.` : 'Loading invitation...'}
                </CardDescription>
            </CardHeader>
             {invitation && (
                <CardContent className="text-center space-y-6">
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">App Name</p>
                     <p className="text-xl font-semibold">{invitation.appName}</p>
                   </div>
                    <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Your Role</p>
                     <p className="text-xl font-semibold">{invitation.role}</p>
                   </div>
                </CardContent>
            )}
            <CardFooter className="flex flex-col gap-4">
                {user ? (
                     error ? (
                        <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">
                            <XCircle className="mx-auto h-8 w-8 mb-2" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    ) : (
                        <Button className="w-full" onClick={handleAcceptInvite} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Accept Invitation
                        </Button>
                    )
                ) : (
                    <div className="text-center w-full">
                        <p className="text-muted-foreground mb-4">You need to be logged in to accept this invitation.</p>
                        <Button asChild className="w-full">
                           <Link href={`/login?redirect=/invite/${inviteId}`}>Login or Sign Up</Link>
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    </div>
  )
}
