import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/sync";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Profile lookup via service role — avoids RLS recursion on profiles table. */
export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfileByUserId", error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role === "admin" ? "admin" : "user",
  };
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getAuthenticatedProfile(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  const user = await getSessionUser();
  if (!user) return { user: null, profile: null };

  const profile =
    (await getProfileByUserId(user.id)) ??
    ({
      id: user.id,
      email: user.email ?? null,
      role: "user",
    } satisfies UserProfile);

  return { user, profile };
}

export async function requireAdminUser(): Promise<
  { user: User; profile: UserProfile } | { error: "unauthorized" | "forbidden" }
> {
  const { user, profile } = await getAuthenticatedProfile();
  if (!user) return { error: "unauthorized" };
  if (profile?.role !== "admin") return { error: "forbidden" };
  return { user, profile };
}

export function adminAuthError(error: "unauthorized" | "forbidden") {
  return NextResponse.json(
    { error: error === "unauthorized" ? "Unauthorized" : "Forbidden" },
    { status: error === "unauthorized" ? 401 : 403 },
  );
}
