import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.png|icons|sounds|manifest|sw.js|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mpeg|wav|ogg|ico)$).*)",
  ],
};
