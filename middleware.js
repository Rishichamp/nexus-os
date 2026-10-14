import { NextResponse } from 'next/server';

// Optional password gate for the whole app (pages + API). NEXUS OS is a
// single-user app whose API uses the Supabase service-role key, so a public
// deployment would otherwise let anyone read or delete every memory.
// Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD to turn it on; leave them unset
// for local development.
export function middleware(request) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !password) return NextResponse.next();

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    const [u, ...rest] = atob(header.slice(6)).split(':');
    if (u === user && rest.join(':') === password) return NextResponse.next();
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="NEXUS OS"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
