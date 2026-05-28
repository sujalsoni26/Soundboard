import { SAMPLE_SOUNDS } from "@/data/sounds";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rowToSound,
  type AdminCatalogSound,
  type CatalogSoundRow,
} from "@/types/catalog";
import type { Sound } from "@/types/sound";
import { slugify } from "@/utils/cn";

async function fetchHiddenOverrideIds(admin: ReturnType<typeof createAdminClient>): Promise<Set<string>> {
  const { data } = await admin.from("catalog_overrides").select("sound_id, is_active");
  return new Set((data ?? []).filter((row) => row.is_active === false).map((row) => row.sound_id as string));
}

export function catalogRowsToSounds(rows: CatalogSoundRow[]): Sound[] {
  return rows.map(rowToSound);
}

export async function fetchCatalogSounds(): Promise<{ sounds: Sound[]; source: "supabase" | "local" }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("catalog_sounds")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      return { sounds: catalogRowsToSounds(data as CatalogSoundRow[]), source: "supabase" };
    }
  } catch (error) {
    console.error("fetchCatalogSounds", error);
  }

  try {
    const admin = createAdminClient();
    const hiddenIds = await fetchHiddenOverrideIds(admin);
    return {
      sounds: SAMPLE_SOUNDS.filter((sound) => !hiddenIds.has(sound.id)),
      source: "local",
    };
  } catch {
    return { sounds: SAMPLE_SOUNDS, source: "local" };
  }
}

export async function fetchAdminCatalogSounds(): Promise<AdminCatalogSound[]> {
  const admin = createAdminClient();
  const [{ data: catalogRows, error: catalogError }, { data: overrides }] = await Promise.all([
    admin.from("catalog_sounds").select("*").order("title", { ascending: true }),
    admin.from("catalog_overrides").select("sound_id, is_active"),
  ]);

  if (catalogError) throw catalogError;

  const overrideActive = new Map(
    (overrides ?? []).map((row) => [row.sound_id as string, row.is_active as boolean]),
  );
  const catalogIds = new Set((catalogRows ?? []).map((row) => row.id as string));

  const supabaseSounds: AdminCatalogSound[] = (catalogRows ?? []).map((row) => {
    const typed = row as CatalogSoundRow;
    return {
      id: typed.id,
      title: typed.title,
      category: typed.category,
      emoji: typed.emoji,
      fileUrl: typed.file_url,
      isActive: typed.is_active,
      source: "supabase",
      createdAt: typed.created_at,
    };
  });

  const localSounds: AdminCatalogSound[] = SAMPLE_SOUNDS.filter((sound) => !catalogIds.has(sound.id)).map(
    (sound) => ({
      id: sound.id,
      title: sound.title,
      category: sound.category,
      emoji: sound.emoji,
      fileUrl: sound.file,
      isActive: overrideActive.get(sound.id) ?? true,
      source: "local",
    }),
  );

  return [...supabaseSounds, ...localSounds].sort((a, b) => a.title.localeCompare(b.title));
}

export async function setCatalogSoundActive(
  soundId: string,
  isActive: boolean,
  adminUserId: string,
): Promise<{ source: "supabase" | "local" }> {
  const admin = createAdminClient();
  const { data: catalogRow } = await admin
    .from("catalog_sounds")
    .select("id")
    .eq("id", soundId)
    .maybeSingle();

  if (catalogRow) {
    const { error } = await admin.from("catalog_sounds").update({ is_active: isActive }).eq("id", soundId);
    if (error) throw error;
    return { source: "supabase" };
  }

  const { error } = await admin.from("catalog_overrides").upsert(
    {
      sound_id: soundId,
      is_active: isActive,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sound_id" },
  );
  if (error) throw error;
  return { source: "local" };
}

export async function deleteCatalogSound(soundId: string): Promise<{ source: "supabase" | "local" }> {
  const admin = createAdminClient();
  const { data: catalogRow } = await admin
    .from("catalog_sounds")
    .select("storage_path")
    .eq("id", soundId)
    .maybeSingle();

  if (catalogRow?.storage_path) {
    await admin.storage.from(STORAGE_BUCKETS.catalog).remove([catalogRow.storage_path as string]);
    const { error } = await admin.from("catalog_sounds").delete().eq("id", soundId);
    if (error) throw error;
    await admin.from("catalog_overrides").delete().eq("sound_id", soundId);
    return { source: "supabase" };
  }

  const { error } = await admin.from("catalog_overrides").upsert(
    {
      sound_id: soundId,
      is_active: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sound_id" },
  );
  if (error) throw error;
  return { source: "local" };
}

export async function copySubmissionToCatalog(submission: {
  title: string;
  storage_path: string;
  emoji: string;
  tags: string[];
  category: string;
  uploaded_by: string;
}): Promise<{ catalogId: string; slug: string; fileUrl: string; storagePath: string }> {
  const admin = createAdminClient();
  const baseSlug = slugify(submission.title) || "sound";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const catalogId = slug;
  const ext = submission.storage_path.split(".").pop() || "mp3";
  const catalogPath = `${catalogId}.${ext}`;

  const { data: fileData, error: downloadError } = await admin.storage
    .from(STORAGE_BUCKETS.submissions)
    .download(submission.storage_path);

  if (downloadError || !fileData) {
    throw new Error("Could not read submission file.");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKETS.catalog)
    .upload(catalogPath, buffer, {
      contentType: fileData.type || "audio/mpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = admin.storage.from(STORAGE_BUCKETS.catalog).getPublicUrl(catalogPath);

  return {
    catalogId,
    slug,
    fileUrl: urlData.publicUrl,
    storagePath: catalogPath,
  };
}
