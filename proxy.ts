import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  const configuredHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).host.toLowerCase()
    : "";
  const isPlatformHost = !host || host === "localhost" || host === "127.0.0.1" ||
    host === configuredHost || host.endsWith(".vercel.app") || host.endsWith(".marketnest.store");

  if (!isPlatformHost && request.nextUrl.pathname === "/") {
    const { data: domain } = await supabase
      .from("store_domains")
      .select("store_id")
      .eq("domain", host)
      .eq("verification_status", "verified")
      .maybeSingle();
    if (domain) {
      const { data: store } = await supabase
        .from("stores")
        .select("slug")
        .eq("id", domain.store_id)
        .eq("status", "published")
        .maybeSingle();
      if (store) return NextResponse.rewrite(new URL(`/s/${store.slug}`, request.url));
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
