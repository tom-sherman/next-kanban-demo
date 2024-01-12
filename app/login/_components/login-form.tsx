"use client";
import { Button } from "@/app/_components/button";
import { Input, Label } from "@/app/_components/input";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

type LoginFormProps = {
  loginAction: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>;
};

export function LoginForm({ loginAction }: LoginFormProps) {
  const [errorMessage, action] = useFormState(loginAction, undefined);

  return (
    <form action={action} className="space-y-6">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          autoFocus
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby="password-error"
          required
        />
      </div>

      <div>
        <LoginButton />
      </div>

      <div aria-live="polite" aria-atomic="true">
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>

      <div className="text-sm text-slate-500">
        Don't have an account?{" "}
        <Link className="underline" href="/signup">
          Sign up
        </Link>
        .
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}
