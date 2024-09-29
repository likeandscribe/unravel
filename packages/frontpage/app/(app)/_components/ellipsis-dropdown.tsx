"use client";

import * as React from "react";
import { MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { DialogHeader } from "@/lib/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@radix-ui/react-dialog";

type EllipsisDropdownProps = {
  onReport: () => Promise<void>;
  onDelete: () => Promise<void>;
  isAuthor: boolean;
};

export function EllipsisDropdown({
  onReport,
  onDelete,
  isAuthor,
}: EllipsisDropdownProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void onReport?.();
                  setOpen(false);
                }}
              >
                <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This will report the comment. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          {isAuthor || true ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(e) => {
                  e.preventDefault();
                  void onDelete?.();
                  setOpen(false);
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
