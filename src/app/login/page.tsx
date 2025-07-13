
"use client";

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 animate-slide-in-from-bottom [animation-fill-mode:backwards]">
          <div className="grid gap-2 text-center">
            <h1 className="text-5xl font-bold tracking-tight text-primary" style={{fontFamily: "'Brush Script MT', 'Cursive'"}}>ZORO</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          <LoginForm redirectUrl={redirect} />
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href={redirect ? `/register?redirect=${redirect}` : "/register"} className="underline text-primary font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1200x800.png"
          alt="Abstract illustration"
          width={1200}
          height={800}
          className="h-full w-full object-cover dark:brightness-[0.2]"
          data-ai-hint="abstract illustration"
        />
      </div>
    </div>
  );
}
