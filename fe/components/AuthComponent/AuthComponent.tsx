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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
  // const avatarConfig = useMemo(() => genConfig(), [])
  


  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

  enum AuthType {
    LOGIN = "login",
    SIGNUP = "signup",
  }

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("github", { callbackUrl: '/dashboard', redirect: false});
    } catch (err) {
      console.log(err,'err in signing with github')
      setError("Failed to sign in with GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
       await signIn("google", { callbackUrl: '/dashboard', redirect: false});
    } catch (err) {
      console.log(err,'err in signing with google')
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsAuth = async (authType: AuthType) => {
    setLoading(true);
    setError(null);
    if(authType === 'login'){
      try {
       const signinRes = await signIn('credentials', { email, password, redirect: false });
       setLoading(false)
       
       if( signinRes && signinRes.ok){
        toast('Login successful')
         router.push('/dashboard')
         return
       }else{
        toast(signinRes?.error)
       }

      } catch (error) {
        console.log(error,'err in login')
        setError("unable to login")
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
        setLoading(false)
        if(res.data.success){ 
          toast('Signup successful')
          router.push('/login')
        }
      } catch (error) {
        console.log(error,'err in signup')
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row dark:bg-black bg-white">
      {/* Left (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 z-10">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image src={logo} alt="Dryink Logo" width={30} height={30} />
            <span className="text-xl font-bold">Dryink</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold">
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
             />}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button className="w-full cursor-pointer" type="submit" disabled={loading}>
              {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
            </Button>
          </form>

          {/* Switch Auth */}
          <p className="text-sm text-center text-muted-foreground">
            {isLogin ? (
              <>
                Dont have an account?{" "}
                <Link href="/signup" className="text-blue-500">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 bg-white dark:bg-neutral-900">
              <span className="text-sm text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className=" flex gap-2 w-fit" >
            <div className=" w-fit gap-5 flex justify-around">
                    {/* GitHub Auth */}
          <Button
            onClick={handleGithubLogin}
            variant="outline"
            className="w-full flex items-center justify-center cursor-pointer"
            disabled={loading}
          >
            <Github size={20}/>
            {loading ? "Loading..." : "Github"}
          </Button>
            {/* Google Auth */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center cursor-pointer"
              disabled={loading}
            >
              <Chrome size={20} />
              {loading ? "Loading..." : "Google"}
            </Button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By clicking on {isLogin ? "sign in" : "sign up"}, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Right (Info Box with dashed borders) */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-8 bg-gradient-to-bl from-blue-600 to-purple-600 dark:bg-neutral-900 border-gray-700 dark:border-neutral-900">
        <div className="text-center max-w-md">
          {/* Message */}
          <h3 className="text-lg font-semibold">
            Dryink is used by thousands of users
          </h3>
          <p className="text-sm text-foreground mt-2">
            {/* write a short description of Dryink here */}
            Forget creating videos for your students. Dryink is a powerful tool that simplifies complex ideas into engaging, animated videos.
          </p>
        </div>
      </div>
    </div>
  );
}