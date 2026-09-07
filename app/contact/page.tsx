export default function ContactPage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Contact</h1>
        <p>Support and refund requests: <a className="source-link" href="mailto:wqy1994yeah@gmail.com">wqy1994yeah@gmail.com</a></p>
        <p>Location: Hong Kong, China</p>
      </section>
      <section className="stack">
        <section className="panel">
          <h2>Data requests</h2>
          <p>Email us from the address used for your account to request a structured copy of your application data or account deletion. We verify identity before processing a request.</p>
        </section>
        <section className="panel">
          <h2>What application data can include</h2>
          <p>Your account email, pet profile, plan and wellbeing activity, and product activity. Payment-provider records are handled separately by Creem and are not deleted through an application account-deletion request.</p>
        </section>
      </section>
    </main>
  );
}
