/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * FIXED: Import from @/auth (root auth.ts with full config + adapter)
 * Previously imported from @/lib/auth which was a stale competing config.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
