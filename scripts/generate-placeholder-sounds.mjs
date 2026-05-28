import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = join(__dirname, "..", "public", "sounds");

const slugs = [
  "vine-boom",
  "metal-pipe",
  "bruh",
  "oh-no",
  "emotional-damage",
  "sigma-grindset",
  "anime-wow",
  "windows-xp",
  "minecraft-oof",
  "discord-join",
  "airhorn",
  "sad-violin",
  "cricket",
  "record-scratch",
  "taco-bell",
  "wilhelm-scream",
  "among-us",
  "skibidi",
  "rizz",
  "gyatt",
  "sheesh",
  "bonk",
  "quandale-dingle",
  "fortnite-death",
  "thanos-snap",
];

function createWav(frequency, durationSec = 0.35) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 6);
    const sample =
      Math.sin(2 * Math.PI * frequency * t) * envelope * 0.35 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * envelope * 0.15;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

mkdirSync(soundsDir, { recursive: true });

slugs.forEach((slug, index) => {
  const frequency = 180 + (index % 12) * 40;
  writeFileSync(join(soundsDir, `${slug}.wav`), createWav(frequency));
});

console.log(`Generated ${slugs.length} placeholder sounds in public/sounds/`);
