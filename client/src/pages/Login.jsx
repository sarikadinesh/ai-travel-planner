import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Layout from "../components/Layout.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      const dest = user.role === "admin" ? "/admin" : "/app";
      navigate(dest, {
        replace: true,
        state: { notice: `Signed in as ${user.name}.` },
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
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to your dashboard</h1>
          <p className="lede">
            Travelers go to Plan a trip. Admins go to the platform console.
          </p>
        </div>
        <form className="card form" onSubmit={onSubmit}>
          {error ? <p className="error">{error}</p> : null}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="muted">
            New here? <Link to="/register">Create a traveler account</Link>
          </p>
        </form>
      </main>
    </Layout>
  );
}
