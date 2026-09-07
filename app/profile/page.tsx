import { CONCERNS, HEALTH_RECORD_STATUS_LABEL, concernLabel } from "@/lib/domain";
import { getProfileData } from "@/lib/app-data";
import { TextField } from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";
import { ProfileForm } from "../profile-form";
import { milestoneImagePath } from "@/lib/milestones";
import { petVisualImage } from "@/lib/visuals";

export default async function ProfilePage() {
  const data = await getProfileData();

  return (
    <main className="page">
      <section className="profile-hero">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="lede">
            These details help organize this pet&apos;s first-month plan. For a copy of your application
            data or an account-deletion request, see <Link className="source-link" href="/contact">Contact</Link>.
          </p>
        </div>
        <Image
          className="section-image"
          src={petVisualImage(data.profile.pet_type)}
          alt={`Illustrative scene of a ${data.profile.pet_type} resting in a calm home`}
          width={1000}
          height={700}
          sizes="(max-width: 760px) 100vw, 36vw"
        />
      </section>

      <section className="grid">
        <ProfileForm>
          <input name="profile_id" type="hidden" value={data.profile.id} />
          <section className="form-section">
            <h2>Pet details</h2>
            <p className="muted">
              {data.profile.pet_type} · adopted {data.profile.adoption_date} ·{" "}
              {HEALTH_RECORD_STATUS_LABEL[data.profile.health_records_status]}
            </p>

            <label className="label" htmlFor="name">
              Name
            </label>
            <TextField.Root id="name" name="name" defaultValue={data.profile.name} required />

            <label className="label" htmlFor="adoption_date">
            Adoption date
            </label>
            <input
            className="input"
            id="adoption_date"
            name="adoption_date"
            type="date"
            defaultValue={data.profile.adoption_date}
            required
            />

            <label className="label" htmlFor="estimated_age_stage">
            Estimated age
            </label>
            <select
            className="select"
            id="estimated_age_stage"
            name="estimated_age_stage"
            defaultValue={data.profile.estimated_age_stage}
            >
            <option value="kitten_puppy">Kitten or puppy</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
            <option value="unknown">Unknown</option>
            </select>

            <label className="label" htmlFor="arrival_group_size">
            New arrivals at the same time
            </label>
            <select
            className="select"
            id="arrival_group_size"
            name="arrival_group_size"
            defaultValue={data.profile.arrival_group_size}
            >
            <option value="one">One</option>
            <option value="two">Two</option>
            <option value="three_plus">Three or more</option>
            </select>

            <label className="check">
            <input
              defaultChecked={data.profile.has_resident_pets}
              name="has_resident_pets"
              type="checkbox"
              value="yes"
            />
            There is already another pet at home
            </label>

            <label className="label" htmlFor="health_records_status">
            Health records status
            </label>
            <select
            className="select"
            id="health_records_status"
            name="health_records_status"
            defaultValue={data.profile.health_records_status}
            >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="not_sure">Not sure</option>
            </select>

            <label className="label" htmlFor="adoption_source">
            Adoption source
            </label>
            <select
            className="select"
            id="adoption_source"
            name="adoption_source"
            defaultValue={data.profile.adoption_source}
            >
            <option value="shelter">Shelter</option>
            <option value="breeder">Breeder</option>
            <option value="friend">Friend</option>
            <option value="stray">Stray</option>
            <option value="other">Other</option>
            </select>
          </section>

          <fieldset className="checks form-section">
            <legend className="label">Current concerns</legend>
            {CONCERNS.map(([value, label]) => (
              <label className="check" key={value}>
                <input
                  defaultChecked={data.concernKeys.includes(value)}
                  name="concerns"
                  type="checkbox"
                  value={value}
                />
                {label}
              </label>
            ))}
          </fieldset>

        </ProfileForm>

        <aside className="stack">
          <section className="panel">
            <h2>Account</h2>
            <p className="muted">{data.user.email}</p>
            <p>
              Plan access: <strong>{data.paid ? "unlocked" : data.purchases[0]?.status ?? "free preview"}</strong>
            </p>
          </section>

          <section className="panel">
            <h2>Current concerns</h2>
            {data.concernKeys.length ? (
              <ul>
                {data.concernKeys.map((key) => (
                  <li key={key}>{concernLabel(key)}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No concern is selected.</p>
            )}
          </section>
        </aside>
      </section>

      <section className="panel">
        <h2>Milestones</h2>
        <div className="stack">
          {data.milestones.map(({ definition, unlocked }) => (
            <div className="milestone-row" key={definition.id}>
              <div className="milestone-summary">
                <Image
                  className={unlocked ? "milestone-image" : "milestone-image milestone-image-locked"}
                  src={milestoneImagePath(definition.id)}
                  alt=""
                  width={72}
                  height={72}
                />
                <div>
                  <strong>{definition.title}</strong>
                  <p className="muted">
                    {unlocked
                      ? `${definition.value_copy} Unlocked ${new Date(unlocked.unlocked_at).toLocaleDateString()}.`
                      : definition.locked_hint}
                  </p>
                </div>
              </div>
              <span className="pill">{unlocked ? "unlocked" : "locked"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
