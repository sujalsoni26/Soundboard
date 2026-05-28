import bcrypt from "bcryptjs";
import { isAllowedSecurityQuestion } from "@/lib/security-questions";

const SALT_ROUNDS = 10;

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export async function hashSecurityAnswer(answer: string): Promise<string> {
  return bcrypt.hash(normalizeSecurityAnswer(answer), SALT_ROUNDS);
}

export async function verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(normalizeSecurityAnswer(answer), hash);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidSecuritySetup(question: string, answer: string): boolean {
  return isAllowedSecurityQuestion(question) && normalizeSecurityAnswer(answer).length >= 2;
}
