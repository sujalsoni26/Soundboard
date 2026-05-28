import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Returns approved uploads whose private copy should be removed from the client. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ approvals: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sound_submissions")
      .select("private_sound_id, catalog_sound_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .not("catalog_sound_id", "is", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const approvals = (data ?? [])
      .filter((row) => row.private_sound_id && row.catalog_sound_id)
      .map((row) => ({
        privateSoundId: row.private_sound_id as string,
        catalogSoundId: row.catalog_sound_id as string,
      }));

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("GET /api/sounds/approval-sync", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
