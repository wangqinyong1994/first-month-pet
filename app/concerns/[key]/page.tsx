import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { concernLabel } from "@/lib/domain";
import { getConcernDetail } from "@/lib/app-data";
import { concernActionFormAction } from "@/app/actions";
import { PendingButton } from "@/app/pending-button";
import { visualImage } from "@/lib/visuals";
import type { ConcernAction } from "@/lib/types";

const concernActionLabels: Record<ConcernAction, string> = {
  observe: "Observe closely",
  ask_a_vet: "Consider contacting a vet",
  seek_urgent_care: "Seek urgent care"
};

export default async function ConcernDetailPage({
  params
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const data = await getConcernDetail(key);
  if (!data) notFound();
  const selectedActionLabel = data.selectedAction ? concernActionLabels[data.selectedAction] : null;

  return (
    <main className="page">
      <h1 className="page-title">{concernLabel(key)}</h1>
      <p className="lede">
        Selected concerns are sorted by broad risk level. This page is educational and is not
        medical advice. If you think your pet may be having an emergency, contact a veterinarian
        or emergency veterinary service now.
      </p>

      <section className="concern-layout">
        <aside className="panel concern-actions">
          <h2>{selectedActionLabel ? "Change next step" : "Next step"}</h2>
          <p className="muted small">Choosing an action saves it in your plan. It does not contact a veterinarian, schedule care, or message support.</p>
          {selectedActionLabel ? <p className="notice" role="status">Saved: {selectedActionLabel}. Choose another option only if your situation changes.</p> : null}
          <form className="stack" action={concernActionFormAction}>
            <input name="pet_profile_id" type="hidden" value={data.profile.id} />
            <input name="concern_key" type="hidden" value={key} />
            <PendingButton aria-pressed={data.selectedAction === "observe"} className="secondary action-observe" disabled={data.selectedAction === "observe"} name="action" type="submit" value="observe" pendingLabel="Saving…">{data.selectedAction === "observe" ? "Saved — Observe closely" : "Observe closely"}</PendingButton>
            <PendingButton aria-pressed={data.selectedAction === "ask_a_vet"} className="secondary action-vet" disabled={data.selectedAction === "ask_a_vet"} name="action" type="submit" value="ask_a_vet" pendingLabel="Saving…">{data.selectedAction === "ask_a_vet" ? "Saved — Consider contacting a vet" : "Consider contacting a vet"}</PendingButton>
            <PendingButton aria-pressed={data.selectedAction === "seek_urgent_care"} className="button action-urgent" disabled={data.selectedAction === "seek_urgent_care"} name="action" type="submit" value="seek_urgent_care" pendingLabel="Saving…">{data.selectedAction === "seek_urgent_care" ? "Saved — Seek urgent care" : "Seek urgent care"}</PendingButton>
          </form>
        </aside>
        <div className="stack">
          <section className="panel">
            <span className="pill">Common settling-in</span>
            <p>{data.detail.common_settling_in}</p>
          </section>

          <section className="panel">
            <span className="pill">Ask a vet</span>
            <p>{data.detail.ask_a_vet}</p>
          </section>
          <section className="panel">
            <span className="pill">Seek urgent care</span>
            <p>{data.detail.seek_urgent_care}</p>
          </section>
          {data.paid ? (
            <section className="panel">
              <h2>Why this appears here</h2>
              <p>{data.detail.priority_reason}</p>
            </section>
          ) : (
            <section className="panel locked">
              <p>Keep these safety steps available. Unlock the full first-month timeline and care context.</p>
              <Link className="button" href="/paywall">
                Unlock my 30-day plan - $9.99
              </Link>
            </section>
          )}
          <Image
            className="section-image safety-image"
            src={visualImage.safety}
            alt="A pet resting in a quiet home while someone observes from nearby"
            width={1100}
            height={700}
            sizes="(max-width: 760px) 100vw, 58vw"
          />
        </div>

      </section>
    </main>
  );
}
