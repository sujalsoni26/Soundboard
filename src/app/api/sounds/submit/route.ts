import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SoundCategory } from "@/types/sound";
import { generateId, isValidAudioFile, slugify } from "@/utils/cn";

const ALLOWED_CATEGORIES: SoundCategory[] = [
  "Classic",
  "Bollywood",
  "Gaming",
  "Anime",
  "Sigma",
  "Brainrot",
  "Sound Effects",
  "Custom",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to upload sounds." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const emoji = String(formData.get("emoji") ?? "🎵").trim() || "🎵";
    const tagsRaw = String(formData.get("tags") ?? "");
    const category = String(formData.get("category") ?? "Custom") as SoundCategory;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!isValidAudioFile(file)) {
      return NextResponse.json(
        { error: "Unsupported audio format. Use MP3, WAV, OGG, or WebM." },
        { status: 400 },
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File must be under ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` },
        { status: 400 },
      );
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const submissionId = crypto.randomUUID();
    const privateSoundId = generateId();
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const storagePath = `${user.id}/${submissionId}.${ext}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKETS.submissions)
      .upload(storagePath, buffer, {
        contentType: file.type || "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("submit upload", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(STORAGE_BUCKETS.submissions).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    const { error: insertError } = await admin.from("sound_submissions").insert({
      id: submissionId,
      user_id: user.id,
      title,
      storage_path: storagePath,
      file_url: fileUrl,
      emoji,
      tags,
      category,
      status: "pending",
      private_sound_id: privateSoundId,
    });

    if (insertError) {
      console.error("submit insert", insertError);
      return NextResponse.json({ error: "Could not save submission." }, { status: 500 });
    }

    const slug = `${slugify(title)}-${privateSoundId.slice(0, 8)}`;
    const sound = {
      id: privateSoundId,
      slug,
      title,
      file: fileUrl,
      category,
      tags,
      emoji,
      duration: 0,
      isCustom: true,
      pendingApproval: true,
      submissionId,
      createdAt: Date.now(),
    };

    return NextResponse.json({
      ok: true,
      sound,
      message: "Upload submitted for admin review. You can use it privately while pending.",
    });
  } catch (error) {
    console.error("POST /api/sounds/submit", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
