import { NextAuthOptions, Session, User } from 'next-auth';
// import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import jwt from 'jsonwebtoken'


// if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SEC || !process.env.NEXTAUTH_SECRET) {
//     throw new Error('Missing required environment variables.');
// }

const BACKEND_URL = 'http://localhost:5000/api/v1'
const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        // GoogleProvider({
        //     clientId: process.env.GOOGLE_CLIENT_ID,
        //     clientSecret: process.env.GOOGLE_CLIENT_SEC,
        // }),
        GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
       }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text', placeholder: 'Enter your email' },
                password: { label: 'Password', type: 'password', placeholder: 'Enter your password' },
            },
            async authorize(credentials): Promise<User | null> {
                if (!credentials) {
                    throw new Error('Missing email or password');
                }

                const { email, password } = credentials;

                try {
                    //make backend call to check if user exists
                    const res = await axios.post(`${BACKEND_URL}/auth/login`, {
                        email,
                        password,
                    });
                    if (!res.data?.success) {
                        throw new Error(res.data?.message);
                    }
                    const user = await res.data?.user;
                    return { id: user.id, email: user.email, name: user.name };
                } catch (error) {
                    console.error('Error in authorize:', error);
                    throw new Error('Unable to log in');
                }
            },
        }),
    ],
    pages: {
        signIn: '/login',
        // signOut: '/',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    
    callbacks: {
        async jwt({ token, user }) {
          // Only create custom access token on initial login
          if (user) {
            token.id = user.id;
            token.email = user.email;

            // Create your own access token
            const customAccessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        JWT_SECRET,
        {
          expiresIn: '1h',
        }
            );

            token.customAccessToken = customAccessToken;
          }

          return token;
        },

        async signIn({ user }): Promise<boolean> {
            if (user?.email) {
                try {
                    console.log(user,'this is user')
                    //check if user not exists then create new user
                    return true;
                } catch (error) {
                    console.error('Error in signIn callback:', error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }): Promise<Session> {
            console.log(session,'sessinon.......', 'token:',token)
            if (session?.user && token.email) {
               // Expose custom token to frontend
               session.user.id = token.id;
               session.user.email = token.email;
               session.user.accessToken = token.customAccessToken as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }): Promise<string> {
            return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
        },
    },
};