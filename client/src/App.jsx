import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Protected from "./Protected.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import NewTrip from "./pages/NewTrip.jsx";
import Register from "./pages/Register.jsx";
import TravelerHome from "./pages/TravelerHome.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import "./App.css";

function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <main className="page">
        <p>Loading…</p>
      </main>
    );
  }
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            path="/app"
            element={
              <Protected role="traveler">
                <TravelerHome />
              </Protected>
            }
          />
          <Route
            path="/app/trips/new"
            element={
              <Protected role="traveler">
                <NewTrip />
              </Protected>
            }
          />
          <Route
            path="/app/trips/:id"
            element={
              <Protected role="traveler">
                <TripDetail />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <AdminHome />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
