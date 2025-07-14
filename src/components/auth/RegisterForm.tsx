
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
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

export function RegisterForm({ redirectUrl }: { redirectUrl?: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
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
        theme: 'default',
    }, { merge: true });
  }
  
  const handleSuccessfulRegistration = async (user: User) => {
    // Check for email credentials before attempting to send.
    if (!process.env.NEXT_PUBLIC_EMAIL_SERVER_USER || !process.env.NEXT_PUBLIC_EMAIL_SERVER_PASSWORD) {
        console.warn("Welcome email not sent. Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in your .env file.");
        // Silently fail for the user, but warn the developer.
    } else {
        try {
            if (user.email && user.displayName) {
                await sendWelcomeEmail({ email: user.email, username: user.displayName });
            }
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            toast({
                variant: "destructive",
                title: "Could not send welcome email",
                description: "Your registration was successful, but we couldn't send a welcome email. Please contact support if this persists.",
            });
        }
    }
    
    router.push(redirectUrl || '/');
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
        </form>
      </Form>
    </div>
  );
}
