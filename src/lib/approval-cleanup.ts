import { parseSyncData } from "@/lib/sync-data";
import type { UserSyncData } from "@/types/sync";

export function applyApprovalToSyncData(
  data: UserSyncData,
  privateSoundId: string,
  catalogSoundId: string,
): UserSyncData {
  const customSounds = data.customSounds.filter((s) => s.id !== privateSoundId);

  const replaceId = (id: string) => (id === privateSoundId ? catalogSoundId : id);

  const favorites = [...new Set(data.favorites.map(replaceId))];
  const hiddenSounds = [...new Set(data.hiddenSounds.map(replaceId))];
  const recent = [...new Set(data.recent.map(replaceId))];

  const customNames = { ...data.customNames };
  if (customNames[privateSoundId]) {
    customNames[catalogSoundId] = customNames[privateSoundId];
    delete customNames[privateSoundId];
  }

  const playCounts = { ...data.playCounts };
  if (playCounts[privateSoundId]) {
    playCounts[catalogSoundId] = (playCounts[catalogSoundId] ?? 0) + playCounts[privateSoundId];
    delete playCounts[privateSoundId];
  }

  const playlists = data.playlists.map((p) => ({
    ...p,
    soundIds: [...new Set(p.soundIds.map(replaceId))],
  }));

  const shortcuts = data.shortcuts.map((s) =>
    s.soundId === privateSoundId ? { ...s, soundId: catalogSoundId } : s,
  );

  return {
    ...data,
    customSounds,
    favorites,
    hiddenSounds,
    recent,
    customNames,
    playCounts,
    playlists,
    shortcuts,
  };
}

export async function cleanupUserPrefsAfterApproval(
  admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  userId: string,
  privateSoundId: string,
  catalogSoundId: string,
): Promise<void> {
  const { data: row } = await admin
    .from("user_preferences")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  const current = parseSyncData(row?.data);
  const updated = applyApprovalToSyncData(current, privateSoundId, catalogSoundId);

  await admin.from("user_preferences").upsert({
    user_id: userId,
    data: updated,
    updated_at: new Date().toISOString(),
  });
}
