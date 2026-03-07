import { NextAuthOptions, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SEC as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          if (!res.data?.success) return null;
          const { user, accessToken } = res.data;
          return { id: user.id, email: user.email, name: user.name, accessToken };
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            // Backend returned 4xx/5xx — auth failure, stay on login page
            return null;
          }
          // Network/unexpected error — show generic error page
          throw new Error("Service unavailable");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days — matches backend token expiry
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Only runs on initial sign-in when both user and account are present
      if (account && user) {
        if (account.provider === "credentials") {
          // accessToken was returned by authorize from the backend
          token.id = user.id;
          token.accessToken = (user as User & { accessToken: string }).accessToken;
        } else {
          // OAuth: register/fetch user from backend to get a backend-issued token
          try {
            const res = await axios.post(`${BACKEND_URL}/auth/signup`, {
              id: user.id,
              name: user.name,
              email: user.email,
              authProvider: account.provider,
            });
            if (!res.data?.success) throw new Error(res.data?.message);
            token.id = res.data.user.id;
            token.accessToken = res.data.accessToken;
          } catch (error) {
            token.error = "OAuthBackendError";
          }
        }
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      session.user.id = token.id as string;
      session.user.accessToken = token.accessToken as string;
      return session;
    },

    async redirect({ url, baseUrl }): Promise<string> {
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
    },
  },
};
