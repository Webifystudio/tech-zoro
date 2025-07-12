
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, getAdditionalUserInfo, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, googleProvider, isFirebaseConfigured, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email-flow';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const usernameSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.26-4.97 2.26-3.98 0-6.92-3.25-6.92-7.3s2.94-7.3 6.92-7.3c2.25 0 3.86.88 4.79 1.8l2.6-2.58C18.94 1.23 16.2 0 12.48 0 5.88 0 .04 5.88.04 12.5s5.84 12.5 12.44 12.5c7.05 0 12.1-4.78 12.1-12.64 0-.87-.1-1.6-.25-2.28H12.48z" />
  </svg>
);

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });
  
  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });
  
  const createUserInFirestore = async (user: User) => {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    }, { merge: true }); // Use merge to avoid overwriting existing data if any
  }
  
  const handleSuccessfulRegistration = async (user: User) => {
    try {
        if (user.email && user.displayName) {
            await sendWelcomeEmail({ email: user.email, username: user.displayName });
        }
    } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Do not block user flow if email fails. Just log it.
        toast({
            variant: "destructive",
            title: "Could not send welcome email",
            description: "Your registration was successful, but we couldn't send a welcome email. Please contact support if this persists.",
        });
    }
    router.push('/');
    router.refresh();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isFirebaseConfigured || !auth) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please configure Firebase to register.",
        });
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      await updateProfile(userCredential.user, {
        displayName: values.username,
      });

      await createUserInFirestore(userCredential.user);

      toast({
        title: "Account created!",
        description: "You have been successfully registered and logged in.",
      });
      await handleSuccessfulRegistration(userCredential.user);
    } catch (error: any) {
      let errorMessage = "There was a problem with your request.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please login or use a different email.";
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please configure Firebase to sign up with Google.",
        });
        return;
    }
    setIsGoogleLoading(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const additionalInfo = getAdditionalUserInfo(result);
        
        await createUserInFirestore(result.user);

        if (additionalInfo?.isNewUser) {
            if (result.user.displayName) {
                toast({ title: "Account created!", description: "Welcome!" });
                await handleSuccessfulRegistration(result.user);
            } else {
                setGoogleUser(result.user);
            }
        } else {
            toast({
                title: "Welcome back!",
                description: "You have been successfully logged in.",
            });
            router.push('/');
            router.refresh();
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-Up Failed",
            description: error.message || "Could not sign you up with Google.",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  async function onUsernameSubmit(values: z.infer<typeof usernameSchema>) {
    if (!googleUser) return;
    setIsLoading(true);
    try {
        await updateProfile(googleUser, {
            displayName: values.username,
        });
        await createUserInFirestore(auth.currentUser!); // Update firestore with new display name
        toast({
            title: "Registration complete!",
            description: "Your profile has been created.",
        });
        await handleSuccessfulRegistration(auth.currentUser!);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Profile update failed",
            description: error.message || "Could not save your username.",
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (googleUser) {
    return (
        <div className="grid gap-4">
             <div className="text-center">
                <h2 className="text-xl font-semibold">Choose a username</h2>
                <p className="text-sm text-muted-foreground">Your username is unique. You can always change it later.</p>
             </div>
            <Form {...usernameForm}>
                <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="grid gap-4">
                    <FormField
                        control={usernameForm.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <Input placeholder="Username" {...field} autoFocus/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Registration
                    </Button>
                </form>
            </Form>
        </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
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
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-center text-muted-foreground px-4">
                By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
            </p>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
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
      <Button variant="outline" className="w-full font-semibold" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
        Sign up with Google
      </Button>
    </div>
  );
}
