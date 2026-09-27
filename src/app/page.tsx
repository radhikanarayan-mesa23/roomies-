import Link from "next/link";
import { Header } from "@/components/Header";

const STEPS = [
  {
    title: "Set your dealbreakers once",
    body: "Each of you fills a private form with max rent, no-go areas, floor limits, and what matters to you. Fill it once — edit anytime.",
  },
  {
    title: "Share a listing",
    body: "Paste it to the Telegram bot or the /add page. Gemini turns the text into structured facts — nothing is ever guessed.",
  },
  {
    title: "Get the real verdict",
    body: "Code checks it against everyone instantly: what works, what's a dealbreaker with the exact gap, and what you'd give up. Never an auto-picked winner.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-20 text-center sm:py-28">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Roomiess — decide together,
          <br className="hidden sm:block" /> not one objection at a time
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">
          Four months of flat-hunting died in WhatsApp threads. Roomiess checks every
          listing against everyone&rsquo;s dealbreakers up front — with the exact numbers —
          so you decide, not a chat scroll.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]"
        >
          View dashboard
        </Link>

        <div className="mt-24 grid w-full gap-4 text-left sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </div>
              <h2 className="mb-1.5 text-sm font-semibold">{step.title}</h2>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Straight-line distances only. Nothing here picks a winner for you.
      </footer>
    </div>
  );
}
