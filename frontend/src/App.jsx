import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AgentSelect from "./pages/AgentSelect";

export default function App() {
  const location = useLocation();

  // 🔥 ALWAYS READ FRESH (fixes stale state)
  const user = JSON.parse(localStorage.getItem("itd_user") || "null");
  const selectedAgent = localStorage.getItem("selected_agent");

  // 🔒 PROTECTED ROUTE LOGIC
  const requireAuth = (element) => {
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return element;
  };

  const requireAgent = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!selectedAgent) return <Navigate to="/agents" replace />;
    return element;
  };

  return (
    <Routes>

      {/* ROOT */}
      <Route
        path="/"
        element={
          user
            ? (selectedAgent ? <Navigate to="/dashboard" replace /> : <Navigate to="/agents" replace />)
            : <Navigate to="/login" replace />
        }
      />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* AGENT SELECT */}
      <Route
        path="/agents"
        element={requireAuth(<AgentSelect />)}
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={requireAgent(<Dashboard />)}
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}