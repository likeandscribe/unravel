"use client";

import { startTransition, useActionState } from "react";
import { loginAction } from "./action";
import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
// import { Alert } from "@/lib/components/ui/alert";

export function LoginForm() {
  const [_, action, isPending] = useActionState(loginAction, null);

  return (
    <form
      className="space-y-6"
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          action(new FormData(event.currentTarget));
        });
      }}
    >
      <div>
        <Label htmlFor="handle">Handle</Label>
        <Input id="handle" name="handle" required placeholder="example.com" />
      </div>
      <div>
        <Button type="submit" className="w-full" disabled={isPending}>
          Sign in
        </Button>
        {/* {state?.error ? (
          <Alert variant="destructive">{state.error}</Alert>
        ) : null} */}
      </div>
    </form>
  );
}
