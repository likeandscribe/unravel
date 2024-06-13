"use client";

import { useActionState, useId } from "react";
import { newPostAction } from "./_action";
import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";

export function NewPostForm() {
  const [state, action] = useActionState(newPostAction, null);
  const id = useId();

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input name="title" id={`${id}-title`} />
      </div>
      <div>
        <Label htmlFor={`${id}-url`}>URL</Label>
        <Input name="url" id={`${id}-url`} type="url" />
      </div>
      <Button type="submit">Submit</Button>
      {state?.error && (
        <Alert>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
