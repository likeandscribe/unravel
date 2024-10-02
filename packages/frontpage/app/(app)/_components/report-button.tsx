"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/lib/components/ui/alert-dialog";
import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
import { toast } from "@/lib/components/ui/use-toast";
import { ReportReason } from "@/lib/constants";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useEllipsisDropdownContext } from "./ellipsis-dropdown";
import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { useState } from "react";

interface ReportButtonProps {
  reportAction: (formData: FormData) => Promise<void>;
}

export function ReportButtonIcon({ reportAction }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will report the entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            try {
              await reportAction(formData);
            } catch (_) {
              toast({
                title: "Something went wrong",
                type: "foreground",
              });
              return;
            }
            toast({
              title: "Report submitted",
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
            className="resize-y my-3"
            maxLength={250}
          />
          <AlertDialogFooter>
            <Button variant="success" type="submit">
              Confirm
            </Button>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReportButton({ reportAction }: ReportButtonProps) {
  const ellipsisDropdownContext = useEllipsisDropdownContext();

  return (
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
            This will report the entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            try {
              await reportAction(formData);
            } catch (_) {
              toast({
                title: "Something went wrong",
                type: "foreground",
              });
              return;
            }
            toast({
              title: "Report submitted",
              type: "foreground",
            });
            ellipsisDropdownContext.close();
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
            className="resize-y my-3"
            maxLength={250}
          />
          <AlertDialogFooter>
            <Button variant="success" type="submit">
              Confirm
            </Button>
            <AlertDialogCancel
              type="button"
              onClick={() => ellipsisDropdownContext.close()}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
