import { cn } from "../utils";

type Props = {
  length: number;
  maxLength: number;
};

const formatter = new Intl.NumberFormat("en-US");

export function InputLengthIndicator({ length, maxLength }: Props) {
  return (
    <div className={cn(length > maxLength && "text-destructive")}>
      <span>{formatter.format(length)}</span>
      <span> / </span>
      <span>{formatter.format(maxLength)}</span>
    </div>
  );
}
