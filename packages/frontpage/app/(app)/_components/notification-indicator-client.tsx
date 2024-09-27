"use client";

import useSWR from "swr";

async function fetchNotificationCount() {
  const response = await fetch("/api/notifications/count");
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
  });

  if (count === 0) return null;

  return (
    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </div>
  );
}
