"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  style,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const status = useFormStatus();
  return (
    <button
      style={{ ...style, display: "flex" }}
      type="submit"
      disabled={disabled || status.pending}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
