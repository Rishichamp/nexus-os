import { NextResponse } from 'next/server';

// Optional password gate for the whole app (pages + API). NEXUS OS is a
// single-user app whose API uses the Supabase service-role key, so a public
// deployment would otherwise let anyone read or delete every memory.
// Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD to turn it on; leave them unset
// for local development.
// Compare without returning early on the first differing character.
function safeEqual(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function middleware(request) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !password) return NextResponse.next();

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = ''; // malformed base64 used to throw (500) instead of asking to log in
    }
    const [u, ...rest] = decoded.split(':');
    if (safeEqual(u, user) && safeEqual(rest.join(':'), password)) return NextResponse.next();
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="NEXUS OS"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
