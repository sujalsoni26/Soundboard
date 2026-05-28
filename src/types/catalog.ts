import type { SoundCategory } from "@/types/sound";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface CatalogSoundRow {
  id: string;
  slug: string;
  title: string;
  storage_path: string;
  file_url: string;
  category: string;
  tags: string[];
  emoji: string;
  duration: number;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface SoundSubmissionRow {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  file_url: string;
  emoji: string;
  tags: string[];
  category: string;
  status: SubmissionStatus;
  private_sound_id: string;
  catalog_sound_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { email: string | null };
}

export interface SoundSubmission extends SoundSubmissionRow {
  uploaderEmail?: string | null;
}

export type CatalogSoundSource = "supabase" | "local";

export interface AdminCatalogSound {
  id: string;
  title: string;
  category: string;
  emoji: string;
  fileUrl: string;
  isActive: boolean;
  source: CatalogSoundSource;
  createdAt?: string;
}

export function rowToSound(row: CatalogSoundRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    file: row.file_url,
    category: row.category as SoundCategory,
    tags: row.tags ?? [],
    emoji: row.emoji,
    duration: Number(row.duration) || 0,
  };
}
