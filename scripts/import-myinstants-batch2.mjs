import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = join(__dirname, "..", "public", "sounds");

const BATCH2 = [
  "acha-46597",
  "sad-music-indian-15435",
  "aaaaaaaaaaaaaaaaaaaa-e-lutador-57357",
  "ek-gand-pe-repta-mara-n-sarak-pe-hagta-firega-11613",
  "bhai-bhai-bhai-38566",
  "oh-my-god-bro-oh-hell-nah-man-42939",
  "modi-ji-wah-48264",
  "tmkc-mahavirwa-wala-99742",
  "aisa-mat-karo-23529",
  "hub-intro-sound-55662",
  "backgroundmusic-23710",
  "lund-pakad-ke-tarazu-ki-tarah-cid-66511",
  "shabash-beta-31847",
  "laughing-dog-meme-78821",
  "accha-thik-hai-samjhgya-puneet-superstar-33917",
  "adele-this-is-the-end",
  "buzzer-89244",
  "yeah-boiii-i-i-i-58469",
  "phir-teri-maiya-chodta-hu-cid-56653",
  "modi-modi-modi-modi-kids-27626",
  "chalti-firti-cocaine-88830",
  "auughhh-79002",
  "non-stop-gali-in-hindi-2-54544",
  "itna-chubne-laga-hu-sabko-79302",
  "kya-cheda-bhosdi-89393",
  "helicopter-helicopter-parakofer-parakofer-37107",
  "teri-gand-mari-93488",
  "rolaa-jamana-hai-11468",
  "ma-ka-bhosda-aag-5304",
  "hindi-phone-cannot-be-reached-6706",
  "wrong-answer-buzzer-6983",
  "67-71609",
  "dhoom-tana-82229",
  "happy-happy-happy-song-980",
  "teri-maa-ka-bosda-fat-jaga-74642",
  "wide-putin-meme-6467",
  "brother-ewwwwwww-24543",
  "cid-chut-59780",
  "alakh-sir-motivation-1306",
  "deg-deg-44362",
  "chodu-cid-92223",
  "whip",
  "indian-chappal-attack-scream-sound-byte-84039",
  "gali-bhaiya-mere-muh-se-nikal-gaye-49160",
  "modi-ji-rona-band-kijiye-30742",
  "kbc-question-60314",
  "aah-meme-jacqueline-fernandez-61374",
  "tiktok-chapri-music-25863",
  "lund-10-inch-lamba-96789",
  "bol-na-madarchod-26409",
  "arpit-bala-43205",
  "sorry-sorry-sorry-18541",
  "neta-neta-har-koi-kehta-15530",
  "the-weeknd-rizzz-2710",
  "fbi-open-up-with-explosion-491",
  "kissing-sound",
  "chup-kar-be-kutte-70666",
  "fein-fein-fein-fein-90628",
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
  if (/anime|jacqueline|aah-meme/.test(s)) return "Anime";
  if (
    /modi|cid|puneet|hindi|kbc|bhai|acha|shabash|dhoom|neta|chappal|gali|tmkc|aisa-mat|indian|sad-music-indian|bol-na|arpit|deg-deg|alakh|rolaa|chup-kar|sorry-sorry|itna-chubne|kya-cheda|teri-|ma-ka|phir-teri|chodu|chalti-firti|non-stop-gali|ek-gand|buzz.*hindi|phone-cannot/.test(
      s,
    )
  )
    return "Bollywood";
  if (
    /fahhh|gopgop|rizzbot|galaxy|mka-ladle|tiki-tiki|meow|romanceeee|eh-eh-ehhhh|fein|67-|tiktok-chapri|helicopter|wide-putin|auughhh|yeah-boiii|hub-intro|backgroundmusic|deg-deg|happy-happy|the-weeknd-rizz|oh-my-god-bro|brother-ewww|aaaaaaaaaaaa/.test(
      s,
    )
  )
    return "Brainrot";
  if (
    /spiderman|spongebob|run-vine|bruh|emotional|aww|fart|haha-funny|cat-laugh|laughing-dog|adele|fbi|buzzer|whip|kissing|oh-my-god-bro/.test(
      s,
    )
  )
    return "Classic";
  if (/alakh-sir-motivation/.test(s)) return "Sigma";
  if (/gaming|minecraft|fortnite/.test(s)) return "Gaming";
  return "Sound Effects";
}

function guessEmoji(category, slug) {
  const map = {
    Bollywood: "🎬",
    Anime: "⛩️",
    Brainrot: "🧠",
    Classic: "🎭",
    Sigma: "🗿",
    Gaming: "🎮",
    "Sound Effects": "🔊",
  };
  if (/fart/.test(slug)) return "💨";
  if (/cat|meow|dog/.test(slug)) return "🐱";
  if (/modi/.test(slug)) return "🇮🇳";
  if (/cid/.test(slug)) return "🕵️";
  if (/puneet/.test(slug)) return "💪";
  if (/buzzer|wrong-answer/.test(slug)) return "🔔";
  if (/fbi/.test(slug)) return "🚔";
  if (/helicopter/.test(slug)) return "🚁";
  if (/putin/.test(slug)) return "🕴️";
  if (/kbc/.test(slug)) return "❓";
  if (/rizz/.test(slug)) return "😎";
  if (/kissing/.test(slug)) return "💋";
  if (/whip/.test(slug)) return "🎵";
  if (/67/.test(slug)) return "6️⃣";
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
    const fileSlug = slug.replace(/[^\w-]/g, "-").toLowerCase();
    const filename = `${fileSlug}.mp3`;
    const filepath = join(soundsDir, filename);

    if (!existsSync(filepath)) {
      writeFileSync(filepath, buffer);
    }

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

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : BATCH2;
const results = [];
const errors = [];

for (const slug of slugs) {
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

const outFile = join(__dirname, "imported-sounds-batch2.json");
writeFileSync(outFile, JSON.stringify({ results, errors }, null, 2));
console.log(`\nImported ${results.length}/${slugs.length} sounds -> ${outFile}`);
if (errors.length) console.log("Errors:", errors);
