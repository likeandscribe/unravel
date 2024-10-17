"use client";

import useSWR from "swr";

async function fetchNotificationCount() {
  const response = await fetch("/api/notification-count");
  if (!response.ok) {
    throw new Error("Failed to fetch notification count");
  }
  const count = await response.json();
  if (typeof count !== "number") {
    throw new Error("Invalid notification count");
  }
  return count;
}

export function NotificationIndicatorCount() {
  const { data: count } = useSWR("notifications", fetchNotificationCount, {
    suspense: true,
    revalidateOnMount: false,
  });

  if (count === 0) return null;

  return (
    <div
      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
      aria-label={`${count} notifications.`}
    >
      {count > 9 ? "9+" : count}
    </div>
  );
}
