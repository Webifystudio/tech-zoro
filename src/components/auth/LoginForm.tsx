
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, googleProvider, isFirebaseConfigured, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email-flow';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.26-4.97 2.26-3.98 0-6.92-3.25-6.92-7.3s2.94-7.3 6.92-7.3c2.25 0 3.86.88 4.79 1.8l2.6-2.58C18.94 1.23 16.2 0 12.48 0 5.88 0 .04 5.88.04 12.5s5.84 12.5 12.44 12.5c7.05 0 12.1-4.78 12.1-12.64 0-.87-.1-1.6-.25-2.28H12.48z" />
    </svg>
);

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isFirebaseConfigured || !auth) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please configure Firebase to log in.",
        });
        return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
      router.refresh(); 
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "There was a problem with your request.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please configure Firebase to log in with Google.",
        });
        return;
    }
    setIsGoogleLoading(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const additionalInfo = getAdditionalUserInfo(result);
        
        // If it's a new user, create their document in Firestore and send a welcome email
        if (additionalInfo?.isNewUser) {
            if (db) {
                await setDoc(doc(db, 'users', result.user.uid), {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                }, { merge: true });
            }
            if (result.user.email && result.user.displayName) {
                await sendWelcomeEmail({ email: result.user.email, username: result.user.displayName });
            }
             toast({ title: 'Account created!', description: "Welcome! We're glad to have you." });
        } else {
            toast({ title: "Welcome back!"});
        }
        
        router.push('/');
        router.refresh();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Login Failed",
            description: error.message || "Could not log you in with Google.",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                 <div className="flex items-center">
                    <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                    >
                        Forgot your password?
                    </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
      <Button variant="outline" className="w-full font-semibold" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
        Login with Google
    </Button>
    </div>
  );
}
