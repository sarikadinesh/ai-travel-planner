import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";

function money(currency, amount) {
  const n = Number(amount) || 0;
  return `${currency} ${n.toLocaleString()}`;
}

export default function TripDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    api(`/api/trips/${id}`)
      .then((data) => setTrip(data.trip))
      .catch((err) => setError(err.message));
  }, [id]);

  async function generate() {
    setError("");
    setGenerating(true);
    try {
      const data = await api(`/api/trips/${id}/generate`, {
        method: "POST",
        timeoutMs: 120000,
      });
      setTrip(data.trip);
      setNotice(
        data.trip.generationSource === "fallback"
          ? data.trip.generationError
            ? `Used weather fallback. Gemini error: ${data.trip.generationError}`
            : "Plan generated with weather data. Add GEMINI_API_KEY in server/.env and restart the API."
          : "Itinerary generated with Gemini from your preferences and the forecast."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this trip?")) return;
    try {
      await api(`/api/trips/${id}`, { method: "DELETE" });
      navigate("/app", { replace: true, state: { notice: "Trip deleted." } });
    } catch (err) {
      setError(err.message);
    }
  }

  const plan = trip?.plan;
  const budget = plan?.budget;

  return (
    <Layout>
      <main className="page page-wide">
        <p className="eyebrow">
          {trip?.status === "generated" ? "Generated plan" : "Saved preferences"}
        </p>
        {notice ? <p className="banner success">{notice}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!trip && !error ? <p>Loading…</p> : null}
        {trip ? (
          <>
            <h1>{trip.title}</h1>
            <p className="lede">
              {trip.destination}
              {trip.coords?.label ? ` · ${trip.coords.label}` : ""} ·{" "}
              {new Date(trip.startDate).toLocaleDateString()} –{" "}
              {new Date(trip.endDate).toLocaleDateString()} · {trip.travelersCount}{" "}
              travelers · {trip.currency} {trip.budgetCap}
            </p>

            <div className="actions" style={{ marginBottom: "1.25rem" }}>
              <button className="btn" type="button" onClick={generate} disabled={generating}>
                {generating
                  ? "Generating… geocode, weather, AI"
                  : trip.status === "generated"
                    ? "Regenerate itinerary"
                    : "Generate itinerary"}
              </button>
              <Link className="btn secondary" to="/app">
                Back to dashboard
              </Link>
              <button type="button" className="linkish" onClick={remove}>
                Delete trip
              </button>
            </div>

            <section className="card">
              <h2>Preferences used</h2>
              <dl className="facts">
                <div>
                  <dt>Pace</dt>
                  <dd>{trip.pace}</dd>
                </div>
                <div>
                  <dt>Interests</dt>
                  <dd>{trip.interests.length ? trip.interests.join(", ") : "—"}</dd>
                </div>
                <div>
                  <dt>Places you prefer to visit</dt>
                  <dd>
                    {trip.preferredPlaces ||
                      trip.mustSee ||
                      "None — AI will suggest places based on the destination"}
                  </dd>
                </div>
                <div>
                  <dt>Things to avoid</dt>
                  <dd>{trip.avoid || "—"}</dd>
                </div>
                <div>
                  <dt>Diet</dt>
                  <dd>{trip.diet === "nonveg" ? "Non-veg" : "Veg"}</dd>
                </div>
                <div>
                  <dt>Other preferences</dt>
                  <dd>{trip.otherPreferences || trip.notes || "—"}</dd>
                </div>
              </dl>
            </section>

            {plan ? (
              <>
                {plan.travelDna ? (
                  <p className="banner success">
                    Travel DNA: <strong>{plan.travelDna}</strong>
                    {plan.summary ? ` — ${plan.summary}` : ""}
                  </p>
                ) : null}

                {plan.weatherNotes ? (
                  <p className="banner weather">{plan.weatherNotes}</p>
                ) : null}

                {budget ? (
                  <section className="card budget-card">
                    <h2>Budget</h2>
                    <div className="budget-kpis">
                      <div>
                        <span>Cap</span>
                        <strong>{money(budget.currency, budget.cap)}</strong>
                      </div>
                      <div>
                        <span>Estimated</span>
                        <strong>{money(budget.currency, budget.estimated)}</strong>
                      </div>
                      <div>
                        <span>Remaining</span>
                        <strong className={budget.overBudget ? "over" : ""}>
                          {money(budget.currency, budget.remaining)}
                        </strong>
                      </div>
                    </div>
                    {budget.overBudget ? (
                      <p className="error">This plan is over your budget cap.</p>
                    ) : null}
                    <table className="budget-table">
                      <tbody>
                        {Object.entries(budget.categories || {}).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{money(budget.currency, value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {budget.suggestion ? (
                      <p className="muted">{budget.suggestion}</p>
                    ) : null}
                  </section>
                ) : null}

                <h2 className="section-title">Itinerary</h2>
                <div className="day-list">
                  {(plan.days || []).map((day, i) => (
                    <article className="card day-card" key={day.date || i}>
                      <header>
                        <h3>
                          Day {i + 1}
                          {day.title ? ` · ${day.title}` : ""}
                        </h3>
                        <p className="muted">
                          {day.date} · {day.weather?.tempC}°C · {day.weather?.condition}
                        </p>
                      </header>
                      {day.adjustedForWeather && day.weatherAdjustment ? (
                        <p className="banner weather">{day.weatherAdjustment}</p>
                      ) : null}
                      <ol className="blocks">
                        {(day.blocks || []).map((block, j) => (
                          <li key={`${block.time}-${j}`}>
                            <strong>{block.time}</strong> {block.title}
                            {block.estimatedCost ? (
                              <span className="muted">
                                {" "}
                                · {money(trip.currency, block.estimatedCost)}
                              </span>
                            ) : null}
                            {block.notes ? <div className="muted">{block.notes}</div> : null}
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>

                {plan.activities?.length ? (
                  <>
                    <h2 className="section-title">Activity recommendations</h2>
                    <ul className="trip-list">
                      {plan.activities.map((act) => (
                        <li key={act.name} className="card">
                          <strong>{act.name}</strong>
                          <p className="muted">
                            {act.reason}
                            {act.estimatedCost
                              ? ` · ${money(trip.currency, act.estimatedCost)}`
                              : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {plan.packing?.length ? (
                  <>
                    <h2 className="section-title">Packing</h2>
                    <div className="feature-grid">
                      {plan.packing.map((group) => (
                        <section className="card" key={group.category}>
                          <h2>{group.category}</h2>
                          <ul>
                            {(group.items || []).map((item) => (
                              <li key={item.name}>
                                {item.name}
                                {item.reason ? (
                                  <span className="muted"> — {item.reason}</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <p className="muted">
                Click Generate itinerary. The engine will geocode the destination,
                pull Open-Meteo weather, then build a day-by-day plan.
              </p>
            )}
          </>
        ) : null}
      </main>
    </Layout>
  );
}
