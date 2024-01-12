import { redirect } from "next/navigation";
import { auth, isLoggedIn, signIn, updateSession } from "../_lib/auth";
import { SignupForm, FormState } from "./_components/signup-form";
import { accountExists, createAccount } from "../_lib/db";

export default async function Signup() {
  if (await isLoggedIn()) redirect("/home");

  return (
    <div className="flex min-h-full flex-1 flex-col mt-20 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
          id="signup-header"
        >
          Sign up
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <SignupForm signupAction={signupAction} />
        </div>
        <div className="mt-8 space-y-2 mx-2">
          <h3 className="font-bold text-black">Privacy Notice</h3>
          <p>
            We won't use your email address for anything other than
            authenticating with this demo application. This app doesn't send
            email anyway, so you can put whatever fake email address you want.
          </p>
          <h3 className="font-bold text-black">Terms of Service</h3>
          <p>
            This is a demo app, there are no terms of service. Don't be
            surprised if your data dissappears.
          </p>
        </div>
      </div>
    </div>
  );
}

async function signupAction(
  _prevState: FormState | undefined,
  formData: FormData
) {
  "use server";
  const result = await validate(formData);
  if (!result.valid) return result;

  const { email, password } = result;
  await createAccount(email, password);

  const signInFormData = new FormData();
  signInFormData.set("email", email);
  signInFormData.set("password", password);
  await signIn("credentials", signInFormData);

  redirect("/home");
}

type ValidationResult =
  | { valid: true; email: string; password: string }
  | { valid: false; emailError?: string; passwordError?: string };

async function validate(formData: FormData): Promise<ValidationResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const errorResult: ValidationResult = { valid: false };

  if (!email) {
    errorResult.emailError = "Email is required.";
  } else if (await accountExists(email)) {
    errorResult.emailError = "An account with this email already exists";
  }

  if (!password) {
    errorResult.passwordError = "Password is required.";
  } else if (password.length < 6) {
    errorResult.passwordError = "Password must be at least 6 characters.";
  }

  if ("emailError" in errorResult || "passwordError" in errorResult)
    return errorResult;

  return {
    valid: true as const,
    email,
    password,
  };
}
