import { NextResponse } from "next/server";
import { adminAuthError, requireAdminUser } from "@/lib/auth-server";
import { fetchAdminCatalogSounds } from "@/lib/catalog";

export async function GET() {
  const auth = await requireAdminUser();
  if ("error" in auth) return adminAuthError(auth.error);

  try {
    const sounds = await fetchAdminCatalogSounds();
    return NextResponse.json({ sounds });
  } catch (error) {
    console.error("GET /api/admin/catalog", error);
    return NextResponse.json({ error: "Could not load catalog sounds." }, { status: 500 });
  }
}
