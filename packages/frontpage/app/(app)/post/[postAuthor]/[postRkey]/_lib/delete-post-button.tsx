"use client";

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
import { Button } from "@/lib/components/ui/button";
import { useToast } from "@/lib/components/ui/use-toast";
import { TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { deletePostAction } from "./actions";

export function DeletePostButton({ rkey }: { rkey: string }) {
  const { toast } = useToast();
  const router = useRouter();

  return (
    <form>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex flex-row gap-2">
            <TrashIcon />
            Delete post
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  void deletePostAction(rkey);
                  toast({
                    title: "Your post will be deleted shortly.",
                    description: "This usually takes a few seconds",
                  });
                  router.push("/");
                }}
              >
                Delete post
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
