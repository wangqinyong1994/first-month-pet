import { signInAction } from "../actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page">
      <section className="hero">
        <h1>First Month Pet</h1>
        <p>
          A light first-month plan for a newly adopted cat or dog, with care steps and
          guidance for when contacting a veterinarian may help.
        </p>
      </section>

      <form className="card" action={signInAction}>
        <h2>Email magic link</h2>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" required />
        <p className="muted small">Supabase sends the sign-in link to this address.</p>
        {params.sent ? <p className="notice">Check your email for the sign-in link.</p> : null}
        {params.error ? <p className="notice">The link could not be sent. Try again.</p> : null}
        <button className="button" type="submit">
          Send magic link
        </button>
      </form>
    </main>
  );
}
