import { NextResponse } from "next/server";
import { copySubmissionToCatalog } from "@/lib/catalog";
import { cleanupUserPrefsAfterApproval } from "@/lib/approval-cleanup";
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
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Submission already reviewed." }, { status: 400 });
    }

    const copied = await copySubmissionToCatalog({
      title: submission.title,
      storage_path: submission.storage_path,
      emoji: submission.emoji,
      tags: submission.tags ?? [],
      category: submission.category,
      uploaded_by: submission.user_id,
    });

    const { error: catalogError } = await admin.from("catalog_sounds").insert({
      id: copied.catalogId,
      slug: copied.slug,
      title: submission.title,
      storage_path: copied.storagePath,
      file_url: copied.fileUrl,
      category: submission.category,
      tags: submission.tags ?? [],
      emoji: submission.emoji,
      duration: 0,
      is_active: true,
      uploaded_by: submission.user_id,
    });

    if (catalogError) {
      console.error("approve catalog insert", catalogError);
      return NextResponse.json({ error: "Could not add to catalog." }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("sound_submissions")
      .update({
        status: "approved",
        catalog_sound_id: copied.catalogId,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await cleanupUserPrefsAfterApproval(
      admin,
      submission.user_id,
      submission.private_sound_id,
      copied.catalogId,
    );

    return NextResponse.json({
      ok: true,
      catalogSoundId: copied.catalogId,
      message: "Sound approved and added to the public catalog.",
    });
  } catch (error) {
    console.error("POST approve", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
