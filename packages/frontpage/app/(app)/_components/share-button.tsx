"use client";

import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";
import { toast } from "@/lib/components/ui/use-toast";
import { Share2Icon } from "@radix-ui/react-icons";

export function ShareDropdownButton({ path }: { path: string }) {
  return (
    <DropdownMenuItem
      onSelect={() => {
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
      <Share2Icon className="mr-2" /> Share
    </DropdownMenuItem>
  );
}
