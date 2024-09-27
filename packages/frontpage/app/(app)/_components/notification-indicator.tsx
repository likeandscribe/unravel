import { ReactNode, Suspense } from "react";
import { NotificationIndicatorCount } from "./notification-indicator-client";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/data/user";
import { getNotificationCount } from "@/lib/data/db/notification";
import { ErrorBoundary } from "react-error-boundary";

export async function NotificationIndicator({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();
  if (user === null) return null;
  return (
    <div className="relative">
      {children}
      <ErrorBoundary fallback={null}>
        <Suspense>
          <NotificationIndicatorInner />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function NotificationIndicatorInner() {
  return (
    <SWRConfig
      value={{
        fallback: {
          notifications: getNotificationCount(),
        },
      }}
    >
      <NotificationIndicatorCount />
    </SWRConfig>
  );
}
