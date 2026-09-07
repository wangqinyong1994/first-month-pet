import { redirect } from "next/navigation";
import Image from "next/image";
import { CONCERNS } from "@/lib/domain";
import { getProfile, getUserOrRedirect, recordProductEvent } from "@/lib/app-data";
import { createProfileAction } from "../actions";
import { PendingButton } from "../pending-button";
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

      <form className="card onboarding-form" action={createProfileAction}>
        <label className="label" htmlFor="pet_type">
          Pet type
        </label>
        <select className="select" id="pet_type" name="pet_type" required>
          <option value="cat">Cat</option>
          <option value="dog">Dog</option>
        </select>

        <label className="label" htmlFor="name">
          Name
        </label>
        <input className="input" id="name" name="name" required />

        <label className="label" htmlFor="adoption_date">
          Adoption date
        </label>
        <input className="input" id="adoption_date" name="adoption_date" type="date" required />

        <label className="label" htmlFor="estimated_age_stage">
          Estimated age
        </label>
        <select className="select" id="estimated_age_stage" name="estimated_age_stage" required>
          <option value="kitten_puppy">Kitten or puppy</option>
          <option value="adult">Adult</option>
          <option value="senior">Senior</option>
          <option value="unknown">Unknown</option>
        </select>

        <label className="label" htmlFor="health_records_status">
          Health records status
        </label>
        <select className="select" id="health_records_status" name="health_records_status" required>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="not_sure">Not sure</option>
        </select>

        <label className="label" htmlFor="adoption_source">
          Adoption source
        </label>
        <select className="select" id="adoption_source" name="adoption_source" required>
          <option value="shelter">Shelter</option>
          <option value="breeder">Breeder</option>
          <option value="friend">Friend</option>
          <option value="stray">Stray</option>
          <option value="other">Other</option>
        </select>

        <label className="label" htmlFor="arrival_group_size">
          New arrivals at the same time
        </label>
        <select className="select" id="arrival_group_size" name="arrival_group_size" required>
          <option value="one">One</option>
          <option value="two">Two</option>
          <option value="three_plus">Three or more</option>
        </select>

        <label className="check">
          <input name="has_resident_pets" type="checkbox" value="yes" />
          There is already another pet at home
        </label>

        <fieldset className="checks">
          <legend className="label">Current concerns</legend>
          {CONCERNS.map(([value, label]) => (
            <label className="check" key={value}>
              <input name="concerns" type="checkbox" value={value} />
              {label}
            </label>
          ))}
        </fieldset>

        <PendingButton className="button" type="submit" pendingLabel="Creating profile…">Create profile</PendingButton>
      </form>
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
