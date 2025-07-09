import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 animate-slide-in-from-bottom [animation-fill-mode:backwards]">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to create an account
            </p>
          </div>
          <RegisterForm />
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline text-primary font-medium">
              Login
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
          data-ai-hint="abstract tech"
        />
      </div>
    </div>
  );
}
