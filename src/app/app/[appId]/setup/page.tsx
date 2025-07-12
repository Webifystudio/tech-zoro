
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, KeyRound, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SetupSettings {
    firebaseConfig: string;
    imgbbApiKey: string;
}

export default function SetupPage() {
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const appId = params.appId as string;

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState<Partial<SetupSettings>>({
        firebaseConfig: '',
        imgbbApiKey: '',
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) router.push('/login');
            else setUser(currentUser);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (user && db && appId) {
            const fetchSettings = async () => {
                setIsLoading(true);
                const appDocRef = doc(db, 'apps', appId);
                try {
                    const appDocSnap = await getDoc(appDocRef);
                    if (appDocSnap.exists()) {
                        const appData = appDocSnap.data();
                        if (appData.ownerId !== user.uid) {
                            toast({ variant: 'destructive', title: 'Unauthorized', description: "You don't have permission to view this page." });
                            router.push('/');
                            return;
                        }
                        if (appData.setup) {
                            setSettings(appData.setup);
                        }
                    } else {
                        toast({ variant: 'destructive', title: 'App Not Found' });
                        router.push('/');
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch setup data.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSettings();
        }
    }, [user, appId, router, toast]);

    const handleInputChange = (field: keyof SetupSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = async (e: FormEvent) => {
        e.preventDefault();
        if (!db || !appId) return;

        setIsSaving(true);
        try {
            const appDocRef = doc(db, 'apps', appId);
            await updateDoc(appDocRef, { setup: settings });
            toast({ title: "Setup settings saved!" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Save failed", description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <div className="space-y-8"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    }

    return (
        <form onSubmit={handleSaveChanges}>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">App Setup</h1>
                        <p className="text-muted-foreground">Configure the necessary API keys and settings for your application.</p>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-primary" />
                            <CardTitle>Firebase Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            Your app needs its own Firebase project to store data like products and orders.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="firebaseConfig">Firebase Config Object</Label>
                            <Textarea id="firebaseConfig" placeholder={`{\n  apiKey: "...",\n  authDomain: "...",\n  ...\n}`} value={settings.firebaseConfig} onChange={(e) => handleInputChange('firebaseConfig', e.target.value)} rows={8} className="font-mono"/>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Where do I find my Firebase config?</AccordionTrigger>
                                <AccordionContent>
                                    <ol className="list-decimal list-inside space-y-2 text-sm">
                                        <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a> and create a new project.</li>
                                        <li>In your project, click the gear icon next to "Project Overview" and select "Project settings".</li>
                                        <li>In the "Your apps" card, click the web icon (`</>`) to create a new web app.</li>
                                        <li>Give your app a nickname and click "Register app".</li>
                                        <li>You will see a code snippet with `const firebaseConfig = ...`. Copy the entire JavaScript object (the part inside the curly braces `{}`) and paste it above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-6 w-6 text-primary" />
                            <CardTitle>ImgBB API Key</CardTitle>
                        </div>
                        <CardDescription>
                            ImgBB is used for free image hosting. Provide your API key to enable product image uploads.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="imgbbApiKey">API Key</Label>
                            <Input id="imgbbApiKey" placeholder="Your ImgBB API Key" value={settings.imgbbApiKey} onChange={(e) => handleInputChange('imgbbApiKey', e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Where do I find my ImgBB API key?</AccordionTrigger>
                                <AccordionContent>
                                     <ol className="list-decimal list-inside space-y-2 text-sm">
                                        <li>Go to <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">ImgBB.com</a> and create a free account or log in.</li>
                                        <li>After logging in, click on your profile icon in the top right and select "About".</li>
                                        <li>In the navigation bar, click on "API".</li>
                                        <li>Click the "Get API Key" button.</li>
                                        <li>Copy the key from the "Your API key" field and paste it above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardFooter>
                </Card>
            </div>
        </form>
    );
