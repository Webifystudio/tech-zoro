import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col justify-center items-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-5xl font-bold tracking-tight text-primary">ZORO</h1>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          Create a new account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold leading-6 text-primary hover:text-primary/90">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
