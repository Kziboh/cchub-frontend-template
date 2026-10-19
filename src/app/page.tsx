const included = [
  {
    title: "App Router",
    body: "File-based routing, shared layouts, and Server Components by default.",
  },
  {
    title: "Tailwind CSS v4",
    body: "Design tokens live in globals.css as CSS variables, mapped into the Tailwind theme.",
  },
  {
    title: "Deploy ready",
    body: "Docker, Compose, and GitLab CI are already wired for a typical VPS deploy.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6">
      <section className="flex flex-col gap-6 py-16 md:py-24">
        <p className="m-0 text-sm font-medium uppercase tracking-wide text-muted">
          Frontend template
        </p>
        <h1 className="m-0 text-4xl font-semibold tracking-tight md:text-5xl">
          Start here. Ship anything.
        </h1>
        <p className="m-0 max-w-xl text-base leading-relaxed text-muted">
          Replace <code className="font-mono text-sm">src/app/page.tsx</code>{" "}
          with your product, and update the site name and description in{" "}
          <code className="font-mono text-sm">src/app/layout.tsx</code>.
        </p>
      </section>

      <section className="grid gap-6 pb-24 md:grid-cols-3">
        {included.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-border p-6"
          >
            <h2 className="text-lg font-semibold tracking-tight">
              {item.title}
            </h2>
            <p className="mt-2 m-0 text-sm leading-relaxed text-muted">
              {item.body}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
