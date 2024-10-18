"use client";

import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";
import { toast } from "@/lib/components/ui/use-toast";
import { Share1Icon, Link1Icon } from "@radix-ui/react-icons";

const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

export function ShareDropdownButton({ path }: { path: string }) {
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
