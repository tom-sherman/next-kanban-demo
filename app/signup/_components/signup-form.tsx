"use client";
import { Input, Label } from "@/app/_components/input";
import Link from "next/link";
import { Button } from "@/app/_components/button";
import { useFormState } from "react-dom";

export type FormState = {
  emailError?: string;
  passwordError?: string;
};

type SignupFormProps = {
  signupAction: (
    prevState: FormState | undefined,
    formData: FormData
  ) => Promise<FormState | undefined>;
};

export function SignupForm({ signupAction }: SignupFormProps) {
  const [errors, action] = useFormState(signupAction, undefined);
  return (
    <form className="space-y-6" action={action}>
      <div>
        <Label htmlFor="email">
          Email address{" "}
          {errors?.emailError && (
            <span id="email-error" className="text-brand-red">
              {errors.emailError}
            </span>
          )}
        </Label>
        <Input
          autoFocus
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-describedby={
            errors?.emailError ? "email-error" : "signup-header"
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="password">
          Password{" "}
          {errors?.passwordError && (
            <span id="password-error" className="text-brand-red">
              {errors.passwordError}
            </span>
          )}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby="password-error"
          required
        />
      </div>

      <Button type="submit">Sign up</Button>

      <div className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
        .
      </div>
    </form>
  );
}
