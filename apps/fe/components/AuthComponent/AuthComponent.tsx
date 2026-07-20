"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { signIn } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import logo from '@/assets/logo.svg'
import { Chrome, Github } from "lucide-react";



export default function AuthPage({ type = "login" }) {
  const isLogin = type === "login";
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [credentialsLoading, setCredentialsLoading] = useState<boolean>(false);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
  // const avatarConfig = useMemo(() => genConfig(), [])
  


  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

  enum AuthType {
    LOGIN = "login",
    SIGNUP = "signup",
  }

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    setError(null);
    try {
      await signIn("github", { callbackUrl: '/dashboard', redirect: false});
    } catch (err) {
      console.log(err,'err in signing with github')
      setError("Failed to sign in with GitHub.");
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
       await signIn("google", { callbackUrl: '/dashboard', redirect: false});
    } catch (err) {
      console.log(err,'err in signing with google')
      setError("Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const getLoginErrorMessage = (error: string | undefined | null): string => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "OAuthAccountNotLinked":
        return "This email is already registered with a different sign-in method.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleCredentialsAuth = async (authType: AuthType) => {
    setCredentialsLoading(true);
    setError(null);
    if(authType === 'login'){
      try {
       const signinRes = await signIn('credentials', { email, password, redirect: false });

       if( signinRes && signinRes.ok){
        toast('Login successful')
         router.push('/dashboard')
         return
       }else{
        const message = getLoginErrorMessage(signinRes?.error);
        setError(message);
       }

      } catch (error) {
        console.log(error,'err in login')
        setError("Something went wrong. Please try again.");
      } finally {
        setCredentialsLoading(false);
      }
    }
    if(authType === 'signup'){
      try {
        const res = await axios.post(`${BACKEND_URL}/auth/signup`, {
          name,
          email,
          password,
          authProvider: 'credentials'
        });
        if(res.data.success){
          toast('Signup successful')
          router.push('/login')
        }
      } catch (error) {
        console.log(error,'err in signup')
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.response?.data?.error || "Signup failed. Please try again.";
          setError(message);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setCredentialsLoading(false);
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-white dark:bg-neutral-950">
      {/* Left (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 md:px-16">
        <div className="w-full max-w-md space-y-6 z-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src={logo} alt="Dryink Logo" width={28} height={28} />
            <span className="font-nav text-xl font-semibold tracking-[-0.6px] text-neutral-900 dark:text-white">
              Dryink
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-heading text-3xl font-bold tracking-[-1.2px] leading-tight text-black dark:text-white">
            {isLogin ? "Sign in to your account" : "Sign up for an account"}
          </h2>

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            handleCredentialsAuth(isLogin ? AuthType.LOGIN : AuthType.SIGNUP);
          }}>
            {!isLogin && <Input
             placeholder="Full name"
             value={name}
             onChange={(e) => setName(e.target.value)}
             required
             className="font-body rounded-xl border-neutral-200 dark:border-neutral-800"
             />}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-body rounded-xl border-neutral-200 dark:border-neutral-800"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="font-body rounded-xl border-neutral-200 dark:border-neutral-800"
            />
            {error && <p className="font-body text-sm text-red-500">{error}</p>}
            <Button
              className="w-full cursor-pointer rounded-full bg-black font-nav text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              type="submit"
              disabled={credentialsLoading}
            >
              {credentialsLoading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
            </Button>
          </form>

          {/* Switch Auth */}
          <p className="font-body text-sm text-center text-[#505050] dark:text-neutral-400">
            {isLogin ? (
              <>
                Dont have an account?{" "}
                <Link href="/signup" className="text-[#4a3294] hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-[#4a3294] hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="w-full border-t border-dashed border-neutral-300 dark:border-neutral-700" />
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 bg-white dark:bg-neutral-950">
              <span className="font-body text-sm text-[#505050] dark:text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            {/* GitHub Auth */}
            <Button
              type="button"
              onClick={handleGithubLogin}
              variant="outline"
              className="flex-1 min-w-0 flex items-center justify-center gap-2 cursor-pointer rounded-full font-nav border-neutral-200 dark:border-neutral-800"
              disabled={githubLoading}
            >
              <Github size={20} />
              {githubLoading ? "Loading..." : "Github"}
            </Button>
            {/* Google Auth */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="flex-1 min-w-0 flex items-center justify-center gap-2 cursor-pointer rounded-full font-nav border-neutral-200 dark:border-neutral-800"
              disabled={googleLoading}
            >
              <Chrome size={20} />
              {googleLoading ? "Loading..." : "Google"}
            </Button>
          </div>

          {/* Terms */}
          <p className="font-badge text-xs text-center text-[#505050] dark:text-neutral-400">
            By clicking on {isLogin ? "sign in" : "sign up"}, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#4a3294]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#4a3294]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Right (Image panel) */}
      <div className="relative hidden md:flex w-1/2 items-end p-12 overflow-hidden">
        <Image
          src="https://res.cloudinary.com/diqurtmad/image/upload/v1784529951/forest-login_cffg4w.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />
        <div className="relative z-10 max-w-md rounded-3xl border border-white/20 bg-[rgba(0,0,0,0.24)] p-6 backdrop-blur-md">
          <h3 className="font-heading text-lg font-bold text-white">
            Dryink is used by thousands of users
          </h3>
          <p className="font-body text-sm text-white/80 mt-2">
            Forget creating videos for your students. Dryink is a powerful tool that simplifies complex ideas into engaging, animated videos.
          </p>
        </div>
      </div>
    </div>
  );
}