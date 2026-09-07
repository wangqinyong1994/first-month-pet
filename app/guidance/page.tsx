import Link from "next/link";

export default function GuidancePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>How we use guidance</h1>
        <p>First Month Pet helps new pet parents organize first-month tasks and recognize when to get professional help.</p>
      </section>
      <section className="stack">
        <section className="panel">
          <h2>Education, not diagnosis</h2>
          <p>Our guidance is for general education. It does not diagnose illness, prescribe treatment, or replace a veterinarian.</p>
        </section>
        <section className="panel">
          <h2>When to contact a veterinarian</h2>
          <p>If you think your pet may be having an emergency, contact a veterinarian or emergency veterinary service now. Do not wait for an in-app task or a reply from First Month Pet.</p>
        </section>
        <section className="panel">
          <h2>What the buttons do</h2>
          <p>Choosing an action saves your intended next step in your plan. It does not send a message, book an appointment, or contact a veterinarian on your behalf.</p>
        </section>
        <section className="panel">
          <h2>How concern guidance is written</h2>
          <p>Concern guidance is fixed, species-aware educational content written for the first month at home. We update it only after checking the wording and next-step boundaries again.</p>
          <Link className="secondary" href="/contact">Contact support</Link>
        </section>
      </section>
    </main>
  );
}
