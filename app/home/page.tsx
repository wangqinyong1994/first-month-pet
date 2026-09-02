import Link from "next/link";
import { concernLabel } from "@/lib/domain";
import { getHomeData } from "@/lib/app-data";
import { markTaskDoneAction } from "../actions";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <main className="page">
      <section className="hero">
        <span className="pill">Day {data.currentDay}</span>
        <h1>{data.profile.name}&apos;s first-month plan</h1>
        <p>
          Start with the highest-signal concern, then today&apos;s care step. This guidance is
          educational and is not medical advice.
        </p>
      </section>

      <section className="grid">
        <div className="stack">
          <section className="panel">
            <h2>Concern priority</h2>
            {data.concerns.length ? (
              <div className="stack">
                {data.concerns.map(({ key, guidance }) => (
                  <article className="card" key={key}>
                    <span className="pill">Common settling-in</span>
                    <h3>{concernLabel(key)}</h3>
                    <p>{guidance?.common_settling_in}</p>
                    <Link className="secondary" href={`/concerns/${key}`}>
                      View guidance
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div>
                <p className="muted">No current concern is selected.</p>
                <Link className="secondary" href="/profile">
                  Something feels off?
                </Link>
              </div>
            )}
          </section>

          <section className={data.currentNode?.locked ? "panel locked" : "panel"}>
            <h2>{data.currentNode?.title ?? "Today"}</h2>
            <span className="pill">{data.currentNodeDate}</span>
            {data.currentNode?.locked ? (
              <LockedPlanCopy />
            ) : (
              <div className="stack">
                <ContentBlock title="Common settling-in signs" body={data.currentNode?.common_signs} />
                <ContentBlock title="What to do today" body={data.currentNode?.what_to_do} />
                <ContentBlock title="When to seek help" body={data.currentNode?.when_to_seek_help} />
              </div>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <h2>Today&apos;s most important action</h2>
            {data.nextTask ? (
              <div className="stack">
                <span className="pill">{data.nextTaskState}</span>
                <h3>{data.nextTask.task_definitions?.title}</h3>
                <p className="muted">{data.nextTask.task_definitions?.description}</p>
                {data.nextTaskState !== "done" ? (
                  <form action={markTaskDoneAction}>
                    <input name="task_id" type="hidden" value={data.nextTask.id} />
                    <button className="button" type="submit">
                      Mark done
                    </button>
                  </form>
                ) : null}
              </div>
            ) : (
              <p className="muted">No in-app task is due today.</p>
            )}
          </section>

          <section className="panel">
            <h2>Recent Milestone</h2>
            {data.recentMilestoneDefinition ? (
              <div>
                <h3>{data.recentMilestoneDefinition.title}</h3>
                <p>{data.recentMilestoneDefinition.value_copy}</p>
              </div>
            ) : (
              <p className="muted">Milestones appear as you complete first-month steps.</p>
            )}
          </section>

          <Link className="button" href="/plan">
            Open full plan
          </Link>
        </aside>
      </section>
    </main>
  );
}

function ContentBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function LockedPlanCopy() {
  return (
    <div>
      <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
      <Link className="button" href="/paywall">
        Unlock my 30-day plan - $9.99
      </Link>
    </div>
  );
}
