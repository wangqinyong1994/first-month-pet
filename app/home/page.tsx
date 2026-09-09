import Link from "next/link";
import Image from "next/image";
import { concernLabel } from "@/lib/domain";
import { getHomeData } from "@/lib/app-data";
import { milestoneImagePath } from "@/lib/milestones";
import { petVisualImage } from "@/lib/visuals";
import { submitCheckInAction } from "../actions";
import { PendingButton } from "../pending-button";
import { TaskActionForm } from "../task-action-form";

export default async function HomePage() {
  const data = await getHomeData();
  const [priorityConcern, ...otherConcerns] = data.concerns;

  return (
    <main className="page">
      <section className="hero home-hero">
        <div>
          <span className="pill">{data.afterFirstMonth ? "First-month period ended" : `Day ${data.currentDay}`}</span>
          <h1>{data.afterFirstMonth ? `${data.profile.name}'s first-month period has ended` : `${data.profile.name}'s plan for today`}</h1>
          <p>
            {data.afterFirstMonth
              ? "Keep routine care and veterinary follow-up in view over the next three months."
              : "Start with today’s care step, then review the concern that needs the most attention."}
          </p>
        </div>
        <Image
          className="section-image"
          src={petVisualImage(data.profile.pet_type)}
          alt={`Illustrative scene of a ${data.profile.pet_type} resting in a calm home`}
          width={1000}
          height={700}
          sizes="(max-width: 760px) 100vw, 36vw"
        />
      </section>

      <section className="home-grid">
        <section className="panel home-action">
            <h2>{data.afterFirstMonth ? "Outstanding first-month action" : "Today’s most important action"}</h2>
            {data.nextTask ? (
              <div className="stack">
                <span className="pill">{data.nextTaskState}</span>
                <h3>{data.nextTask.task_definitions?.title}</h3>
                <p className="muted">{data.nextTask.task_definitions?.description}</p>
                {!data.afterFirstMonth && data.nextTaskState !== "done" ? (
                <TaskActionForm buttonClassName="button" operation="done" returnTo="/home" taskId={data.nextTask.id} />
                ) : null}
              </div>
            ) : (
              <p className="muted">
                {data.afterFirstMonth ? "No first-month tasks are still open." : "No in-app task is due today."}
              </p>
            )}
        </section>

        <section className="panel home-concerns">
          <h2>Concern priority</h2>
          {priorityConcern ? (
            <>
              <article className="featured-concern">
                <span className="pill">Start here</span>
                <h3>{concernLabel(priorityConcern.key)}</h3>
                <p>{priorityConcern.guidance?.common_settling_in}</p>
                <Link className="secondary" href={`/concerns/${priorityConcern.key}`}>
                  Read guidance
                </Link>
              </article>
              {otherConcerns.length ? (
                <div className="concern-list">
                  {otherConcerns.map(({ key }) => (
                    <Link href={`/concerns/${key}`} key={key}>
                      {concernLabel(key)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <p className="muted">No current concern is selected.</p>
              <Link className="secondary" href="/profile">
                Update concerns
              </Link>
            </div>
          )}
        </section>

        {data.afterFirstMonth ? (
          <FirstMonthHandoff concernCount={data.concerns.length} hasOutstandingTasks={data.hasOutstandingTasks} />
        ) : (
          <section className={data.currentNode?.locked ? "panel home-plan locked" : "panel home-plan"}>
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
        )}

        {!data.afterFirstMonth ? <section className="panel home-checkin">
            <h2>Today&apos;s check-in</h2>
            <p className="muted">How does {data.profile.name} seem today?</p>
            <form className="stack" action={submitCheckInAction}>
              <input name="pet_profile_id" type="hidden" value={data.profile.id} />
              <PendingButton className="secondary" name="status" type="submit" value="better" pendingLabel="Saving…">Better</PendingButton>
              <PendingButton className="secondary" name="status" type="submit" value="same" pendingLabel="Saving…">About the same</PendingButton>
              <PendingButton className="secondary" name="status" type="submit" value="worse" pendingLabel="Saving…">Worse</PendingButton>
            </form>
            {data.todayCheckIn ? <p className="muted small">Saved: {data.todayCheckIn.status}</p> : null}
            {data.todayCheckIn?.status === "worse" ? (
              <Link className="secondary" href={data.concerns[0] ? `/concerns/${data.concerns[0].key}` : "/profile"}>
                Review the next safest step
              </Link>
            ) : null}
        </section> : null}

        <section className="panel home-milestone">
          <h2>Recent Milestone</h2>
          {data.recentMilestoneDefinition ? (
            <div className="recent-milestone">
              <Image
                className="milestone-image"
                src={milestoneImagePath(data.recentMilestoneDefinition.id)}
                alt=""
                width={96}
                height={96}
              />
              <div>
                <h3>{data.recentMilestoneDefinition.title}</h3>
                <p>{data.recentMilestoneDefinition.value_copy}</p>
              </div>
            </div>
          ) : (
            <p className="muted">Milestones appear as you complete first-month steps.</p>
          )}
          <Link className="secondary" href="/plan">
            Open full plan
          </Link>
        </section>
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

function FirstMonthHandoff({ concernCount, hasOutstandingTasks }: { concernCount: number; hasOutstandingTasks: boolean }) {
  return (
    <section className="panel">
      <h2>First-month handoff</h2>
      <p>
        {hasOutstandingTasks
          ? "The first-month period has ended, but some in-app tasks are still open. Review those first, then keep routine care and veterinary follow-up in view."
          : "The first-month period has ended. Keep routine care and veterinary follow-up in view over the next three months."}
      </p>
      {concernCount ? <p className="muted">Your active concerns remain available above.</p> : null}
    </section>
  );
}
