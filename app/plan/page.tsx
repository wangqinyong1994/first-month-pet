import Link from "next/link";
import { taskUiState } from "@/lib/domain";
import { getPlanData } from "@/lib/app-data";
import { markTaskDoneAction } from "../actions";

export default async function PlanPage() {
  const data = await getPlanData();

  return (
    <main className="page">
      <h1 className="page-title">30-day plan</h1>
      <p className="lede">
        Day 1 is included in the free preview. Paid access unlocks the full timeline for{" "}
        {data.profile.name}.
      </p>

      <div className="stack">
        {data.nodes.map((node) => (
          <section className={node.locked ? "panel locked" : "panel"} key={node.id}>
            <div className="task-row">
              <div>
                <span className="pill">{node.status}</span>
                <h2>{node.title}</h2>
                <p className="muted">{node.dateLabel}</p>
              </div>
              {node.locked ? (
                <Link className="button" href="/paywall">
                  Unlock my 30-day plan - $9.99
                </Link>
              ) : null}
            </div>

            {node.locked ? (
              <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
            ) : (
              <div className="stack">
                <ContentBlock title="Common settling-in signs" body={node.common_signs} />
                <ContentBlock title="What to do today" body={node.what_to_do} />
                <ContentBlock title="When to seek help" body={node.when_to_seek_help} />
                {node.tasks.length ? (
                  <div className="stack">
                    <h3>In-app reminders</h3>
                    {node.tasks.map((task) => (
                      <div className="task-row" key={task.id}>
                        <div>
                          <span className="pill">{taskUiState(task)}</span>
                          <strong>{task.task_definitions?.title}</strong>
                          <p className="muted small">{task.task_definitions?.description}</p>
                        </div>
                        {taskUiState(task) !== "done" ? (
                          <form action={markTaskDoneAction}>
                            <input name="task_id" type="hidden" value={task.id} />
                            <button className="secondary" type="submit">
                              Mark done
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function ContentBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
