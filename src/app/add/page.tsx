import { Header } from "@/components/Header";
import { getParticipantsForAdd } from "./actions";
import { AddClient } from "./AddClient";

export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const authorized = !!process.env.ADD_KEY && key === process.env.ADD_KEY;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {!authorized ? (
          <div className="glass-card p-8 text-center">
            <h1 className="font-display text-xl font-medium">Not authorized</h1>
            <p className="mt-2 text-sm text-muted">
              This page needs a valid <code className="text-accent">?key=</code> in the URL.
            </p>
          </div>
        ) : (
          <AddClient participants={await getParticipantsForAdd()} />
        )}
      </main>
    </div>
  );
}
