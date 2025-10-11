import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const openRoutes = [
  // API Routes that do not require authentication
  '/api/login', 
  '/api/signup',
  // Frontend Pages that do not require authentication
  '/',
  '/login',
  '/signup'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  // 1. Allow access to open routes (login/signup pages and their APIs)
  if (openRoutes.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // --- 2. Authentication Check for Protected Routes ---

  let token: string | undefined;

  // Try to get token from Authorization header (standard for API calls)
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } 
  // Fallback: Try to get token from cookies (can be used by browser for page navigation)
  else {
    token = req.cookies.get('token')?.value;
  }

  // Handle Missing Token
  if (!token) {
    if (isApiRoute) {
      // If it's an API route, return 401 JSON response
      return NextResponse.json({ error: 'Unauthorized token is missing' }, { status: 401 });
    }
    // If it's a page route, redirect to the login page
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // --- 3. Token Verification ---
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // Handle Invalid Token
    if (isApiRoute) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // If it's a page route, redirect to login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // Match all paths except for static files, internal Next.js files, and the favicon.
  // This will cover all API routes and all frontend pages.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|public).*)',
  ],
};