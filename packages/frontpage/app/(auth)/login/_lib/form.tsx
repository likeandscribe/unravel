"use client";

import { useActionState } from "react";
import { loginAction } from "./action";
import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { Alert } from "@/lib/components/ui/alert";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);

  return (
    <form
      className="space-y-6"
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        action(new FormData(event.currentTarget));
      }}
    >
      <div>
        <Label htmlFor="identifier">Handle</Label>
        <Input
          id="identifier"
          name="identifier"
          required
          placeholder="@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password"
        />
      </div>
      <div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        {state?.error ? (
          <Alert variant="destructive">{state.error}</Alert>
        ) : null}
      </div>
    </form>
  );
}
