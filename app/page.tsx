import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getPublicLandingData } from "@/lib/app-data";
import { visualImage } from "@/lib/visuals";

export default async function IndexPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getProfile(user.id);
    redirect(profile ? "/home" : "/onboarding");
  }

  const { dayOne, tasks, lockedNodes } = await getPublicLandingData();

  return (
    <main className="page public-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="pill">For new cat and dog adopters</p>
          <h1 id="landing-title">Know what to do today. Feel steadier tomorrow.</h1>
          <p>
            Start with practical Day 1 care, a calmer home setup, and clear signs that mean it is time
            to seek urgent help.
          </p>
          <Link className="button" href="/login">
            Create my free Day 1 plan
          </Link>
        </div>
        <Image
          className="landing-hero-image"
          src={visualImage.hero}
          alt="A new pet parent sitting quietly with a cat and dog at home"
          width={1200}
          height={900}
          priority
          sizes="(max-width: 760px) 100vw, 48vw"
        />
      </section>

      <section className="landing-preview" aria-labelledby="day-one-title">
        <div className="landing-section-heading">
          <p className="pill">Free Day 1 preview</p>
          <h2 id="day-one-title">{dayOne.title}</h2>
        </div>
        <Image
          className="section-image day-one-image"
          src={visualImage.dayOne}
          alt="A quiet pet space with water, food, bedding, and an open exit"
          width={1200}
          height={760}
          sizes="(max-width: 760px) 100vw, 60vw"
        />
        <div className="care-blocks">
          <section className="care-block">
            <h3>What you may notice</h3>
            <p>{dayOne.common_signs}</p>
          </section>
          <section className="care-block">
            <h3>What to do now</h3>
            <p>{dayOne.what_to_do}</p>
          </section>
          <section className="care-block care-help">
            <h3>Get urgent help now if</h3>
            <p>{dayOne.when_to_seek_help}</p>
          </section>
        </div>

        <section className="landing-tasks" aria-labelledby="day-one-tasks-title">
          <h3 id="day-one-tasks-title">Two free Day 1 tasks</h3>
          <ol>
            {tasks.map((task) => (
              <li key={task.title}>
                <strong>{task.title}</strong>
                {task.description ? <span>{task.description}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section className="landing-timeline" aria-labelledby="timeline-title">
        <div className="landing-section-heading">
          <p className="pill">Your first month</p>
          <h2 id="timeline-title">The next steps are ready when you are.</h2>
        </div>
        <ol>
          {lockedNodes.map((node) => (
            <li key={node.id}>
              <span>{dayLabel(node.day_start, node.day_end)}</span>
              <strong>{node.title}</strong>
              <em>Locked</em>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-offer" aria-labelledby="offer-title">
        <div>
          <p className="pill">One-time purchase</p>
          <h2 id="offer-title">Free Day 1, then $9.99 for the full first month.</h2>
          <p>
            Your free plan includes Day 1 care and safety guidance. The full plan adds the remaining
            30-day timeline, profile-matched tasks, concerns, and milestones.
          </p>
        </div>
        <div className="landing-offer-action">
          <Link className="button" href="/login">
            Create my free Day 1 plan
          </Link>
          <p className="muted small">
            First Month Pet offers general support, not diagnosis, treatment, or veterinary advice.
          </p>
        </div>
      </section>
    </main>
  );
}

function dayLabel(dayStart: number, dayEnd: number) {
  return dayStart === dayEnd ? `Day ${dayStart}` : `Days ${dayStart}–${dayEnd}`;
}
