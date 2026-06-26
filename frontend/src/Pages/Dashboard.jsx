import React, { useEffect, useMemo, useState } from "react";
import SystemList from "../components/SystemList";
import SystemDetails from "../components/SystemDetails";
import { API } from "../api";
import { LogOut, Menu, RadioTower, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ShaderBackground from "../components/ShaderBackground";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [systems, setSystems] = useState([]);
  const [riskMap, setRiskMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const dashboardStats = useMemo(() => {
    const now = Date.now() / 1000;
    const active = systems.filter((system) => system.last_seen && now - system.last_seen < 600).length;
    const risks = Object.values(riskMap);
    const high = risks.filter((risk) => ["HIGH", "CRITICAL"].includes((risk?.risk_level || "").toUpperCase())).length;
    const averageRisk = risks.length
      ? Math.round(risks.reduce((sum, risk) => sum + Number(risk?.risk_score || 0), 0) / risks.length)
      : 0;

    return {
      total: systems.length,
      active,
      high,
      averageRisk,
      inactive: Math.max(0, systems.length - active),
    };
  }, [systems, riskMap]);

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
    <div className="soc-dashboard-shell">
      <ShaderBackground className="soc-dashboard-shader" />
      <div className="soc-dashboard-overlay" />

      <div className="soc-dashboard-header">
        <div className="soc-header-left">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="soc-icon-button"
            aria-label="Toggle endpoint sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="soc-title-block">
            <div className="soc-title-row">
              <ShieldCheck size={20} />
              <span>DIKORYX SOC COMMAND</span>
            </div>
            <div className="soc-subtitle">
              <RadioTower size={14} />
              Active Endpoints: {systems.length}
              {lastSyncedAt && (
                <> // Synced {new Date(lastSyncedAt).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="soc-logout-button"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="soc-overview-strip">
        <SocMetricCard label="Total Endpoints" value={dashboardStats.total} trend="Fleet inventory" />
        <SocMetricCard label="Active Signals" value={dashboardStats.active} trend={`${dashboardStats.inactive} inactive`} accent="green" />
        <SocMetricCard label="High Risk Nodes" value={dashboardStats.high} trend="High + critical" accent="red" />
        <SocMetricCard label="Avg Risk Score" value={dashboardStats.averageRisk} trend="Across loaded agents" accent="purple" />
      </div>

      <div className="soc-dashboard-main">
        {isSidebarOpen && (
          <aside className="soc-sidebar-panel">
            <div className="soc-sidebar-inner">
              {user && (
                <div className="soc-user-card">
                  <div className="soc-user-label">Signed-in analyst</div>
                  <div className="soc-user-name">{user.name || user.username}</div>
                  <div className="soc-user-meta">{user.department}</div>
                  <div className="soc-user-agent">{user.agent_id}</div>
                </div>
              )}

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
          </aside>
        )}

        <section className="soc-details-panel">
          {selected ? (
            <SystemDetails agentId={selected} />
          ) : (
            <div className="soc-empty-state">
              <div className="soc-empty-kicker">No endpoint selected</div>
              <h2>Select an agent to view details</h2>
              <p>Open the endpoint drawer and choose an active system to inspect risk, DLP, compliance, and telemetry.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SocMetricCard({ label, value, trend, accent = "blue" }) {
  const width = Math.min(100, Math.max(8, Number(value) || 0));

  return (
    <div className={`soc-metric-card soc-metric-${accent}`}>
      <div className="soc-metric-top">
        <span>{label}</span>
        <span className="soc-metric-dot" />
      </div>
      <div className="soc-metric-value">{value}</div>
      <div className="soc-metric-trend">{trend}</div>
      <div className="soc-metric-bar">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
