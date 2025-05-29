"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export default function AuthPage({ type = 'login' }) {
    const isLogin = type === 'login';
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loding, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

  useEffect(()=> {

  })

  return (
    <div className="w-full h-screen flex flex-col md:flex-row dark:bg-black bg-white">
      {/* Left (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 z-10">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Dryink Logo" width={30} height={30} />
            <span className="text-xl font-bold">Dryink</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Sign in to your account' : 'Sign up for an account'}
          </h2>

          {/* Form */}
          <form className="space-y-4">
            {!isLogin && <Input placeholder="Full name" />}
            <Input type="email" placeholder="Email address" />
            <Input type="password" placeholder="Password" />
            <Button className="w-full cursor-pointer">{isLogin ? 'Sign in' : 'Sign Up'}</Button>
          </form>

          {/* Switch Auth */}
          <p className="text-sm text-center text-muted-foreground">
            {isLogin ? (
              <>Don't have an account? <Link href="/signup" className="text-blue-500">Sign up</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-blue-500">Sign in</Link></>
            )}
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 bg-white dark:bg-neutral-900">
                <span className="text-sm text-muted-foreground">Or continue with</span>
            </div>
        </div>


          {/* GitHub Auth */}
          <Button variant="outline" className="w-full flex items-center justify-center cursor-pointer">
            <Image  src="/github.png" alt="GitHub" width={20} height={20} className="mr-2 dark:text-white dark:bg-white rounded-full" />
            Github
          </Button>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By clicking on {isLogin ? 'sign in' : 'sign up'}, you agree to our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right (Info Box with dashed borders) */}
      <div className="hidden md:flex w-1/2 items-center justify-center  p-8 border-l bg-neutral-100 border-dashed dark:bg-neutral-900 border-gray-700 dark:border-neutral-900">
        <div className="text-center max-w-md">
          {/* Avatar Group */}
          <div className="flex justify-center mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <Image
                  key={i}
                  src="/people.png"
                  alt="user"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white"
                />
              ))}
            </div>
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold">Every AI is used by thousands of users</h3>
          <p className="text-sm text-muted-foreground mt-2">
            With lots of AI applications around, Everything AI stands out with its state of the art capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
