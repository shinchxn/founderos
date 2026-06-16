import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import pLimit from "p-limit";
import { syncGoogleCalendar } from "@/lib/integrations/google-sync";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allWorkspaces = await db.query.workspaces.findMany();
    const limit = pLimit(3);

    const results = await Promise.allSettled(
      allWorkspaces.map(ws => limit(async () => {
        await syncGoogleCalendar(ws.id);
      }))
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
