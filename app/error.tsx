"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="page">
      <section className="panel stack" role="alert">
        <h1>We could not load this page.</h1>
        <p className="muted">Please try again. If the problem continues, contact support.</p>
        <button className="button" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  );
}
