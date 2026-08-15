import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function Protected({ children, role }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <main className="page">
        <p>Loading session…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }

  return children;
}
