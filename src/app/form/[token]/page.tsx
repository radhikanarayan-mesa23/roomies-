import { Header } from "@/components/Header";
import { getExistingPreferences } from "./actions";
import { FormClient } from "./FormClient";

export default async function FormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getExistingPreferences(token);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {!result ? (
          <div className="glass-card p-8 text-center">
            <h1 className="text-lg font-semibold">Link not recognized</h1>
            <p className="mt-2 text-sm text-muted">
              Double-check the link your flatmate sent you, or ask them to resend it.
            </p>
          </div>
        ) : (
          <FormClient
            token={token}
            name={result.participant.name}
            alreadySubmitted={!!result.participant.form_submitted_at}
            existingPrefs={result.prefs}
          />
        )}
      </main>
    </div>
  );
}
