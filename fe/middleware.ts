import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Allow access to the landing page, login page, and NextAuth auth routes
  if (pathname === '/' || pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next()
  }
  
  // Allow access to the landing page, NextAuth auth routes, and the sign-in page
  if (
    pathname === '/' || 
    pathname.startsWith('/api/auth') || 
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname === '/pricing'
  ) {
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users trying to access protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url)) 
  }

  // Allow access for authenticated users
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|favicon.ico).*)', // Apply to all routes after '/'
}