import { db } from "../db";
import { workspace_integrations, meetings } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt, encrypt } from "../crypto";
import crypto from "crypto";

export async function syncGoogleCalendar(workspaceId: string) {
  try {
    const integration = await db.query.workspace_integrations.findFirst({
      where: and(
        eq(workspace_integrations.workspace_id, workspaceId),
        eq(workspace_integrations.provider, "google_calendar"),
        eq(workspace_integrations.status, "active")
      )
    });

    if (!integration || !integration.refresh_token) {
      return { success: false, error: "No active Google integration" };
    }

    const refreshToken = decrypt(integration.refresh_token);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to refresh token: ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    await db.update(workspace_integrations).set({
      access_token: encrypt(accessToken),
      last_synced_at: new Date()
    }).where(eq(workspace_integrations.id, integration.id));

    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date().toISOString();

    const calendarResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!calendarResponse.ok) {
      throw new Error(`Failed to fetch calendar events: ${await calendarResponse.text()}`);
    }

    const events = await calendarResponse.json();

    let newMeetings = 0;
    for (const event of events.items || []) {
      const title = (event.summary || "").toLowerCase();
      if (!title.includes("meeting") && !title.includes("demo") && !title.includes("sync")) {
        continue;
      }

      const existing = await db.query.meetings.findFirst({
        where: eq(meetings.external_event_id, event.id)
      });

      if (!existing && event.start?.dateTime) {
        const attendees = event.attendees ? event.attendees.map((a: any) => a.email) : [];
        
        await db.insert(meetings).values({
          id: `mtg_${crypto.randomUUID()}`,
          workspace_id: workspaceId,
          title: event.summary || "Untitled Meeting",
          meeting_date: new Date(event.start.dateTime),
          attendees,
          source: "google_calendar",
          external_event_id: event.id,
          raw_notes: event.description || "",
          processed: false
        });
        newMeetings++;
      }
    }

    return { success: true, count: newMeetings };
  } catch (error: any) {
    console.error("Google Sync failed:", error.message);
    return { success: false, error: error.message };
  }
}
