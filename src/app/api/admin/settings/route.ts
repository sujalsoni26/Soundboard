import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { requireAdminUser, adminAuthError } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminSiteSettings } from "@/types/sync";

const DEFAULT_SITE: AdminSiteSettings = {
  maintenanceMode: false,
  welcomeMessage: "",
  maxCustomSounds: 50,
  trendingLimit: 8,
  maxUploadBytes: MAX_UPLOAD_BYTES,
};

async function requireAdmin() {
  const auth = await requireAdminUser();
  if ("error" in auth) return { error: adminAuthError(auth.error) };
  return { user: auth.user };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("admin_settings").select("key, value").eq("key", "site");

    if (error) {
      return NextResponse.json({ site: DEFAULT_SITE });
    }

    const row = data?.[0];
    const site = row?.value ? ({ ...DEFAULT_SITE, ...row.value } as AdminSiteSettings) : DEFAULT_SITE;
    return NextResponse.json({ site });
  } catch {
    return NextResponse.json({ site: DEFAULT_SITE });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth as { user: { id: string } };

  try {
    const body = (await request.json()) as { site?: Partial<AdminSiteSettings> };
    if (!body.site) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "site")
      .single();

    const merged = {
      ...DEFAULT_SITE,
      ...(existing?.value as AdminSiteSettings | undefined),
      ...body.site,
    };

    const { error } = await admin.from("admin_settings").upsert({
      key: "site",
      value: merged,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ site: merged });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
