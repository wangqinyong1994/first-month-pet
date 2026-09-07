import { redirect } from "next/navigation";
import { Button, Card, TextField } from "@radix-ui/themes";
import Link from "next/link";
import Image from "next/image";
import { signInAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { visualImage } from "@/lib/visuals";

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
      <div className="login-main">
        <section className="login-copy">
          <p className="pill">Free Day 1 plan</p>
          <h1>Create and save your free Day 1 plan.</h1>
          <p>
            Use your email to keep the plan available when you return and continue into onboarding when
            you are ready.
          </p>
          <Link className="text-link" href="/">
            Back to the Day 1 preview
          </Link>
        </section>
        <Card className="login-form">
          <form action={signInAction}>
            <h2>Continue with email</h2>
            <label className="label" htmlFor="email">
              Email
            </label>
            <TextField.Root id="email" name="email" type="email" required />
            <p className="muted small">We’ll email a secure sign-in link to this address.</p>
            {params.sent ? <p className="notice">Check your email for the sign-in link.</p> : null}
            {params.error ? <p className="notice notice-error">The link could not be sent. Try again.</p> : null}
            <Button type="submit">Create my plan</Button>
          </form>
        </Card>
      </div>
      <Image
        className="login-image"
        src={visualImage.login}
        alt="A new pet parent sharing a quiet moment with a newly adopted pet at home"
        width={1100}
        height={1400}
        priority
        sizes="(max-width: 760px) 100vw, 42vw"
      />
    </main>
  );
}
