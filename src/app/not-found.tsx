import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-6 py-24">
      <p className="m-0 text-sm font-medium uppercase tracking-wide text-muted">
        404
      </p>
      <h1 className="m-0 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="m-0 text-muted">That route does not exist yet.</p>
      <Link href="/" className="underline underline-offset-4">
        Back home
      </Link>
    </main>
  );
}
