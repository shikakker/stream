import { NextRequest, NextResponse } from 'next/server';

const COOKIE_KEY = 'streamPlayerType';

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  if (request.cookies.get(COOKIE_KEY)) {
    response.cookies.delete(COOKIE_KEY);
  }

  return response;
}

export const config = {
  matcher: '/v/:path*',
};
