"use client";

import { motion } from "framer-motion";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modals";
import { useSoundboard } from "@/hooks/use-soundboard";
import type { Sound } from "@/types/sound";
import { cn } from "@/utils/cn";

const inputClassName =
  "w-full rounded-xl border border-card-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted";

export function EditSoundModal({
  sound,
  open,
  onClose,
}: {
  sound: Sound | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Sound">
      {sound ? <EditSoundForm key={sound.id} sound={sound} onClose={onClose} /> : null}
    </Modal>
  );
}

function EditSoundForm({ sound, onClose }: { sound: Sound; onClose: () => void }) {
  const {
    renameSound,
    resetSoundName,
    getOriginalTitle,
    playlists,
    addSoundToPlaylist,
    removeSoundFromPlaylist,
    isSoundInPlaylist,
    hideSound,
    unhideSound,
    isSoundHidden,
  } = useSoundboard();

  const original = getOriginalTitle(sound.id);
  const [name, setName] = useState(sound.title);
  const hidden = isSoundHidden(sound.id);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === original) resetSoundName(sound.id);
    else renameSound(sound.id, trimmed);
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{sound.emoji}</span>
        <div>
          <p className="text-sm text-muted">Original name</p>
          <p className="text-sm font-medium text-foreground">{original}</p>
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Display name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          placeholder="Your custom name"
        />
      </label>

      {name.trim() !== original && (
        <button
          type="button"
          onClick={() => setName(original)}
          className="text-sm text-accent-text hover:underline"
        >
          Reset to original name
        </button>
      )}

      {playlists.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-muted">Add to playlists</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {playlists.map((playlist) => {
              const checked = isSoundInPlaylist(playlist.id, sound.id);
              return (
                <li key={playlist.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm text-foreground active:bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        checked
                          ? removeSoundFromPlaylist(playlist.id, sound.id)
                          : addSoundToPlaylist(playlist.id, sound.id)
                      }
                      className="h-4 w-4 accent-violet-500"
                    />
                    <span>
                      {playlist.emoji} {playlist.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (hidden) unhideSound(sound.id);
          else hideSound(sound.id);
          onClose();
        }}
        className={cn(
          "w-full min-h-11 touch-manipulation rounded-xl py-2.5 text-sm font-medium active:scale-[0.98]",
          hidden
            ? "bg-surface text-foreground active:bg-surface-hover sm:hover:bg-surface-hover"
            : "bg-red-500/10 text-red-600 active:bg-red-500/20 dark:text-red-300",
        )}
      >
        {hidden ? "Unhide sound" : "Hide sound"}
      </button>

      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-11 touch-manipulation rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white active:opacity-90"
      >
        Save changes
      </button>
    </div>
  );
}

export function PlaylistsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    playlists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeSoundFromPlaylist,
    selectPlaylist,
    sounds,
    activePlaylistId,
  } = useSoundboard();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName.trim(), newEmoji || "📁");
    setNewName("");
    setNewEmoji("📁");
  };

  return (
    <Modal open={open} onClose={onClose} title="My Playlists">
      <div className="space-y-5">
        <div className="rounded-2xl border border-card-border bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Create playlist</p>
          <div className="flex gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              maxLength={4}
              className="w-14 rounded-xl border border-card-border bg-input px-2 py-2 text-center text-sm"
              aria-label="Playlist emoji"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name"
              className={cn(inputClassName, "flex-1")}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-violet-500 text-white active:opacity-90"
              aria-label="Create playlist"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {playlists.length === 0 ? (
          <p className="text-center text-sm text-muted">
            No playlists yet. Create one to group your favorite memes.
          </p>
        ) : (
          <ul className="space-y-3">
            {playlists.map((playlist) => {
              const playlistSounds = playlist.soundIds
                .map((id) => sounds.find((s) => s.id === id))
                .filter((s): s is Sound => Boolean(s));
              const isEditing = editingId === playlist.id;

              return (
                <li
                  key={playlist.id}
                  className="rounded-2xl border border-card-border bg-card p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={cn(inputClassName, "flex-1")}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          selectPlaylist(playlist.id);
                          onClose();
                        }}
                        className={cn(
                          "min-h-11 min-w-0 flex-1 touch-manipulation rounded-xl py-2 text-left text-base font-semibold text-foreground active:text-accent-text sm:hover:text-accent-text",
                          activePlaylistId === playlist.id && "text-accent-text",
                        )}
                      >
                        {playlist.emoji} {playlist.name}
                        <span className="ml-2 text-xs font-normal text-muted">
                          ({playlistSounds.length})
                        </span>
                      </button>
                    )}
                    <div className="flex shrink-0 gap-1">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (editName.trim()) updatePlaylist(playlist.id, { name: editName.trim() });
                            setEditingId(null);
                          }}
                          className="min-h-11 touch-manipulation rounded-lg px-3 py-2 text-xs text-violet-400 active:opacity-80"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(playlist.id);
                            setEditName(playlist.name);
                          }}
                          aria-label="Rename playlist"
                          className="inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg text-muted active:bg-surface-hover active:text-foreground sm:hover:bg-surface-hover sm:hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePlaylist(playlist.id)}
                        className="min-h-11 touch-manipulation rounded-lg px-3 py-2 text-xs text-red-600 active:bg-red-500/10 dark:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {playlistSounds.length > 0 ? (
                    <ul className="space-y-1 text-sm text-muted">
                      {playlistSounds.slice(0, 5).map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {s.emoji} {s.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSoundFromPlaylist(playlist.id, s.id)}
                            className="min-h-9 shrink-0 touch-manipulation px-2 text-xs text-red-600 active:opacity-80 dark:text-red-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {playlistSounds.length > 5 && (
                        <li className="text-xs">+{playlistSounds.length - 5} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">
                      Empty — use the edit button on a sound to add it here.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
