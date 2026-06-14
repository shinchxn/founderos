import { db } from "./lib/db";
import { workspaces } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const existing = await db.select().from(workspaces).where(eq(workspaces.owner_id, "test-owner")).limit(1);
    console.log(existing);
    if (existing.length === 0) {
        await db.insert(workspaces).values({
            id: `ws_12345`,
            name: "Test Startup",
            slug: "test-startup",
            owner_id: "test-owner",
            plan: "free",
            setup_completed: false,
        });
        console.log("inserted");
    }
}
run().catch(console.error);
