"use client";

import { useState } from "react";
import { Modal } from "@/components/Modals";
import { useAuth } from "@/hooks/use-auth";
import { isAllowedSecurityQuestion, SECURITY_QUESTIONS } from "@/lib/security-questions";

export type AuthModalMode = "signin" | "signup" | "forgot";

const inputClassName =
  "w-full rounded-xl border border-card-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted";

const selectClassName =
  "w-full cursor-pointer appearance-none rounded-xl border border-card-border bg-input px-3 py-2.5 text-sm text-foreground shadow-inner outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
  onSuccess?: () => void;
}

export function AuthModal({ open, onClose, initialMode = "signin", onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetForgot = () => {
    setRecoveryQuestion(null);
    setSecurityAnswer("");
    setNewPassword("");
    setError(null);
    setStatus(null);
  };

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    onClose();
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isAllowedSecurityQuestion(securityQuestion)) {
      setError("Please select a security question.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    const result = await signUp({
      email,
      password,
      securityQuestion,
      securityAnswer,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    onClose();
  };

  const handleFetchQuestion = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/recovery/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { question?: string | null; message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not load question.");
      setRecoveryQuestion(json.question ?? null);
      setStatus(json.message ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not load question.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answer: securityAnswer, newPassword }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not reset password.");
      setStatus(json.message ?? "Password updated.");
      setMode("signin");
      resetForgot();
      setPassword("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {mode === "signin" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Sign in to sync favorites, playlists, and custom sounds across devices.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={inputClassName}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={inputClassName}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSignIn();
            }}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          {status && <p className="text-sm text-accent-text">{status}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSignIn()}
            className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                resetForgot();
                setMode("forgot");
              }}
              className="text-violet-500"
            >
              Forgot password?
            </button>
            <button type="button" onClick={() => setMode("signup")} className="text-muted">
              Create account
            </button>
          </div>
        </div>
      )}

      {mode === "signup" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Create an account with a security question for password recovery.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={inputClassName}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            autoComplete="new-password"
            className={inputClassName}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className={inputClassName}
          />
          <select
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select a security question</option>
            {SECURITY_QUESTIONS.map((question) => (
              <option key={question} value={question}>
                {question}
              </option>
            ))}
          </select>
          <input
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Security answer"
            className={inputClassName}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSignUp()}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
          <button type="button" onClick={() => setMode("signin")} className="text-xs text-muted">
            Already have an account? Sign in
          </button>
        </div>
      )}

      {mode === "forgot" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Enter your email, answer your security question, then set a new password.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={inputClassName}
          />
          {!recoveryQuestion ? (
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={() => void handleFetchQuestion()}
              className="w-full rounded-xl border border-card-border bg-surface py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
            >
              {busy ? "Loading…" : "Get security question"}
            </button>
          ) : (
            <>
              <p className="rounded-xl bg-surface px-3 py-2 text-sm text-foreground">
                {recoveryQuestion}
              </p>
              <input
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Your answer"
                className={inputClassName}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (6+ characters)"
                autoComplete="new-password"
                className={inputClassName}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleResetPassword()}
                className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy ? "Updating…" : "Reset password"}
              </button>
            </>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          {status && <p className="text-sm text-accent-text">{status}</p>}
          <button
            type="button"
            onClick={() => {
              resetForgot();
              setMode("signin");
            }}
            className="text-xs text-muted"
          >
            Back to sign in
          </button>
        </div>
      )}
    </Modal>
  );
}
