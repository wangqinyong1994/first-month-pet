import { redirect } from "next/navigation";
import { getUserOrRedirect, paidAccess, requireProfile } from "@/lib/app-data";
import { createCheckoutSessionAction } from "../actions";

export default async function PaywallPage() {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  if (await paidAccess(user.id, profile.id)) redirect("/home");

  return (
    <main className="page">
      <section className="hero">
        <h1>Unlock {profile.name}&apos;s full 30-day plan</h1>
        <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Included</h2>
          <ul>
            <li>Full 30-day onboarding timeline.</li>
            <li>Personalized care steps for this pet profile.</li>
            <li>In-app upcoming and overdue reminders.</li>
            <li>Full concern detail pages with source notes.</li>
            <li>Full Milestones progression.</li>
            <li>One-time $9.99 purchase for one pet profile.</li>
            <li>7-day refund policy.</li>
          </ul>
          <form action={createCheckoutSessionAction}>
            <button className="button" type="submit">
              Unlock my 30-day plan - $9.99
            </button>
          </form>
        </div>

        <aside className="panel">
          <h2>Free preview</h2>
          <p>Day 1 content, basic selected-concern guidance, and future timeline titles stay available.</p>
          <p className="muted small">
            Payment is processed by Creem. Browser redirects do not unlock the plan by
            themselves.
          </p>
        </aside>
      </section>
    </main>
  );
}
