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
import { Textarea } from "@/lib/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/lib/components/ui/select";
import { ReportReason } from "@/lib/constants";

type EllipsisDropdownProps = {
  onReportAction: (formData: FormData) => Promise<void>;
  onDeleteAction: () => Promise<void>;
  isAuthor: boolean;
};

export function EllipsisDropdown({
  onReportAction,
  onDeleteAction,
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will report the post. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form
                action={async (formData) => {
                  try {
                    await onReportAction(formData);
                  } catch (_) {
                    toast({
                      title: "Something went wrong",
                      type: "foreground",
                    });
                    return;
                  }
                  toast({
                    title: "Post reported",
                    type: "foreground",
                  });
                  setOpen(false);
                }}
              >
                <Select name="reportReason">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Please select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ReportReason).map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  id="textArea"
                  name="creatorComment"
                  placeholder="Enter your report reason here..."
                  // disabled={isPending}
                  className="resize-y flex-1"
                  maxLength={250}
                />
                <AlertDialogFooter>
                  <Button variant="success" type="submit">
                    Confirm
                  </Button>
                  <AlertDialogCancel
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
          {/* TODO: delete the true bit when done */}
          {isAuthor ? (
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
                    This will delete the post. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    onClick={() => {
                      void onDeleteAction();
                      toast({
                        title: "Post deleted",
                        type: "foreground",
                      });
                      setOpen(false);
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                  <AlertDialogCancel onClick={() => setOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
