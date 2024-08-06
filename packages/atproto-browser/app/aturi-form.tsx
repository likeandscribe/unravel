"use client";
import { useActionState } from "react";
import { navigateUri } from "./actions";

export function AtUriForm({
  defaultUri,
  style,
}: {
  defaultUri?: string;
  style?: React.CSSProperties;
}) {
  const [_state, action, isPending] = useActionState(navigateUri, undefined);
  return (
    <form action={action} style={{ ...style, display: "flex" }}>
      <input
        style={{ flexGrow: 1 }}
        type="text"
        name="uri"
        key={defaultUri}
        defaultValue={defaultUri}
      />
      <button type="submit" disabled={isPending}>
        Go
      </button>
    </form>
  );
}
