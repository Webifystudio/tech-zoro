
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function ReviewsPage() {

  return (
    <div className="space-y-8">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Testimonials / Reviews</h1>
            <p className="text-muted-foreground">Manage customer feedback and display it on your store.</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Star className="h-6 w-6" /><CardTitle>Coming Soon</CardTitle></div>
            <CardDescription>This feature is currently under development.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-border rounded-lg">
                <Star className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Coming Soon!</h3>
                <p className="mt-1 text-sm text-muted-foreground">This feature is under development.</p>
            </div>
          </CardContent>
           <CardFooter>
            <Button variant="outline" disabled>Manage Reviews</Button>
          </CardFooter>
        </Card>
    </div>
  );
}
