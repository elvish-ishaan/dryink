import { NextAuthOptions, Session, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';


if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SEC || !process.env.NEXTAUTH_SECRET) {
    throw new Error('Missing required environment variables.');
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

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
        signIn: '/auth/login',
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
        async signIn({ user, profile }): Promise<boolean> {
            if (user?.email) {
                try {
                    console.log(user,'this is user', profile, 'this is profile')
                    // const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
                    // if (!existingUser) {
                    //     await prisma.user.create({
                    //         data: {
                    //             email: user.email,
                    //             name: user.name || profile?.name || 'Guest',
                    //         },
                    //     });
                    // }
                    return true;
                } catch (error) {
                    console.error('Error in signIn callback:', error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }): Promise<Session> {
            if (session?.user && token.email) {
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }): Promise<string> {
            return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
        },
    },
};