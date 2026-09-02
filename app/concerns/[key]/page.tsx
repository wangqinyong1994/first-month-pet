import Link from "next/link";
import { notFound } from "next/navigation";
import { concernLabel } from "@/lib/domain";
import { getConcernDetail } from "@/lib/app-data";
import { concernActionFormAction } from "@/app/actions";

export default async function ConcernDetailPage({
  params
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const data = await getConcernDetail(key);
  if (!data) notFound();

  return (
    <main className="page">
      <h1 className="page-title">{concernLabel(key)}</h1>
      <p className="lede">
        Selected concerns are sorted by broad risk level. This page is educational and is not
        medical advice.
      </p>

      <section className="grid">
        <div className="stack">
          <section className="panel">
            <span className="pill">Common settling-in</span>
            <p>{data.detail.common_settling_in}</p>
          </section>

          {data.paid ? (
            <>
              <section className="panel">
                <span className="pill">Ask a vet</span>
                <p>{data.detail.ask_a_vet}</p>
              </section>
              <section className="panel">
                <span className="pill">Seek urgent care</span>
                <p>{data.detail.seek_urgent_care}</p>
              </section>
              <section className="panel">
                <h2>Why this appears here</h2>
                <p>{data.detail.priority_reason}</p>
                {data.detail.source_notes ? <p className="muted small">{data.detail.source_notes}</p> : null}
              </section>
            </>
          ) : (
            <section className="panel locked">
              <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
              <Link className="button" href="/paywall">
                Unlock my 30-day plan - $9.99
              </Link>
            </section>
          )}
        </div>

        <aside className="panel">
          <h2>Next step</h2>
          <form className="stack" action={concernActionFormAction}>
            <input name="pet_profile_id" type="hidden" value={data.profile.id} />
            <input name="concern_key" type="hidden" value={key} />
            <button className="secondary" name="action" type="submit" value="observe">
              Observe closely
            </button>
            <button className="secondary" name="action" type="submit" value="ask_a_vet">
              Consider contacting a vet
            </button>
            <button className="secondary" name="action" type="submit" value="seek_urgent_care">
              Seek urgent care
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
