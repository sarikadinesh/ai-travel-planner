import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Layout from "../components/Layout.jsx";

function formatRange(start, end) {
  const a = new Date(start).toLocaleDateString();
  const b = new Date(end).toLocaleDateString();
  return `${a} – ${b}`;
}

export default function TravelerHome() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let cancelled = false;
    api("/api/trips")
      .then((data) => {
        if (!cancelled) setTrips(data.trips);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <main className="page page-wide">
        <p className="eyebrow">Dashboard</p>
        <div className="dash-head">
          <div>
            <h1>Hello, {user?.name}</h1>
            <p className="lede">
              Signed in as {user?.email}. Plan a trip to capture preferences for
              the AI engine.
            </p>
          </div>
          <Link className="btn" to="/app/trips/new">
            Plan a trip
          </Link>
        </div>
        {notice ? <p className="banner success">{notice}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <section>
          <h2 className="section-title">My trips</h2>
          {loading ? <p>Loading trips…</p> : null}
          {!loading && trips.length === 0 ? (
            <div className="card">
              <p>
                No trips yet. Click <strong>Plan a trip</strong> and fill the
                form. We will store that data for LLM itinerary generation.
              </p>
            </div>
          ) : (
            <ul className="trip-list">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <Link className="card trip-card" to={`/app/trips/${trip.id}`}>
                    <strong>{trip.title}</strong>
                    <span>
                      {trip.destination} · {formatRange(trip.startDate, trip.endDate)}
                    </span>
                    <span className="muted">
                      {trip.currency} {trip.budgetCap} · {trip.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
}
