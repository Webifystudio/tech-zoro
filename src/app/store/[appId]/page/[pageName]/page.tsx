
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileWarning } from 'lucide-react';

// A simple markdown to HTML converter
const Markdown = ({ content }: { content: string }) => {
    const htmlContent = content
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold my-3">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-muted text-foreground px-1 py-0.5 rounded-sm">$1</code>')
        .replace(/\n/g, '<br />');

    return <div className="prose dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default function StaticPage() {
    const params = useParams();
    const appId = params.appId as string;
    const pageName = params.pageName as string;

    const [pageData, setPageData] = useState<{ content: string; isEnabled: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const formattedTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('-', ' ');

    useEffect(() => {
        if (appId && pageName) {
            const fetchPageContent = async () => {
                setIsLoading(true);
                const appRef = doc(db, 'apps', appId);
                const appSnap = await getDoc(appRef);
                if (appSnap.exists() && appSnap.data().pages?.[pageName]) {
                    setPageData(appSnap.data().pages[pageName]);
                }
                setIsLoading(false);
            };
            fetchPageContent();
        }
    }, [appId, pageName]);
    
    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <Skeleton className="h-10 w-1/3 mb-8" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
            </div>
        )
    }

    if (!pageData || !pageData.isEnabled) {
        return (
            <div className="container mx-auto p-8 text-center">
                <FileWarning className="mx-auto h-16 w-16 text-muted-foreground" />
                <h1 className="mt-4 text-2xl font-bold">Page Not Found</h1>
                <p className="text-muted-foreground">This page is either disabled or does not exist.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-4xl font-extrabold tracking-tight">{formattedTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Markdown content={pageData.content} />
                </CardContent>
            </Card>
        </div>
    );
}
