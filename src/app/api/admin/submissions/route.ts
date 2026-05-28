import { NextResponse } from "next/server";
import { adminAuthError, requireAdminUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SoundSubmissionRow } from "@/types/catalog";

async function requireAdmin() {
  const auth = await requireAdminUser();
  if ("error" in auth) return { error: adminAuthError(auth.error) };
  const supabase = await createClient();
  return { supabase, user: auth.user };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sound_submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
    const { data: profiles } = await admin.from("profiles").select("id, email").in("id", userIds);

    const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

    const submissions = (data ?? []).map((row) => {
      const typed = row as SoundSubmissionRow;
      return {
        ...typed,
        uploaderEmail: emailById.get(typed.user_id) ?? null,
      };
    });

    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
