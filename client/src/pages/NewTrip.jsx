import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";
import { INTERESTS } from "../interests.js";

const empty = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  travelersCount: 1,
  budgetCap: "",
  currency: "INR",
  pace: "balanced",
  interests: [],
  preferredPlaces: "",
  mustSee: "",
  avoid: "",
  diet: "veg",
  otherPreferences: "",
  notes: "",
};

export default function NewTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(id) {
    setForm((prev) => {
      const has = prev.interests.includes(id);
      return {
        ...prev,
        interests: has
          ? prev.interests.filter((item) => item !== id)
          : [...prev.interests, id],
      };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const preferredPlaces = form.preferredPlaces || form.mustSee;
      const data = await api("/api/trips", {
        method: "POST",
        body: {
          ...form,
          preferredPlaces,
          mustSee: preferredPlaces,
          otherPreferences: form.otherPreferences,
          notes: form.otherPreferences,
          travelersCount: Number(form.travelersCount),
          budgetCap: Number(form.budgetCap),
        },
      });
      navigate(`/app/trips/${data.trip.id}`, {
        replace: true,
        state: {
          notice:
            "Trip preferences saved. This payload is what the AI engine will use next.",
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <main className="page page-wide">
        <p className="eyebrow">New trip</p>
        <h1>Plan a trip</h1>
        <p className="lede">
          Tell us how you travel — destination, dates, budget, and interests.
          You do not need to know the famous places. The AI engine will pick
          what is special there. Only add a specific stop if you already have
          one in mind.
        </p>
        <form className="card form" onSubmit={onSubmit}>
          {error ? <p className="error">{error}</p> : null}
          <label>
            Trip title
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              placeholder="Goa long weekend"
            />
          </label>
          <label>
            Destination
            <input
              value={form.destination}
              onChange={(e) => setField("destination", e.target.value)}
              required
              placeholder="Goa, India"
            />
            <span className="field-hint">
              City or region is enough. Sights, food spots, and day plans come
              from the AI.
            </span>
          </label>
          <div className="form-row">
            <label>
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                required
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Travelers
              <input
                type="number"
                min="1"
                value={form.travelersCount}
                onChange={(e) => setField("travelersCount", e.target.value)}
                required
              />
            </label>
            <label>
              Budget cap
              <input
                type="number"
                min="0"
                value={form.budgetCap}
                onChange={(e) => setField("budgetCap", e.target.value)}
                required
                placeholder="40000"
              />
            </label>
            <label>
              Currency
              <input
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                required
              />
            </label>
          </div>
          <fieldset className="choice-set">
            <legend>Pace</legend>
            {["relaxed", "balanced", "packed"].map((pace) => (
              <label key={pace} className="inline">
                <input
                  type="radio"
                  name="pace"
                  checked={form.pace === pace}
                  onChange={() => setField("pace", pace)}
                />
                {pace}
              </label>
            ))}
          </fieldset>
          <fieldset className="choice-set">
            <legend>Interests</legend>
            {INTERESTS.map((item) => (
              <label key={item.id} className="inline">
                <input
                  type="checkbox"
                  checked={form.interests.includes(item.id)}
                  onChange={() => toggleInterest(item.id)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <label>
            Places you specifically prefer to visit
            <textarea
              value={form.preferredPlaces}
              onChange={(e) => {
                setField("preferredPlaces", e.target.value);
                setField("mustSee", e.target.value);
              }}
              rows={2}
              placeholder="Only if you already have a place in mind, e.g. a beach cafe or a temple"
            />
            <span className="field-hint">
              Optional. Leave blank if you are new to the destination — the AI
              will suggest the main places.
            </span>
          </label>
          <label>
            Any specific things you want to avoid
            <textarea
              value={form.avoid}
              onChange={(e) => setField("avoid", e.target.value)}
              rows={2}
              placeholder="Crowds, long hikes, loud nightlife, too much travel"
            />
          </label>
          <fieldset className="choice-set">
            <legend>Diet</legend>
            <label className="inline">
              <input
                type="radio"
                name="diet"
                checked={form.diet === "veg"}
                onChange={() => setField("diet", "veg")}
              />
              Veg
            </label>
            <label className="inline">
              <input
                type="radio"
                name="diet"
                checked={form.diet === "nonveg"}
                onChange={() => setField("diet", "nonveg")}
              />
              Non-veg
            </label>
          </fieldset>
          <label>
            Tell any other preferences
            <textarea
              value={form.otherPreferences}
              onChange={(e) => setField("otherPreferences", e.target.value)}
              rows={3}
              placeholder="Type anything else the planner should know"
            />
          </label>
          <div className="actions">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save preferences"}
            </button>
            <Link className="btn secondary" to="/app">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </Layout>
  );
}
