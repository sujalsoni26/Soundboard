import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATEGORY_FIX = {
  "fahhhhhhhhhhhhhh-3525": "Brainrot",
  "oh-my-god-bro-oh-hell-nah-man-42939": "Brainrot",
  "deg-deg-44362": "Bollywood",
};

const SAD_VIOLIN = {
  id: "sad-violin",
  slug: "sad-violin",
  title: "Sad Violin (the meme one)",
  file: "/sounds/sad-violin.mp3",
  category: "Sound Effects",
  tags: ["sad", "violin", "meme", "myinstants"],
  emoji: "🎻",
  duration: 4,
};

function loadJson(name) {
  const path = join(__dirname, name);
  if (!existsSync(path)) return { results: [] };
  return JSON.parse(readFileSync(path, "utf8"));
}

const batch1 = loadJson("imported-sounds.json");
const batch2 = loadJson("imported-sounds-batch2.json");

const merged = new Map();
for (const sound of [...batch1.results, ...batch2.results]) {
  merged.set(sound.id, {
    ...sound,
    category: CATEGORY_FIX[sound.id] ?? sound.category,
  });
}

const sounds = [SAD_VIOLIN, ...Array.from(merged.values())];

const typed = `import type { Sound, SoundCategory } from "@/types/sound";

export const SAMPLE_SOUNDS: Sound[] = [
${sounds
  .map(
    (s) => `  {
    id: ${JSON.stringify(s.id)},
    slug: ${JSON.stringify(s.slug)},
    title: ${JSON.stringify(s.title)},
    file: ${JSON.stringify(s.file)},
    category: ${JSON.stringify(s.category)} as SoundCategory,
    tags: ${JSON.stringify(s.tags)},
    emoji: ${JSON.stringify(s.emoji)},
    duration: ${s.duration},
  }`,
  )
  .join(",\n")}
];

export function getSoundsByCategory(category: SoundCategory): Sound[] {
  return SAMPLE_SOUNDS.filter((s) => s.category === category);
}

export function getSoundBySlug(slug: string): Sound | undefined {
  return SAMPLE_SOUNDS.find((s) => s.slug === slug);
}
`;

writeFileSync(join(__dirname, "..", "src", "data", "sounds.ts"), typed);
console.log(`Wrote ${sounds.length} sounds to src/data/sounds.ts`);
