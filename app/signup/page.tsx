/**
 * app/signup/page.tsx
 *
 * FIXED: Import signIn from @/auth (root), not @/lib/auth (deleted)
 */
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";

export default function SignupPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-sm rounded-lg bg-gray-900 border border-gray-800 p-8 shadow-sm text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Sign Up</h1>
        <p className="text-sm text-gray-400 mb-8">Create your FounderOS account.</p>

        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const name = formData.get("name") as string;

            if (!email || !password || password.length < 6) return;

            const existingUser = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1);
            if (existingUser.length > 0) return;

            const password_hash = await bcrypt.hash(password, 10);
            const userId = `usr_${Date.now()}`;

            await db.insert(users).values({
              id: userId,
              email,
              name: name || email.split("@")[0],
              password_hash,
            });

            const slug = email
              .split("@")[0]
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-");
            await db.insert(workspaces).values({
              id: `ws_${Date.now()}`,
              name: name ? `${name}'s Startup` : "My Startup",
              slug,
              owner_id: userId,
              plan: "free",
              setup_completed: false,
            });

            await signIn("credentials", {
              email,
              password,
              redirectTo: "/",
            });
          }}
          className="flex flex-col gap-4 mb-6"
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="founder@startup.com"
            required
            className="w-full rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={6}
            className="w-full rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
          >
            Create Account
          </button>
        </form>

        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
