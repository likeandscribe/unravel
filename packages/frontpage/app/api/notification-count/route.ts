import { getNotificationCount } from "@/lib/data/db/notification";

export async function GET() {
  const count = await getNotificationCount();

  return Response.json(count);
}
