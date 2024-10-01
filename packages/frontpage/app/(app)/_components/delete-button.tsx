"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/lib/components/ui/alert-dialog";
import { toast } from "@/lib/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/lib/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import { useEllipsisDropdownContext } from "./ellipsis-dropdown";

type DeleteButtonProps = {
  deleteAction: () => Promise<void>;
};

export function DeleteButton({ deleteAction }: DeleteButtonProps) {
  const ellipsisDropdownContext = useEllipsisDropdownContext();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-red-600"
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete your entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-3">
          <AlertDialogAction
            onClick={() => {
              void deleteAction();
              toast({
                title: "Your entry will be deleted shortly",
                type: "foreground",
              });
              ellipsisDropdownContext.close();
            }}
          >
            Confirm
          </AlertDialogAction>
          <AlertDialogCancel onClick={() => ellipsisDropdownContext.close()}>
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
