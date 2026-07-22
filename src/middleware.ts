import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rutas que requieren protección
  const isProtectedAdminRoute = path.startsWith('/admin');
  const isProtectedClientRoute = path.startsWith('/dashboard/client');
  const isPublicRoute = path === '/login' || path === '/';

  // Obtenemos el valor de la cookie de sesión
  const cookie = request.cookies.get('session')?.value;
  
  let session = null;
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      // Ignorar el error, sesión nula
    }
  }

  // Redirigir a login si el usuario no tiene sesión y está en una ruta protegida
  if ((isProtectedAdminRoute || isProtectedClientRoute) && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Si tiene sesión pero es admin
  if (session?.role === 'admin') {
    // Si intenta acceder al cliente, lo redirigimos a admin
    if (isProtectedClientRoute) {
      return NextResponse.redirect(new URL('/admin', request.nextUrl));
    }
    // Si está en ruta pública, llevarlo a dashboard admin
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/admin', request.nextUrl));
    }
  }

  // Si tiene sesión pero es cliente
  if (session?.role === 'client') {
    // Si intenta acceder al admin, lo redirigimos a cliente
    if (isProtectedAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard/client', request.nextUrl));
    }
    // Si está en ruta pública, llevarlo a dashboard cliente
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard/client', request.nextUrl));
    }
  }

  return NextResponse.next();
}

// Configurar el matcher para que solo ejecute el middleware en las rutas necesarias
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
