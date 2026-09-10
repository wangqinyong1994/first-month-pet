import { redirect } from "next/navigation";
import Image from "next/image";
import { getProfile, getUserOrRedirect, recordProductEvent } from "@/lib/app-data";
import { OnboardingForm } from "../onboarding-form";
import { visualImage } from "@/lib/visuals";

export default async function OnboardingPage() {
  const user = await getUserOrRedirect();
  const profile = await getProfile(user.id);
  if (profile) redirect("/home");
  await recordProductEvent({ userId: user.id, eventName: "onboarding_viewed" });

  return (
    <main className="page onboarding-page">
      <section className="onboarding-hero">
        <h1 className="page-title">Create your pet profile</h1>
        <p className="lede">One profile is supported in this MVP.</p>
      </section>

      <OnboardingForm />
      <Image
        className="section-image onboarding-image"
        src={visualImage.onboarding}
        alt="A new pet parent preparing a calm home for a newly adopted cat"
        width={1100}
        height={760}
        priority
        sizes="(max-width: 760px) 100vw, 42vw"
      />
    </main>
  );
}
