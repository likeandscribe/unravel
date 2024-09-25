import { db } from "@/lib/db";
import { sendDiscordMessage } from "@/lib/discord";
import type { NextRequest } from "next/server";
import * as schema from "@/lib/schema";
import { lt, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await sendDiscordMessage({
      embeds: [
        {
          title: "Unauthorized request to cron endpoint",
          description: `Request: ${request.url}`,
          color: 16711680,
        },
      ],
    });
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    // Delete all expired oauth requests
    const deletedRequests = await db.transaction(async (tx) => {
      const expiredRequests = await db.query.OauthAuthRequest.findMany({
        where: lt(schema.OauthAuthRequest.expiresAt, new Date()),
      });

      await tx.delete(schema.OauthAuthRequest).where(
        inArray(
          schema.OauthAuthRequest.state,
          expiredRequests.map((r) => r.state),
        ),
      );

      return expiredRequests.length;
    });

    // Delete all oauth sessions that expired more than 90 days ago
    const deletedSessions = await db.transaction(async (tx) => {
      const expiredSessions = await db.query.OauthSession.findMany({
        where: lt(
          schema.OauthSession.expiresAt,
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        ),
      });

      await tx.delete(schema.OauthSession).where(
        inArray(
          schema.OauthSession.refreshToken,
          expiredSessions.map((s) => s.refreshToken),
        ),
      );

      return expiredSessions.length;
    });

    await sendDiscordMessage({
      embeds: [
        {
          title: "Cleaned up OAuth tokens",
          description: `Deleted ${deletedRequests} auth requests and ${deletedSessions} sessions`,
          color: 65280,
        },
      ],
    });
  } catch (e) {
    await sendDiscordMessage({
      embeds: [
        {
          title: "Error cleaning up OAuth tokens",
          description: e instanceof Error ? e.message : "Unknown error",
          color: 16711680,
        },
      ],
    });
    return new Response("Error", {
      status: 500,
    });
  }

  return Response.json({ success: true });
}
