"use client";

import { startTransition, useActionState } from "react";
import { loginAction } from "./action";
import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { CrossCircledIcon } from "@radix-ui/react-icons";

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const error = state?.error ?? searchParams.get("error");

  return (
    <>
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
        </div>
      </form>
      {error ? (
        <Alert variant="destructive">
          <CrossCircledIcon className="h-4 w-4" />
          <AlertTitle>Login error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
