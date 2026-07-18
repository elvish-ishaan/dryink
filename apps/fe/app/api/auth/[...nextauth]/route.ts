
import { authOptions } from '@/lib/authOptions';
import NextAuth from 'next-auth';

// Use the NextAuth handler
const handler = NextAuth(authOptions);

// Named exports for HTTP methods
export const GET = handler;
export const POST = handler;