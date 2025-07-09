import { RegisterForm } from '@/components/auth/RegisterForm';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center bg-background p-4">
       <div className="w-full max-w-sm space-y-4">
        <div className="border border-border/50 rounded-lg p-8 space-y-4">
          <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold tracking-tight text-primary" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
              <h2 className="text-md font-semibold text-muted-foreground px-4">
                Sign up to see photos and videos from your friends.
              </h2>
          </div>
          <div className="flex items-center w-full">
                <Separator className="flex-1" />
                <span className="px-4 text-xs text-muted-foreground font-semibold">OR</span>
                <Separator className="flex-1" />
            </div>
          <RegisterForm />
        </div>
        <div className="border border-border/50 rounded-lg p-6 text-center">
            <p className="text-sm text-foreground">
              Have an account?{' '}
              <Link href="/login" className="font-semibold leading-6 text-primary hover:text-primary/90">
                Log in
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
