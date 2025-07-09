import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="border border-border/50 rounded-lg p-8 space-y-6">
          <h1 className="text-center text-5xl font-bold tracking-tight text-primary" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
          <LoginForm />
        </div>
        <div className="border border-border/50 rounded-lg p-6 text-center">
            <p className="text-sm text-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold leading-6 text-primary hover:text-primary/90">
                Sign up
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
