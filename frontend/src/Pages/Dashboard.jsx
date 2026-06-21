import React, { useEffect, useState } from "react";
import SystemList from "../components/SystemList";
import SystemDetails from "../components/SystemDetails";
import { API } from "../api";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [systems, setSystems] = useState([]);
  const [riskMap, setRiskMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  // ✅ Load user + selected agent ONCE
  useEffect(() => {
    const storedUser = localStorage.getItem("itd_user");
    const storedAgent = localStorage.getItem("selected_agent");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (storedAgent) {
      setSelected(storedAgent);
    }
  }, []);

  // ✅ Load systems + risk
  const load = async () => {
    try {
      const [systemsRes, riskRes] = await Promise.all([
        API.listSystems(),
        API.getAllRisk(),
      ]);

      const list = Array.isArray(systemsRes)
        ? systemsRes
        : systemsRes?.systems || [];

      // ✅ Build risk map
      const map = {};
      for (const r of Array.isArray(riskRes) ? riskRes : []) {
        if (r?.agent_id) map[r.agent_id] = r;
      }
      setRiskMap(map);

      // 🔥 SHOW ALL AGENTS (FIXED)
      setSystems(list);

      // ✅ Maintain selected agent properly
      setSelected((prev) => {
        const stored = localStorage.getItem("selected_agent");

        if (stored && list.some((s) => s.agent_id === stored)) {
          return stored;
        }

        if (prev && list.some((s) => s.agent_id === prev)) {
          return prev;
        }

        return null;
      });

      setLastSyncedAt(Date.now());
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  };

  // ✅ Poll every 30s
  useEffect(() => {
    load();
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#050a14",
        color: "#fff",
        fontFamily: "'Rajdhani', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(0, 240, 255, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              border: "1px solid #00f0ff",
              color: "#00f0ff",
              padding: "0.5rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Menu size={20} />
          </button>

          <div>
            <div style={{ color: "#00f0ff", fontWeight: "bold" }}>
              INSIDER THREAT DETECTION
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              Active Endpoints: {systems.length}
              {lastSyncedAt && (
                <> // {new Date(lastSyncedAt).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          style={{
            border: "1px solid red",
            color: "red",
            padding: "0.4rem 1rem",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          LOGOUT
        </button>
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        {isSidebarOpen && (
          <div
            style={{
              width: "300px",
              background: "rgba(0,0,0,0.5)",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "1rem" }}>
              {/* USER CARD */}
              {user && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    border: "1px solid #00f0ff",
                  }}
                >
                  <div>{user.name || user.username}</div>
                  <div style={{ fontSize: "0.8rem" }}>
                    {user.department}
                  </div>
                  <div style={{ fontSize: "0.7rem" }}>
                    {user.agent_id}
                  </div>
                </div>
              )}

              {/* SYSTEM LIST */}
              <SystemList
                systems={systems}
                riskMap={riskMap}
                selected={selected}
                onSelect={(id) => {
                  setSelected(id);
                  localStorage.setItem("selected_agent", id);
                }}
              />
            </div>
          </div>
        )}

        {/* DETAILS */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {selected ? (
            <SystemDetails agentId={selected} />
          ) : (
            <div style={{ padding: "2rem", opacity: 0.6 }}>
              Select an agent to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}