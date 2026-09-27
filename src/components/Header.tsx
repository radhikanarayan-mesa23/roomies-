import Link from "next/link";

export function Header() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-medium tracking-tight">
          Roomiess
        </Link>
        <nav>
          <Link
            href="/dashboard"
            className="rounded-full border border-border bg-white/40 px-4 py-1.5 text-sm text-foreground/90 transition-colors hover:border-pastel-blue hover:bg-pastel-blue/30"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
