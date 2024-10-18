"use client";

import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";
import { toast } from "@/lib/components/ui/use-toast";
import { Share1Icon, Link1Icon } from "@radix-ui/react-icons";
import { useSyncExternalStore } from "react";

export function ShareDropdownButton({ path }: { path: string }) {
  const isMobile = useSyncExternalStore(
    () => () => {}, // Empty subscribe because we never need to update
    () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
    () => false,
  );
  return (
    <DropdownMenuItem
      onSelect={() => {
        const data: ShareData = {
          title: "Frontpage",
          url: new URL(path, location.href).toString(),
        };

        try {
          if (isMobile && navigator.canShare(data)) {
            void navigator.share(data);
            return;
          }
        } catch (_) {
          // Ignore
        }
        void navigator.clipboard
          .writeText(new URL(path, location.href).toString())
          .then(() => {
            toast({
              title: "Link copied to clipboard",
              type: "foreground",
            });
          });
      }}
    >
      {isMobile ? (
        <>
          <Share1Icon className="mr-2" />
          Share link
        </>
      ) : (
        <>
          <Link1Icon className="mr-2" />
          Copy link to clipboard
        </>
      )}
    </DropdownMenuItem>
  );
}
