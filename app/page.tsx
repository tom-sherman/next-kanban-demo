import Link from "next/link";

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center pt-20 bg-slate-900">
      <div className="space-y-4 max-w-md text-lg text-slate-300">
        <p>
          This demo app is a clone of{" "}
          <a
            href="https://github.com/remix-run/example-trellix"
            className="underline"
            rel="noopener nofollow"
          >
            github.com/remix-run/example-trellix
          </a>{" "}
          built with Next.js.
        </p>
        <p>
          It's a recreation of the popular drag and drop interface in{" "}
          <a href="https://trello.com" className="underline">
            Trello
          </a>{" "}
          and other similar apps.
        </p>
        <p>If you want to play around, click sign up!</p>
      </div>
      <div className="flex w-full justify-evenly max-w-md mt-8 rounded-3xl p-10 bg-slate-800">
        <Link
          href="/signup"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Sign up
        </Link>
        <div className="h-full border-r border-slate-500" />
        <Link
          href="/login"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
