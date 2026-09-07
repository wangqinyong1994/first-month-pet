import { redirect } from "next/navigation";
import { Button, Card, TextField } from "@radix-ui/themes";
import Image from "next/image";
import { signInAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  const params = await searchParams;

  return (
    <main className="page login-page">
      <section className="login-copy">
        <h1>Care starts with a calmer first month.</h1>
        <p>A clear first-month plan for a newly adopted cat or dog, with practical care steps and safety guidance.</p>
        <div className="login-visual">
          <Image src="/illustrations/login-companion-v2.png" alt="A newly adopted cat and dog resting together" fill priority sizes="(max-width: 760px) 100vw, 50vw" />
        </div>
      </section>
      <Card className="login-form">
        <form action={signInAction}>
          <h2>Email magic link</h2>
          <label className="label" htmlFor="email">
            Email
          </label>
          <TextField.Root id="email" name="email" type="email" required />
          <p className="muted small">We’ll email a sign-in link to this address.</p>
          {params.sent ? <p className="notice">Check your email for the sign-in link.</p> : null}
          {params.error ? <p className="notice notice-error">The link could not be sent. Try again.</p> : null}
          <Button type="submit">Send magic link</Button>
        </form>
      </Card>
    </main>
  );
}
