import Link from "next/link";
import Image from "next/image";
import { getPlanData } from "@/lib/app-data";
import { visualImage } from "@/lib/visuals";
import { TaskActionForm } from "../task-action-form";

type PlanPageProps = {
  searchParams: Promise<{ node?: string; task?: string; task_action?: string }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const [data, params] = await Promise.all([getPlanData(), searchParams]);
  const selectedNodeId = data.nodes.some((node) => node.id === params.node) ? params.node : data.defaultOpenNodeId;
  const actionNode = data.nodes.find((node) => node.id === selectedNodeId);

  return (
    <main className="page">
      <section className="plan-hero">
        <div>
          <h1 className="page-title">30-day plan</h1>
          <p className="lede">{data.paid ? `Your full timeline is available for ${data.profile.name}.` : "Day 1 is included in the free preview. Paid access unlocks the full timeline."}</p>
        </div>
        <Image
          className="section-image"
          src={visualImage.routine}
          alt="A calm home routine with pet supplies arranged for the day"
          width={1000}
          height={700}
          sizes="(max-width: 760px) 100vw, 36vw"
        />
      </section>
      <PlanSummary data={data} actionNode={actionNode} />

      <div className="plan-list">
        {data.nodes.map((node) => (
          <section className={node.locked ? "plan-node locked" : "plan-node"} id={`node-${node.id}`} key={node.id}>
            <details open={node.id === selectedNodeId}>
              <summary>
                <div className="plan-node-heading">
                  <div className="plan-statuses">
                    <span className="pill">{timeLabel(node.timeState)}</span>
                    <span className="plan-task-status">{node.locked ? "Locked" : taskLabel(node.taskProgress)}</span>
                  </div>
                  <h2>{node.title}</h2>
                  <p className="muted">{node.dateLabel}</p>
                </div>
                <span className="summary-state"><span aria-hidden="true" className="summary-marker">+</span><span className="summary-state-label">Toggle details</span></span>
              </summary>

              <div className="plan-node-body">
                {node.locked ? (
                  <div className="stack">
                    <ContentBlock title="When to seek help" body={node.when_to_seek_help} urgent />
                    <div>
                      <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
                      <Link className="button" href="/paywall">Unlock my 30-day plan - $9.99</Link>
                    </div>
                  </div>
                ) : (
                  <div className="stack">
                    {node.tasks.length ? (
                      <div className="task-list">
                        <h3>In-app reminders</h3>
                        {node.tasks.map((task) => {
                          const isDone = task.status === "done" || task.done_at !== null;
                          const taskMessage = params.task === task.id && params.task_action === "completed"
                            ? "Marked done."
                            : params.task === task.id && params.task_action === "undone"
                              ? "Task restored."
                              : null;
                          return (
                            <div className="task-row" key={task.id}>
                              <div>
                                <span className="pill">{isDone ? "Done" : task.due_date < new Date().toISOString().slice(0, 10) ? "Overdue" : "Upcoming"}</span>
                                <strong>{task.task_definitions?.title}</strong>
                                <p className="muted small">{task.task_definitions?.description}</p>
                                {taskMessage ? <p className="notice task-feedback" role="status">{taskMessage}</p> : null}
                              </div>
                              {!data.afterFirstMonth ? <TaskActionForm buttonClassName="secondary" nodeId={node.id} operation={isDone ? "undo" : "done"} returnTo="/plan" taskId={task.id} /> : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className={node.tasks.length ? "care-blocks" : "care-blocks compact"}>
                      <ContentBlock title="Common settling-in signs" body={node.common_signs} />
                      <ContentBlock title="What to do" body={node.what_to_do} />
                      <ContentBlock title="When to seek help" body={node.when_to_seek_help} urgent />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </section>
        ))}
      </div>
    </main>
  );
}

function PlanSummary({ data, actionNode }: { data: Awaited<ReturnType<typeof getPlanData>>; actionNode: Awaited<ReturnType<typeof getPlanData>>["nodes"][number] | undefined }) {
  if (data.afterFirstMonth && data.progress.outstanding === 0) {
    return <section className="plan-summary panel"><span className="pill">First month complete</span><h2>All in-app tasks are complete.</h2><p className="muted">This timeline is read-only now. Review it whenever it is useful.</p></section>;
  }

  if (data.afterFirstMonth) {
    return <section className="plan-summary panel"><span className="pill">First-month period ended</span><h2>{data.progress.outstanding} task{data.progress.outstanding === 1 ? " remains" : "s remain"}.</h2><p className="muted">The remaining first-month tasks are shown as history and are read-only.</p>{actionNode ? <Link className="secondary" href={`/plan?node=${actionNode.id}#node-${actionNode.id}`}>Review remaining history</Link> : null}</section>;
  }

  return <section className="plan-summary panel"><span className="pill">First month in progress</span><h2>{data.currentStage ?? "Your first-month plan"}</h2><p className="muted">{data.progress.completed} completed · {data.progress.outstanding} to do</p></section>;
}

function ContentBlock({ title, body, urgent = false }: { title: string; body: string; urgent?: boolean }) {
  return <div className={urgent ? "care-block care-help" : "care-block"}><h3>{title}</h3><p>{body}</p></div>;
}

function timeLabel(timeState: "today" | "upcoming" | "ended") {
  return timeState === "today" ? "Today" : timeState === "upcoming" ? "Upcoming" : "Ended";
}

function taskLabel(progress: { total: number; completed: number; overdue: number }) {
  if (progress.total === 0) return "No tasks";
  if (progress.overdue > 0) return `${progress.overdue} task${progress.overdue === 1 ? " overdue" : "s overdue"}`;
  return `${progress.completed}/${progress.total} tasks done`;
}
