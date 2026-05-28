import { NextResponse } from "next/server";
import { mergeSyncData, parseSyncData, readLocalSyncData } from "@/lib/sync-data";
import { createClient } from "@/lib/supabase/server";
import type { UserSyncData } from "@/types/sync";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("data, updated_at")
      .eq("user_id", user.id)
      .single();

    const remote = parseSyncData(prefs?.data);

    return NextResponse.json({
      data: remote,
      profile: profile ?? { id: user.id, email: user.email, role: "user" },
      updatedAt: prefs?.updated_at ?? null,
    });
  } catch (error) {
    console.error("GET /api/sync", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      data?: UserSyncData;
      mergeLocal?: boolean;
    };

    let payload = body.data ? parseSyncData(body.data) : null;
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (body.mergeLocal) {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("data")
        .eq("user_id", user.id)
        .single();
      const remote = parseSyncData(existing?.data);
      const local = readLocalSyncData();
      payload = mergeSyncData(local, remote);
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      data: payload,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("PUT /api/sync upsert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch (error) {
    console.error("PUT /api/sync", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
