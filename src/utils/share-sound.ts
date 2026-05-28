import type { ShareMode, Sound } from "@/types/sound";

function getExtension(file: string): string {
  const match = file.match(/\.(mp3|wav|ogg|webm|aac|m4a|mpeg|mpga)(\?|$)/i);
  return match?.[1]?.toLowerCase() ?? "mp3";
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    mp3: "audio/mpeg",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    webm: "audio/webm",
    aac: "audio/aac",
    m4a: "audio/mp4",
  };
  return types[ext] ?? "audio/mpeg";
}

export async function getSoundAudioFile(sound: Sound): Promise<File> {
  const ext = getExtension(sound.file);
  const filename = `${sound.slug}.${ext}`;
  const response = await fetch(sound.file);
  if (!response.ok) throw new Error("Could not load audio file");
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || getMimeType(ext) });
}

export async function shareSoundLink(sound: Sound): Promise<void> {
  const url = `${window.location.origin}/sound/${sound.slug}`;

  if (navigator.share) {
    await navigator.share({ title: sound.title, text: sound.title, url });
    return;
  }

  await navigator.clipboard.writeText(url);
}

export async function shareSoundFile(sound: Sound): Promise<void> {
  const file = await getSoundAudioFile(sound);

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: sound.title,
      text: sound.title,
      files: [file],
    });
    return;
  }

  downloadFile(file);
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareSound(sound: Sound, mode: ShareMode): Promise<void> {
  if (mode === "link") {
    await shareSoundLink(sound);
    return;
  }
  await shareSoundFile(sound);
}
