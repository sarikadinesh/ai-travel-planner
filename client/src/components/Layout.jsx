import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="shell">
      <header className="nav">
        <Link to={user ? (user.role === "admin" ? "/admin" : "/app") : "/"} className="brand">
          AI Travel Planner
        </Link>
        <nav>
          {!user && (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register" className="btn">
                Register
              </NavLink>
            </>
          )}
          {user && (
            <>
              {user.role === "traveler" && (
                <NavLink to="/app/trips/new">Plan a trip</NavLink>
              )}
              <span className="who">
                {user.name} · {user.role}
              </span>
              <button type="button" className="linkish" onClick={signOut}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
