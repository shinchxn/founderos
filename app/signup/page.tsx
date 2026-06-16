/**
 * app/signup/page.tsx
 *
 * FounderOS uses Google OAuth exclusively — no email/password credentials.
 * This page simply redirects to /login to avoid a broken credentials sign-in flow.
 */
import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login");
}
