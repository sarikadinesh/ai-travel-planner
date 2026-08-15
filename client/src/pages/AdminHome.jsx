import Layout from "../components/Layout.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function AdminHome() {
  const { user } = useAuth();

  return (
    <Layout>
      <main className="page">
        <p className="eyebrow">Admin</p>
        <h1>Platform console</h1>
        <section className="card">
          <h2>Signed in</h2>
          <p>
            {user?.name} ({user?.email}). User tables and stats will land in a
            later step. This page exists so admin login is visibly different
            from a traveler.
          </p>
        </section>
      </main>
    </Layout>
  );
}
