import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GENERIC_MESSAGE =
  "If an account exists with this email, your security question will appear below.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("security_question, security_answer_hash")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.security_question || !profile.security_answer_hash) {
      return NextResponse.json({ message: GENERIC_MESSAGE, question: null });
    }

    return NextResponse.json({
      message: GENERIC_MESSAGE,
      question: profile.security_question,
    });
  } catch (error) {
    console.error("POST /api/auth/recovery/question", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
