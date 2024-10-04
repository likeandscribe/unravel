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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { ReportReasons } from "@/lib/data/db/report-shared";
import { ReactNode, useState } from "react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useEllipsisDropdownContext } from "./ellipsis-dropdown";
import { DropdownMenuItem } from "@/lib/components/ui/dropdown-menu";

type ReportDialogProps = {
  reportAction: (formData: FormData) => Promise<void>;
  children: ReactNode;
};

function ReportDialog({ reportAction, children }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
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
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Please select one" />
            </SelectTrigger>
            <SelectContent>
              {ReportReasons.map((reason) => (
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

export function ReportDialogIcon({
  reportAction,
}: Pick<ReportDialogProps, "reportAction">) {
  return (
    <ReportDialog reportAction={reportAction}>
      <Button size="icon" variant="outline">
        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      </Button>
    </ReportDialog>
  );
}

export function ReportDialogDropdownButton({
  reportAction,
}: Pick<ReportDialogProps, "reportAction">) {
  const ellipsisDropdownContext = useEllipsisDropdownContext();
  return (
    <ReportDialog
      reportAction={async (formData: FormData) => {
        await reportAction(formData);
        ellipsisDropdownContext.close();
      }}
    >
      <DropdownMenuItem
        //this prevents the alert dialog from closing when the dropdown item is clicked
        //alternatively wrap the whole dropdown in the dialog as per https://github.com/radix-ui/primitives/issues/1836
        //but that defeats the purpose of this reusable component
        onSelect={(e) => {
          e.preventDefault();
        }}
      >
        <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
        Report
      </DropdownMenuItem>
    </ReportDialog>
  );
}
