
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
       <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4 flex justify-between items-center">
        <Link href="/">
           <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
        </Link>
        <Button asChild>
            <Link href="/">Back to Dashboard</Link>
        </Button>
      </header>
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
