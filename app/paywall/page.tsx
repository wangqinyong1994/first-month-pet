import { redirect } from "next/navigation";
import Image from "next/image";
import { getUserOrRedirect, paidAccess, recordProductEvent, requireProfile } from "@/lib/app-data";
import { visualImage } from "@/lib/visuals";
import { CheckoutForm } from "../checkout-form";

export default async function PaywallPage() {
  const user = await getUserOrRedirect();
  const profile = await requireProfile(user.id);
  if (await paidAccess(user.id, profile.id)) redirect("/home");
  await recordProductEvent({ userId: user.id, petProfileId: profile.id, eventName: "paywall_viewed" });

  return (
    <main className="page paywall-page">
      <section className="hero paywall-hero">
        <h1>Unlock {profile.name}&apos;s full 30-day plan</h1>
        <p>Unlock your full 30-day care plan and feel more prepared through the first month.</p>
      </section>

      <section className="paywall-grid">
        <div className="panel paywall-main">
          <h2>What changes</h2>
          <div className="value-grid">
            <section>
              <h3>Know the next step</h3>
              <p>Open the full 30-day timeline instead of guessing what comes next.</p>
            </section>
            <section>
              <h3>Use your pet&apos;s context</h3>
              <p>See care steps matched to the profile, concerns, and records you added.</p>
            </section>
            <section>
              <h3>Keep progress in view</h3>
              <p>Use in-app reminders, concern context, and full Milestones.</p>
            </section>
          </div>
          <CheckoutForm />
          <p className="muted small">One-time $9.99 purchase for one pet profile. Request a full refund within seven calendar days at wqy1994yeah@gmail.com; refunds return to the original payment method, are processed by Creem, and are not prorated.</p>
        </div>

        <aside className="panel">
          <h2>Free preview</h2>
          <p>Day 1 content, selected-concern safety guidance, and future timeline titles stay available.</p>
          <p className="muted small">
            Payment is processed by Creem. Free safety guidance remains available whether or not
            you unlock the full plan. <a className="source-link" href="/refund">Read the refund policy</a>.
          </p>
        </aside>
      </section>
      <Image
        className="section-image paywall-image"
        src={visualImage.paywall}
        alt="A calm home with everyday pet care items arranged along a routine"
        width={1100}
        height={760}
        sizes="(max-width: 760px) 100vw, 42vw"
      />
    </main>
  );
}
