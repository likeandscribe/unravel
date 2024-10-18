import { getNotifications } from "@/lib/data/db/notification";

export default async function NotificationsPage() {
  const notifications = await getNotifications(40, null);
  return (
    <>
      <h1 className="scroll-m-20 text-xl font-extrabold lg:text-2xl">
        Notifications
      </h1>
      {JSON.stringify(notifications)}
    </>
  );
}
