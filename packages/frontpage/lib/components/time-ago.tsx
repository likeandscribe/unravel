import { formatDistance, format } from "date-fns";
import {
  SimpleTooltip,
  type TooltipContentProps,
} from "@/lib/components/ui/tooltip";

export function TimeAgo({
  createdAt,
  side,
}: {
  createdAt: Date;
  side?: TooltipContentProps["side"];
}) {
  return (
    <SimpleTooltip
      content={format(createdAt, "EEEE do MMMM Y,  pp")}
      side={side}
    >
      <span>{formatDistance(createdAt, new Date())} ago</span>
    </SimpleTooltip>
  );
}
