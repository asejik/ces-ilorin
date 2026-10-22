import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

/** True when the signed-in user has a row in ces_staff_profiles (checked with the server-only key). */
async function isCesStaff(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await admin.from('ces_staff_profiles').select('id').eq('id', userId).maybeSingle();
  return !!data;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check if Supabase auth cookies exist on the request
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') || c.name.includes('auth-token'));

  let user = null;
  if (hasAuthCookie) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  const { pathname } = request.nextUrl;

  // ROUTE GUARD: Protect all /admin/* and /certificate/* routes from unauthenticated access
  if (pathname.startsWith('/admin') || pathname.startsWith('/certificate')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Signed in is not enough: the Auth project is shared, so require a CES staff profile.
    if (!(await isCesStaff(user.id))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('error', 'not-staff');
      return NextResponse.redirect(loginUrl);
    }
  }

  // REDIRECT GUARD: Redirect logged-in staff away from /login to admin gradebook
  if (pathname === '/login' && user && (await isCesStaff(user.id))) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = '/admin/gradebook';
    targetUrl.searchParams.delete('redirect');
    return NextResponse.redirect(targetUrl);
  }

  return response;
}
