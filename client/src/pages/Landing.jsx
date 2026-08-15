import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function Landing() {
  return (
    <Layout>
      <main className="page page-wide">
        <section className="hero">
          <p className="eyebrow">Guest landing</p>
          <h1>Plan a trip with AI — itinerary, budget, and packing in one place.</h1>
          <p className="lede">
            Start as a guest, register, then tell us where you want to go. Those
            details become the input for the travel planner engine.
          </p>
          <div className="actions">
            <Link className="btn" to="/register">
              Register free
            </Link>
            <Link className="btn secondary" to="/login">
              Sign in
            </Link>
          </div>
        </section>

        <section className="feature-grid">
          <article className="card">
            <h2>1. Register</h2>
            <p>Create a traveler account. You own every trip you start.</p>
          </article>
          <article className="card">
            <h2>2. Plan a trip</h2>
            <p>City, dates, budget, and interests. The AI finds the special places.</p>
          </article>
          <article className="card">
            <h2>3. AI itinerary</h2>
            <p>Saved form data is what the LLM uses to generate your plan.</p>
          </article>
        </section>
      </main>
    </Layout>
  );
}
