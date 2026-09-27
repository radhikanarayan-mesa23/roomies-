import { Header } from "@/components/Header";
import { ReadinessProgress, AnimatedGrid, WaitingState } from "@/components/DashboardClient";
import { RevealBanner } from "@/components/RevealBanner";
import { StatsRow } from "@/components/StatsRow";
import { buildBoard, getParticipants } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [participants, board] = await Promise.all([getParticipants(), buildBoard()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="gradient-text font-display text-3xl font-medium tracking-tight">
              The decision board
            </h1>
            <p className="mt-1 text-sm text-muted">
              Where the WhatsApp arguments come to retire.
            </p>
          </div>
          <ReadinessProgress participants={participants} />
        </div>

        {!board.ready ? (
          <WaitingState waitingOn={board.waitingOn} />
        ) : (
          <>
            <StatsRow verdicts={board.verdicts} listingsById={board.listingsById} />
            <RevealBanner verdicts={board.verdicts} listingsById={board.listingsById} />
            <AnimatedGrid
              shortlistIds={board.shortlistIds}
              verdicts={board.verdicts}
              listingsById={board.listingsById}
            />
          </>
        )}
      </main>
    </div>
  );
}
