import { NextResponse } from "next/server";
import { adminAuthError, requireAdminUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminUser();
  if ("error" in auth) return adminAuthError(auth.error);
  const { user } = auth;

  const { id } = await params;

  try {
    const admin = createAdminClient();
    const { data: submission, error: fetchError } = await admin
      .from("sound_submissions")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Submission already reviewed." }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from("sound_submissions")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Submission rejected. The sound remains private to the uploader.",
    });
  } catch (error) {
    console.error("POST reject", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
