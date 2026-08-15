import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Layout from "../components/Layout.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register(name, email, password);
      navigate("/app", {
        replace: true,
        state: {
          notice: `Welcome, ${user.name}. Your traveler account is ready.`,
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
      <main className="page page-wide auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">New guest</p>
          <h1>Create your traveler account</h1>
          <p className="lede">
            After you register you land on the dashboard. From there, plan a
            trip and save preferences for the AI engine.
          </p>
        </div>
        <form className="card form" onSubmit={onSubmit}>
          {error ? <p className="error">{error}</p> : null}
          <label>
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
              placeholder="Asha Kumar"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="asha@example.com"
            />
          </label>
          <label>
            Password (min 8 characters)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Register and continue"}
          </button>
          <p className="muted">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </Layout>
  );
}
