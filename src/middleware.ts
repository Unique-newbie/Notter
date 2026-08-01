import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Notter 2.0 Offline-First Architecture:
  // Direct, unblocked local workspace access without cloud authentication requirements.
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
