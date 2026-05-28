import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPassword, verifySecurityAnswer } from "@/lib/security-answer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      answer?: string;
      newPassword?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const answer = body.answer ?? "";
    const newPassword = body.newPassword ?? "";

    if (!email || !answer || !newPassword) {
      return NextResponse.json({ error: "Email, answer, and new password are required." }, { status: 400 });
    }
    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, security_answer_hash")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.security_answer_hash) {
      return NextResponse.json({ error: "Could not reset password." }, { status: 400 });
    }

    const valid = await verifySecurityAnswer(answer, profile.security_answer_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect security answer." }, { status: 400 });
    }

    const { error } = await admin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (error) {
      console.error("recovery reset", error);
      return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("POST /api/auth/recovery/reset", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
