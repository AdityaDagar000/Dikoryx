import Home from "./Pages/Home";
import Pricing from "./Pages/Pricing";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import OtpVerify from "./Pages/OtpVerify";
import Dashboard from "./Pages/Dashboard";
import DownloadAgent from "./Pages/DownloadAgent";
import FooterPage from "./Pages/FooterPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Welcome from "./Pages/Welcome"; 
import AgentSelect from "./Pages/AgentSelect"; 

import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

/* =========================================================
   SECURITY MATRIX / ROUTE BOUNCERS
========================================================= */

/**
 * 1. Global Session Bouncer
 * Blocks all unauthenticated requests to private sections.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("itd_user");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * 2. Public-Only Bouncer
 * If a user is already signed in, don't let them go back to login/signup.
 * Directly bounce them forward into the operational stream.
 */
const PublicOnlyRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("itd_user");
  if (isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
};

/**
 * 3. OTP Flow State Bouncer (Crucial Fix)
 * Blocks direct navigation to /otp-verify. The user MUST have a transient
 * router state containing their email/username passed from the login/signup form submission.
 */
const OtpFlowRoute = ({ children }) => {
  const location = useLocation();
  const hasValidFlowState = location.state?.email || location.state?.username;

  if (!hasValidFlowState) {
    console.warn("Security Alert: Malicious or direct access attempt to /otp-verify intercepted.");
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * 4. Active Telemetry Node Guard
 * Blocks access to the monitoring console if no agent has been actively targeted.
 */
const ActiveAgentGuard = ({ children }) => {
  const selectedAgent = localStorage.getItem("selected_agent");
  if (!selectedAgent) {
    console.warn("Security Alert: Direct access to dashboard requested without an active node targeted.");
    return <Navigate to="/agents" replace />;
  }
  return children;
};

/* =========================================================
   CORE APPLICATION SHELL
========================================================= */
function App() {
  const location = useLocation();
  const showFooter = location.pathname === "/";

  return (
    <>
      <HashScroll />
      <Navbar />
      <Routes>
        {/* Strictly Public Anonymous Marketing Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/platform/:slug" element={<FooterPage />} />
        <Route path="/company/:slug" element={<FooterPage />} />
        <Route path="/resources/:slug" element={<FooterPage />} />

        {/* Guest-Only Access: Bounced if session is active */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

        {/* Transient State Protected: Bounced if access is direct */}
        <Route path="/otp-verify" element={<OtpFlowRoute><OtpVerify /></OtpFlowRoute>} />
        
        {/* Standard Session Protected Routes */}
        <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentSelect /></ProtectedRoute>} />
        <Route path="/download-agent" element={<ProtectedRoute><DownloadAgent /></ProtectedRoute>} />
        
        {/* Double-Locked Route: Enforces both a Valid Session AND an Active Targeted Node */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ActiveAgentGuard>
                <Dashboard />
              </ActiveAgentGuard>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Fallback */}
        <Route path="*" replace element={<Navigate to="/" />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
}

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    window.setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }, [location.hash, location.pathname]);

  return null;
}

export default App;