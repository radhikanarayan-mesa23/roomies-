import Link from "next/link";

export function Header() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Roomiess
        </Link>
        <nav>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-foreground/90 transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
