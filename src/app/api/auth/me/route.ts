import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth-server";

export async function GET() {
  try {
    const { user, profile } = await getAuthenticatedProfile();

    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
    });
  } catch (error) {
    console.error("GET /api/auth/me", error);
    return NextResponse.json({ user: null, profile: null });
  }
}
