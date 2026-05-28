import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = join(__dirname, "..", "public", "sounds");

const INSTANTS = [
  "abe-sale-63216",
  "haha-funny-laugh-93061",
  "anime-ahh-73606",
  "fahhhhhhhhhhhhhh-3525",
  "fart",
  "anime-wow",
  "chalo-9295",
  "gopgopgop-41469",
  "spiderman-meme-song-37638",
  "tum-dum-tedau-33653",
  "abhi-maza-ayagga-61277",
  "romanceeeeeeeeeeeeee-29042",
  "spongebob-fail-11236",
  "eh-eh-ehhhh-30930",
  "jo-gareeb-hove-naa-11524",
  "mka-ladle-meow-gop-70774",
  "asian-meme-huh-49043",
  "rizzbot-laugh-66507",
  "ab-tu-gaya-beta-ab-dekh-tu-puneet-34571",
  "cid-le-mdc-66107",
  "hatt-thari-behen-ki-26087",
  "galaxy-meme-18643",
  "tiki-tiki-34703",
  "bruh",
  "modi-ji-bhojyam-4549",
  "run-vine",
  "kyu-re-madarchod-cid-30584",
  "sad-meow-song-88771",
  "cid-15031",
  "cat-laugh-meme-1-15761",
  "wow-kya-ladki-hai-very-handsome-boy-34512",
  "acha-ji-aisa-hai-kya-56288",
  "ek-jhaat-bhar-ka-aadmi-34251",
  "ye-ladki-tum-bohut-bolti-ho-chapad-chapad-24947",
  "modi-ji-bkl-36536",
  "emotional-damage-meme-74555",
  "aww",
  "baat-to-sahi-hai-35794",
];

function slugToTitle(slug) {
  return slug
    .replace(/-\d+$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function guessCategory(slug, title) {
  const s = `${slug} ${title}`.toLowerCase();
  if (/anime|ahh|wow-kya|asian-meme/.test(s)) return "Anime";
  if (/modi|chalo|cid|abe|gareeb|puneet|bhojyam|bkl|baat-to-sahi|acha-ji|ek-jhaat|ladki|hatt-thari|abhi-maza|tum-dum|kyu-re|jo-gareeb|wow-kya-ladki/.test(s))
    return "Bollywood";
  if (/fahhh|gopgop|rizzbot|galaxy|mka-ladle|tiki-tiki|meow|romanceeee|eh-eh-ehhhh/.test(s))
    return "Brainrot";
  if (/spiderman|spongebob|run-vine|bruh|emotional|aww|fart|haha-funny|cat-laugh/.test(s))
    return "Classic";
  return "Sound Effects";
}

function guessEmoji(category, slug) {
  const map = {
    Bollywood: "🎬",
    Anime: "⛩️",
    Brainrot: "🧠",
    Classic: "🎭",
    "Sound Effects": "🔊",
  };
  if (/fart/.test(slug)) return "💨";
  if (/cat|meow/.test(slug)) return "🐱";
  if (/spiderman/.test(slug)) return "🕷️";
  if (/spongebob/.test(slug)) return "🧽";
  if (/modi/.test(slug)) return "🇮🇳";
  if (/cid/.test(slug)) return "🕵️";
  if (/anime/.test(slug)) return "✨";
  if (/emotional/.test(slug)) return "💔";
  if (/bruh/.test(slug)) return "😑";
  if (/rizz/.test(slug)) return "😎";
  return map[category] ?? "🔊";
}

async function fetchInstant(slug) {
  const urls = [
    `https://www.myinstants.com/en/instant/${slug}/`,
    `https://www.myinstants.com/instant/${slug}/`,
  ];

  for (const url of urls) {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MemeSoundboard/1.0)" },
    });
    if (!res.ok) continue;
    const html = await res.text();

    const titleMatch = html.match(/<title>([^<|]+)/i);
    const title = titleMatch
      ? titleMatch[1].replace(/ - Instant.*$/i, "").trim()
      : slugToTitle(slug);

    const audioMatch =
      html.match(/data-url="(\/media\/sounds\/[^"]+)"/) ||
      html.match(/og:audio" content="https:\/\/www\.myinstants\.com(\/media\/sounds\/[^"]+)"/);

    if (!audioMatch) continue;

    const audioPath = audioMatch[1];
    const audioUrl = audioPath.startsWith("http")
      ? audioPath
      : `https://www.myinstants.com${audioPath}`;

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`Failed to download ${audioUrl}`);

    const buffer = Buffer.from(await audioRes.arrayBuffer());
    const ext = audioPath.includes(".mp3") ? ".mp3" : ".mp3";
    const fileSlug = slug.replace(/[^\w-]/g, "-").toLowerCase();
    const filename = `${fileSlug}${ext}`;

    mkdirSync(soundsDir, { recursive: true });
    writeFileSync(join(soundsDir, filename), buffer);

    const category = guessCategory(slug, title);
    const tags = slug
      .replace(/-\d+$/, "")
      .split("-")
      .filter((t) => t.length > 2);

    return {
      id: fileSlug,
      slug: fileSlug,
      title,
      file: `/sounds/${filename}`,
      category,
      tags: [...new Set([...tags, "myinstants", category.toLowerCase()])],
      emoji: guessEmoji(category, slug),
      duration: 3,
    };
  }

  throw new Error(`Could not fetch ${slug}`);
}

mkdirSync(soundsDir, { recursive: true });

const results = [];
const errors = [];

for (const slug of INSTANTS) {
  try {
    process.stdout.write(`Fetching ${slug}... `);
    const sound = await fetchInstant(slug);
    results.push(sound);
    console.log("OK");
  } catch (e) {
    console.log("FAIL");
    errors.push({ slug, error: String(e) });
  }
}

writeFileSync(
  join(__dirname, "imported-sounds.json"),
  JSON.stringify({ results, errors }, null, 2),
);

console.log(`\nImported ${results.length}/${INSTANTS.length} sounds`);
if (errors.length) console.log("Errors:", errors);
