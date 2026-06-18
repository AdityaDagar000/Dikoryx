import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

export default function AgentSelect() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loadAgents = async () => {
    try {
      const systemsRes = await API.listSystems();

      // Normalize response
      const list = Array.isArray(systemsRes)
        ? systemsRes
        : systemsRes?.systems || [];

      setAgents(list);
    } catch (err) {
      console.error("Agent fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleSelect = (agent) => {
    localStorage.setItem("selected_agent", agent.agent_id);
    navigate("/dashboard");
  };

  return (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `
  linear-gradient(rgba(5,0,20,0.8), rgba(5,0,20,0.9)),
  url('/src/assets/cyberpunk-bg.jpg')
`,
backgroundSize: "cover",
backgroundPosition: "center",
    color: "#fff",
    fontFamily: "Orbitron, sans-serif",
    position: "relative",
    overflow: "hidden"
  }}>

    {/* Background glow */}
    <div style={{
      position: "absolute",
      top: "-20%",
      width: "800px",
      height: "800px",
      background: "radial-gradient(circle, rgba(0,240,255,0.15), transparent 70%)",
      filter: "blur(80px)"
    }} />

    <div style={{
      width: "650px",
      padding: "2rem",
      borderRadius: "20px",
      background: "rgba(10,10,20,0.7)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(0,240,255,0.2)",
      boxShadow: "0 0 40px rgba(0,240,255,0.15)",
      position: "relative",
      zIndex: 2
    }}>

      <h2 style={{
        marginBottom: "0.5rem",
        letterSpacing: "1px"
      }}>
        Active Agents
      </h2>

      <p style={{
        fontSize: "0.8rem",
        opacity: 0.7,
        marginBottom: "1.5rem"
      }}>
        Endpoints currently reporting telemetry
      </p>

      <div style={{
        marginBottom: "1.5rem",
        color: "#ff007a",
        fontWeight: "600"
      }}>
        Someone’s system is always screaming.
      </div>

      {loading ? (
        <p>Scanning network...</p>
      ) : agents.length === 0 ? (
        <p>No active endpoints detected</p>
      ) : (
        agents.map((agent, index) => (
          <div
            key={agent.agent_id}
            onClick={() => handleSelect(agent)}
            style={{
              padding: "1.2rem",
              marginBottom: "1rem",
              border: "1px solid rgba(255,0,122,0.3)",
              borderRadius: "14px",
              cursor: "pointer",
              background: "rgba(20,0,30,0.6)",
              transition: "0.2s",
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255,0,122,0.5)";
              e.currentTarget.style.borderColor = "#ff007a";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(255,0,122,0.3)";
            }}
          >

            {/* Agent ID circle */}
            <div style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#ff007a,#7a00ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700"
            }}>
              {String(index + 1).padStart(3, "0")}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontWeight: "600" }}>
                {agent.name || "Unknown User"}
              </div>

              <div style={{
                fontSize: "0.75rem",
                opacity: 0.6
              }}>
                {agent.agent_id}
              </div>

              <div style={{
                fontSize: "0.75rem",
                color: "#00f0ff",
                marginTop: "4px"
              }}>
                View Dashboard →
              </div>
            </div>

          </div>
        ))
      )}
    </div>
  </div>
);
}