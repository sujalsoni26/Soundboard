/**
 * Upload built-in catalog from public/sounds to Supabase Storage + catalog_sounds table.
 *
 * Requires in .env.local (or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: node scripts/upload-catalog-to-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Load .env.local into process.env (Node does not read it automatically). */
function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Add them to .env.local in the project root, then run again.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Dynamic import of sounds catalog (tsx not available — parse sounds.ts simply)
const soundsPath = path.join(root, "src/data/sounds.ts");
const soundsSource = fs.readFileSync(soundsPath, "utf8");

/** Extract id, slug, title, file, category, tags, emoji, duration from sounds.ts */
function parseSounds(source) {
  const sounds = [];
  const blocks = source.match(/\{[^{}]*id:\s*"[^"]+"[^{}]*\}/gs) ?? [];
  for (const block of blocks) {
    const get = (key) => block.match(new RegExp(`${key}:\\s*"([^"]+)"`))?.[1];
    const getNum = (key) => Number(block.match(new RegExp(`${key}:\\s*([\\d.]+)`))?.[1] ?? 0);
    const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? [...tagsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
      : [];
    const id = get("id");
    const file = get("file");
    if (!id || !file) continue;
    sounds.push({
      id,
      slug: get("slug") ?? id,
      title: get("title") ?? id,
      file,
      category: get("category") ?? "Classic",
      tags,
      emoji: get("emoji") ?? "🎵",
      duration: getNum("duration"),
    });
  }
  return sounds;
}

const sounds = parseSounds(soundsSource);
console.log(`Found ${sounds.length} sounds in catalog.`);

let uploaded = 0;
let skipped = 0;

for (const sound of sounds) {
  const localPath = path.join(root, "public", sound.file.replace(/^\//, ""));
  if (!fs.existsSync(localPath)) {
    console.warn(`Skip (missing file): ${sound.id} -> ${localPath}`);
    skipped++;
    continue;
  }

  const ext = path.extname(localPath).slice(1) || "mp3";
  const storagePath = `${sound.id}.${ext}`;
  const buffer = fs.readFileSync(localPath);

  const { error: uploadError } = await admin.storage
    .from("catalog-sounds")
    .upload(storagePath, buffer, {
      contentType: ext === "mp3" ? "audio/mpeg" : ext === "mpeg" ? "audio/mpeg" : "audio/wav",
      upsert: true,
    });

  if (uploadError) {
    console.error(`Upload failed ${sound.id}:`, uploadError.message);
    skipped++;
    continue;
  }

  const { data: urlData } = admin.storage.from("catalog-sounds").getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  const { error: dbError } = await admin.from("catalog_sounds").upsert({
    id: sound.id,
    slug: sound.slug,
    title: sound.title,
    storage_path: storagePath,
    file_url: fileUrl,
    category: sound.category,
    tags: sound.tags,
    emoji: sound.emoji,
    duration: sound.duration,
    is_active: true,
  });

  if (dbError) {
    console.error(`DB failed ${sound.id}:`, dbError.message);
    skipped++;
    continue;
  }

  uploaded++;
  console.log(`OK: ${sound.title}`);
}

console.log(`Done. Uploaded: ${uploaded}, skipped: ${skipped}`);
