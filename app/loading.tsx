export default function Loading() {
  return (
    <main className="page" aria-label="Loading">
      <section className="hero">
        <div className="skeleton" style={{ width: "7rem" }} />
        <div className="skeleton" style={{ width: "min(42rem, 90%)", minHeight: "4rem" }} />
        <div className="skeleton" style={{ width: "min(32rem, 80%)" }} />
      </section>
      <section className="grid">
        <div className="panel stack"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
        <div className="panel stack"><div className="skeleton" /><div className="skeleton" /></div>
      </section>
    </main>
  );
}
