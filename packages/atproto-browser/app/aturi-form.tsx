"use client";
import Form from "next/form";
import { SubmitButton } from "./submit-button";

export function AtUriForm({
  defaultUri,
  style,
}: {
  defaultUri?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Form action="/at" style={{ ...style, display: "flex" }}>
      <input
        style={{ flexGrow: 1 }}
        type="text"
        name="u"
        key={defaultUri}
        defaultValue={defaultUri}
      />
      <SubmitButton>Go</SubmitButton>
    </Form>
  );
}
