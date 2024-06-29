"use client";

import { useActionState, useId, useState } from "react";
import { newPostAction } from "./_action";
import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { Spinner } from "@/lib/components/ui/spinner";
import {
  MAX_POST_TITLE_LENGTH,
  MAX_POST_URL_LENGTH,
} from "@/lib/data/db/constants";
import { InputLengthIndicator } from "@/lib/components/input-length-indicator";

export function NewPostForm() {
  const [state, action, isPending] = useActionState(newPostAction, null);
  const id = useId();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  return (
    <form
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        action(new FormData(e.currentTarget));
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input
          name="title"
          id={`${id}-title`}
          value={title}
          onChange={(e) => {
            setTitle(e.currentTarget.value);
          }}
        />
        <InputLengthIndicator
          length={title.length}
          maxLength={MAX_POST_TITLE_LENGTH}
        />
      </div>
      <div>
        <Label htmlFor={`${id}-url`}>URL</Label>
        <Input
          name="url"
          id={`${id}-url`}
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.currentTarget.value);
          }}
        />
        <InputLengthIndicator
          length={url.length}
          maxLength={MAX_POST_URL_LENGTH}
        />
      </div>
      <Button
        type="submit"
        disabled={
          isPending ||
          title.length > MAX_POST_TITLE_LENGTH ||
          url.length > MAX_POST_URL_LENGTH
        }
      >
        {isPending ? <Spinner className="mr-2" /> : null} Submit
      </Button>
      {state?.error ? (
        <Alert>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
