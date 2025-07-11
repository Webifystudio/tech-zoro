
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, Shield } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser?.email === 'xpnetwork.tech@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        if (currentUser) {
            router.push('/'); // Redirect logged-in non-admins to home
        } else {
            router.push('/login'); // Redirect logged-out users to login
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4 text-center">
        <div>
            <Shield className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <div className="flex-1">
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
