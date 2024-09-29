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
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
import { toast } from "@/lib/components/ui/use-toast";

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
    <AlertDialog>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem>
                <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </AlertDialogTrigger>
            {isAuthor || true ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will report the post. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              void onReport();
              toast({
                title: "Post reported",
                type: "foreground",
              });
            }}
          >
            Confirm
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
