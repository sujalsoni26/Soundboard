import { Howl, Howler } from "howler";
import type { OverlapMode, Sound } from "@/types/sound";

type PlayCallback = (soundId: string) => void;
type StopCallback = (soundId: string) => void;

interface PooledHowl {
  howl: Howl;
  soundId: string | null;
}

class AudioManager {
  private pools = new Map<string, PooledHowl[]>();
  private primaryHowls = new Map<string, Howl>();
  private activeIds = new Map<string, number[]>();
  private volume = 0.85;
  private overlapMode: OverlapMode = "overlap";
  private queue: string[] = [];
  private isProcessingQueue = false;
  private onPlayCallback: PlayCallback | null = null;
  private onStopCallback: StopCallback | null = null;
  private onErrorCallback: ((soundId: string, error: unknown) => void) | null = null;
  private poolSize = 3;

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    Howler.volume(this.volume);
  }

  getVolume() {
    return this.volume;
  }

  setOverlapMode(mode: OverlapMode) {
    this.overlapMode = mode;
    if (mode === "single") {
      this.stopAllSounds();
    }
  }

  onPlay(callback: PlayCallback) {
    this.onPlayCallback = callback;
  }

  onStop(callback: StopCallback) {
    this.onStopCallback = callback;
  }

  onError(callback: (soundId: string, error: unknown) => void) {
    this.onErrorCallback = callback;
  }

  preloadSound(sound: Sound) {
    if (this.primaryHowls.has(sound.id)) return;

    const howl = new Howl({
      src: [sound.file],
      preload: true,
      volume: this.volume,
      html5: false,
      onloaderror: (_id, error) => {
        this.onErrorCallback?.(sound.id, error);
      },
      onplayerror: (_id, error) => {
        this.onErrorCallback?.(sound.id, error);
      },
    });

    this.primaryHowls.set(sound.id, howl);

    const pool: PooledHowl[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      pool.push({
        howl: new Howl({
          src: [sound.file],
          preload: true,
          volume: this.volume,
          html5: false,
        }),
        soundId: null,
      });
    }
    this.pools.set(sound.id, pool);
  }

  preloadSounds(sounds: Sound[]) {
    sounds.forEach((sound) => this.preloadSound(sound));
  }

  unloadSound(soundId: string) {
    const primary = this.primaryHowls.get(soundId);
    primary?.unload();
    this.primaryHowls.delete(soundId);

    const pool = this.pools.get(soundId);
    pool?.forEach((p) => p.howl.unload());
    this.pools.delete(soundId);
    this.activeIds.delete(soundId);
  }

  playSound(soundId: string, file?: string) {
    if (this.overlapMode === "queue") {
      this.queue.push(soundId);
      this.processQueue();
      return;
    }

    if (this.overlapMode === "single") {
      this.stopAllSounds();
    }

    this.playImmediate(soundId, file);
  }

  private playImmediate(soundId: string, file?: string) {
    if (!this.primaryHowls.has(soundId) && file) {
      this.preloadSound({ id: soundId, file } as Sound);
    }

    const pool = this.pools.get(soundId);
    let howl: Howl | undefined;
    let playId: number | undefined;

    if (pool) {
      const available = pool.find((p) => !p.howl.playing());
      const entry = available ?? pool[0];
      entry.soundId = soundId;
      howl = entry.howl;
      howl.volume(this.volume);
      playId = howl.play();
    } else {
      const primary = this.primaryHowls.get(soundId);
      if (!primary) return;
      howl = primary;
      howl.volume(this.volume);
      playId = howl.play();
    }

    if (playId === undefined) return;

    const ids = this.activeIds.get(soundId) ?? [];
    ids.push(playId);
    this.activeIds.set(soundId, ids);

    howl.once(
      "end",
      () => {
        const current = this.activeIds.get(soundId) ?? [];
        const remaining = current.filter((id) => id !== playId);
        this.activeIds.set(soundId, remaining);
        if (remaining.length === 0) {
          this.onStopCallback?.(soundId);
        }
        if (this.overlapMode === "queue") {
          this.processQueue();
        }
      },
      playId,
    );

    this.onPlayCallback?.(soundId);
  }

  private processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;

    const anyPlaying = Array.from(this.activeIds.values()).some((ids) => ids.length > 0);
    if (anyPlaying) return;

    this.isProcessingQueue = true;
    const nextId = this.queue.shift();
    if (nextId) {
      this.playImmediate(nextId);
    }
    this.isProcessingQueue = false;
  }

  stopSound(soundId: string) {
    const wasPlaying = this.isPlaying(soundId);
    const primary = this.primaryHowls.get(soundId);
    primary?.stop();

    const pool = this.pools.get(soundId);
    pool?.forEach((p) => p.howl.stop());

    this.activeIds.set(soundId, []);
    if (wasPlaying) {
      this.onStopCallback?.(soundId);
    }
  }

  stopAllSounds() {
    Howler.stop();
    this.activeIds.clear();
    this.queue = [];
    this.isProcessingQueue = false;
  }

  isPlaying(soundId: string): boolean {
    const ids = this.activeIds.get(soundId);
    return (ids?.length ?? 0) > 0;
  }

  destroy() {
    this.stopAllSounds();
    this.primaryHowls.forEach((howl) => howl.unload());
    this.pools.forEach((pool) => pool.forEach((p) => p.howl.unload()));
    this.primaryHowls.clear();
    this.pools.clear();
    this.onPlayCallback = null;
    this.onStopCallback = null;
    this.onErrorCallback = null;
  }
}

export const audioManager = new AudioManager();
