import { Header } from "@/components/Header";
import { AvatarChips, AnimatedGrid, WaitingState } from "@/components/DashboardClient";
import { buildBoard, getParticipants } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [participants, board] = await Promise.all([getParticipants(), buildBoard()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <AvatarChips participants={participants} />
        </div>

        {!board.ready ? (
          <WaitingState waitingOn={board.waitingOn} />
        ) : (
          <AnimatedGrid
            shortlistIds={board.shortlistIds}
            verdicts={board.verdicts}
            listingsById={board.listingsById}
          />
        )}
      </main>
    </div>
  );
}
