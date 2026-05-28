import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashSecurityAnswer,
  isValidPassword,
  isValidSecuritySetup,
} from "@/lib/security-answer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      securityQuestion?: string;
      securityAnswer?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const securityQuestion = body.securityQuestion?.trim() ?? "";
    const securityAnswer = body.securityAnswer ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!isValidSecuritySetup(securityQuestion, securityAnswer)) {
      return NextResponse.json(
        { error: "Select a security question and provide an answer (2+ characters)." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const answerHash = await hashSecurityAnswer(securityAnswer);

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const message =
        error.message.includes("already") || error.message.includes("registered")
          ? "An account with this email already exists."
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Could not create account." }, { status: 500 });
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email,
        security_question: securityQuestion,
        security_answer_hash: answerHash,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("signup profile update", profileError);
      return NextResponse.json({ error: "Account created but setup failed. Try signing in." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/signup", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
