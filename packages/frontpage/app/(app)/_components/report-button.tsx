import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export type VoteButtonState = "voted" | "unvoted" | "authored";

type VoteButtonProps = {
  reportAction: () => Promise<void>;
};

export function ReportButton({ reportAction }: VoteButtonProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <form action={reportAction} className="contents">
      <Button variant="ghost" size="icon" name="report">
        <ExclamationTriangleIcon className={cn("w-5 h-5", "text-red-500")} />
      </Button>
    </form>
  );
}
