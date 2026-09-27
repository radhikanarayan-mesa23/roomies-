import Link from "next/link";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/Avatar";
import { getParticipants } from "@/lib/data";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    title: "Pick your name below",
    body: "Fill your private dealbreakers form once — max rent, no-go areas, floor limits, and what matters to you. Edit anytime.",
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

export const dynamic = "force-dynamic";

export default async function Home() {
  const participants = await getParticipants();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-white/40 px-3 py-1 text-xs font-medium text-muted">
          🏠 four months of scrolling, zero flats found
        </span>
        <h1 className="gradient-text font-display text-balance text-5xl font-medium tracking-tight sm:text-6xl">
          decide together,
          <br className="hidden sm:block" /> not one objection at a time
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">
          Four months of flat-hunting died in WhatsApp threads. Roomiess checks every
          listing against everyone&rsquo;s dealbreakers up front — with the exact numbers —
          so you decide, not a chat scroll.
        </p>

        <div className="mt-10 w-full max-w-md">
          <p className="mb-3 text-sm font-medium text-muted">👋 Who&rsquo;s this?</p>
          <div className="space-y-2">
            {participants.map((p) => (
              <Link
                key={p.id}
                href={`/form/${p.form_token}`}
                className="glass-card group flex items-center justify-between px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-3">
                  <Avatar name={p.name} size={32} />
                  <span className="font-medium">{p.name}</span>
                  {p.form_submitted_at && (
                    <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-xs text-emerald">
                      ✓ submitted
                    </span>
                  )}
                </span>
                <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>

        <Link href="/dashboard" className="btn-secondary mt-6 text-sm">
          Or jump straight to the dashboard →
        </Link>

        <div className="mt-20 grid w-full gap-4 text-left sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="glass-card p-6"
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
