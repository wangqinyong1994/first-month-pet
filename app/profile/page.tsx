import { CONCERNS, HEALTH_RECORD_STATUS_LABEL, concernLabel } from "@/lib/domain";
import { getProfileData } from "@/lib/app-data";
import { updateProfileAction } from "../actions";

export default async function ProfilePage() {
  const data = await getProfileData();

  return (
    <main className="page">
      <h1 className="page-title">Profile</h1>
      <p className="lede">
        Pet profile, account state, purchase state, and Milestones for this first-month plan.
      </p>

      <section className="grid">
        <form className="panel" action={updateProfileAction}>
          <input name="profile_id" type="hidden" value={data.profile.id} />
          <h2>{data.profile.name}</h2>
          <p className="muted">
            {data.profile.pet_type} · adopted {data.profile.adoption_date} ·{" "}
            {HEALTH_RECORD_STATUS_LABEL[data.profile.health_records_status]}
          </p>

          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="input" id="name" name="name" defaultValue={data.profile.name} required />

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

          <fieldset className="checks">
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

          <button className="button" type="submit">
            Save profile
          </button>
        </form>

        <aside className="stack">
          <section className="panel">
            <h2>Account</h2>
            <p className="muted">{data.user.email}</p>
            <p>
              Purchase state: <strong>{data.paid ? "paid" : data.purchases[0]?.status ?? "free"}</strong>
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
              <div>
                <strong>{definition.title}</strong>
                <p className="muted">
                  {unlocked
                    ? `${definition.value_copy} Unlocked ${new Date(unlocked.unlocked_at).toLocaleDateString()}.`
                    : definition.locked_hint}
                </p>
              </div>
              <span className="pill">{unlocked ? "unlocked" : "locked"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
