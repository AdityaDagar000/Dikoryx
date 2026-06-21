import { useState } from "react";
import "./../styles/login.css";
import { useNavigate } from "react-router-dom";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.agent_id) {
        const user = {
          username: data.username,
          agent_id: data.agent_id,
          name: data.name,
          department: data.department,
          photo_url: data.photo_url
        };

        localStorage.setItem("itd_user", JSON.stringify(user));

        if (onSuccess) {
          onSuccess();
        }

        navigate("/agents");

      } else {
        setError(data.error || "Authentication failed. Check node connection.");
      }

    } catch (err) {
      console.error(err);
      setError("Server error. Backend not reachable.");
    }
  };

  return (
    <div className="synth-root">
      {/* Subtle CRT Overlay */}
      <div className="cyber-scanlines"></div>

      <div className="synth-glass-card">
        
        {/* Profile Avatar */}
        <div className="synth-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>

        <div className="synth-header">
          <h1 className="synth-title cyber-glitch" data-text="Dikoryx">Dikoryx</h1>
          <p className="synth-subtitle">Prove you're not just another glitch.</p>
        </div>

        <form onSubmit={handleSubmit} className="synth-form">
          
          <div className="synth-input-wrapper">
             <span className="cyber-prefix">&gt;</span>
            <input
              className="synth-input"
              placeholder="123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="synth-input-wrapper">
             <span className="cyber-prefix" style={{color: 'var(--neon-magenta)'}}>&gt;</span>
            <input
              className="synth-input"
              type={showPwd ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span 
              className="synth-eye-btn" 
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? "⎌" : "👁️"}
            </span>
          </div>

          {error && (
            <div className="synth-error">
              {error}
            </div>
          )}

          <button className="synth-btn-primary" type="submit">
            LOGIN
          </button>
        </form>

        <div className="synth-footer">
          Don't have an account?{" "}
          <span
            className="synth-link"
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
          <div className="synth-auth-text">Authorized personnel only</div>
        </div>
        
        <div className="system-version">ITD_SYS.LOGIN_VER.1.2</div>
      </div>
    </div>
  );
}