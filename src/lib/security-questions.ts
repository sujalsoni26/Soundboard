export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was your childhood nickname?",
  "What is the name of your favorite teacher?",
  "What street did you grow up on?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What was your favorite food as a child?",
] as const;

export type SecurityQuestion = (typeof SECURITY_QUESTIONS)[number];

export function isAllowedSecurityQuestion(question: string): question is SecurityQuestion {
  return (SECURITY_QUESTIONS as readonly string[]).includes(question);
}
