"use client";

import { motion } from "framer-motion";
import { Keyboard, Settings, Upload, X } from "lucide-react";
import { useState } from "react";
import { useSoundboard } from "@/hooks/use-soundboard";
import type { OverlapMode, ShareMode } from "@/types/sound";
import { cn, isValidAudioFile } from "@/utils/cn";

const selectClassName =
  "w-full cursor-pointer appearance-none rounded-xl border border-card-border bg-input px-3 py-2.5 text-sm text-foreground shadow-inner outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20";

const inputClassName =
  "w-full rounded-xl border border-card-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-card-border bg-modal p-6 sm:max-w-lg sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    settings,
    updateSettings,
    clearFavorites,
    clearRecent,
    clearPlayCounts,
    shortcuts,
    removeShortcut,
  } = useSoundboard();

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <Field label="Overlap mode">
          <select
            value={settings.overlapMode}
            onChange={(e) => updateSettings({ overlapMode: e.target.value as OverlapMode })}
            className={selectClassName}
          >
            <option value="overlap">Overlapping playback</option>
            <option value="single">Single playback</option>
            <option value="queue">Queue mode</option>
          </select>
        </Field>

        <Field label="Theme">
          <select
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as "dark" | "light" })}
            className={selectClassName}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </Field>

        <Field label="Share button">
          <select
            value={settings.shareMode}
            onChange={(e) => updateSettings({ shareMode: e.target.value as ShareMode })}
            className={selectClassName}
          >
            <option value="mp3">Share MP3 file</option>
            <option value="link">Share soundboard link</option>
          </select>
        </Field>

        <label className="flex items-center justify-between gap-3 text-sm text-foreground">
          Autoplay on shared links
          <input
            type="checkbox"
            checked={settings.autoplayOnShare}
            onChange={(e) => updateSettings({ autoplayOnShare: e.target.checked })}
            className="h-5 w-5 accent-violet-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm text-foreground">
          Haptic feedback (mobile)
          <input
            type="checkbox"
            checked={settings.vibrationEnabled}
            onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
            className="h-5 w-5 accent-violet-500"
          />
        </label>

        <Field label="Max recent history">
          <input
            type="number"
            min={5}
            max={50}
            value={settings.maxRecent}
            onChange={(e) => updateSettings({ maxRecent: Number(e.target.value) })}
            className={inputClassName}
          />
        </Field>

        {shortcuts.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">Keyboard shortcuts</p>
            <ul className="space-y-1 text-sm text-foreground">
              {shortcuts.map((s) => (
                <li key={s.soundId} className="flex items-center justify-between">
                  <span>{s.key.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => removeShortcut(s.soundId)}
                    className="text-xs text-red-600 dark:text-red-300 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <DangerButton onClick={clearRecent}>Clear recent</DangerButton>
          <DangerButton onClick={clearFavorites}>Clear favorites</DangerButton>
          <DangerButton onClick={clearPlayCounts}>Clear play counts</DangerButton>
        </div>
      </div>
    </Modal>
  );
}

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sounds, shortcuts, setShortcut, removeShortcut } = useSoundboard();
  const [selectedSound, setSelectedSound] = useState(sounds[0]?.id ?? "");
  const [keyInput, setKeyInput] = useState("");

  const handleAssign = () => {
    if (!selectedSound || !keyInput) return;
    setShortcut(selectedSound, keyInput);
    setKeyInput("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts">
      <p className="mb-4 text-sm text-muted">
        Assign keys to sounds for instant desktop playback. Press the key while not typing in an
        input field.
      </p>
      <div className="space-y-3">
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value)}
          className={selectClassName}
        >
          {sounds.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.title}
            </option>
          ))}
        </select>
        <input
          value={keyInput}
          onKeyDown={(e) => {
            e.preventDefault();
            setKeyInput(e.key.toLowerCase());
          }}
          readOnly
          placeholder="Press a key..."
          className={inputClassName}
        />
        <button
          type="button"
          onClick={handleAssign}
          className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white hover:bg-violet-400"
        >
          Assign shortcut
        </button>
      </div>
      {shortcuts.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {shortcuts.map((s) => {
            const sound = sounds.find((x) => x.id === s.soundId);
            return (
              <li
                key={s.soundId}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-foreground"
              >
                <span>
                  <kbd className="rounded bg-surface-hover px-2 py-0.5">{s.key.toUpperCase()}</kbd>{" "}
                  {sound?.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeShortcut(s.soundId)}
                  className="text-xs text-red-600 dark:text-red-300"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

export function HeaderActions() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <HeaderIconButton label="Upload sound" onClick={() => setUploadOpen(true)}>
          <Upload className="h-5 w-5" />
        </HeaderIconButton>
        <HeaderIconButton label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
          <Keyboard className="h-5 w-5" />
        </HeaderIconButton>
        <HeaderIconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </HeaderIconButton>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCustomSound } = useSoundboard();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎵");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setEmoji("🎵");
    setTags("");
    setFile(null);
    setError(null);
  };

  const handleFile = (f: File) => {
    if (!isValidAudioFile(f)) {
      setError("Unsupported audio format. Use MP3, WAV, OGG, or WebM.");
      return;
    }
    setError(null);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) {
      setError("Title and audio file are required.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB for local storage.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    addCustomSound({
      title: title.trim(),
      file: dataUrl,
      category: "Custom",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      emoji: emoji || "🎵",
      duration: 0,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Custom Sound">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "mb-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-violet-400 bg-violet-500/10" : "border-card-border bg-surface",
        )}
      >
        <p className="text-sm text-foreground">Drag & drop an audio file here</p>
        <label className="mt-3 inline-block cursor-pointer rounded-xl bg-surface px-4 py-2 text-sm text-foreground hover:bg-surface-hover">
          Browse files
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        {file && <p className="mt-2 text-xs text-accent-text">{file.name}</p>}
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sound title"
          className={inputClassName}
        />
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="Emoji"
          maxLength={4}
          className={inputClassName}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className={inputClassName}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white"
        >
          Save to soundboard
        </button>
      </div>
    </Modal>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function DangerButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300 hover:bg-red-500/20"
    >
      {children}
    </button>
  );
}

function HeaderIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-foreground hover:bg-surface-hover"
    >
      {children}
    </button>
  );
}
