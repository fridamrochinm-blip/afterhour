import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE = /^\/(editar|admin)(\/|$)/;

export async function middleware(request: NextRequest) {
  // Una sola dirección: las otras direcciones *.vercel.app redirigen a la principal,
  // para que la sesión (cookies) no quede en otro dominio.
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    const main = new URL(site);
    const host = request.headers.get("host") ?? "";
    if (host.endsWith(".vercel.app") && host !== main.host) {
      const to = new URL(request.nextUrl.pathname + request.nextUrl.search, main);
      return NextResponse.redirect(to, 308);
    }
  }

  if (!PRIVATE.test(request.nextUrl.pathname)) return NextResponse.next();

  // Refresca la sesión de Supabase en páginas privadas.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)"],
};
