import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Terminal } from "lucide-react";
import { API } from "../api";
import { PixelCanvas } from "../components/ui/pixel-canvas";
import FallbackAvatar from "../components/ui/fallback-avatar";

export default function AgentSelect() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAgents = async () => {
    try {
      const systemsRes = await API.listSystems();
      const list = Array.isArray(systemsRes) ? systemsRes : systemsRes?.systems || [];
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
    <div className="relative min-h-screen w-full bg-[#020104] font-sans text-white overflow-hidden">
      
      {/* 1. The Animated Physics Pixel Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <PixelCanvas 
          colors={["#3E065F", "#8E05C2", "#C084FC", "#ffffff"]} 
          gap={8} 
          speed={25} 
        />
        {/* Vignette to ensure text readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020104_100%)]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-32 pb-24 text-center">
        
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-purple-300 shadow-[0_0_20px_rgba(142,5,194,0.2)]">
          <Terminal size={14} /> System Initialized
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter sm:text-8xl mb-6 drop-shadow-2xl">
          Silent <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Precision.</span>
        </h1>
        
        <p className="max-w-2xl text-lg text-white/60 mb-16 leading-relaxed">
          Interfaces with refined motion. Every calculated detail delivers an elevated digital experience. Select an active endpoint to initialize telemetry monitoring.
        </p>

        {/* 2. The Agent Grid with Avatars & Status Dots */}
        <div className="w-full text-left">
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
              <p className="animate-pulse text-white/50 tracking-widest uppercase text-sm">Scanning network vectors...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
              <p className="text-white/50">No active endpoints detected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {agents.map((agent) => {
                // Check if the agent has checked in within the last 10 minutes (600 seconds)
                const isActive = agent.last_seen && (Date.now() / 1000 - agent.last_seen) < 600;

                return (
                  <button
                    key={agent.agent_id}
                    onClick={() => handleSelect(agent)}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0a0514]/60 px-5 py-5 text-left backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-[#150a29]/80 hover:shadow-[0_8px_30px_rgba(142,5,194,0.15)]"
                  >
                    <div className="flex items-center gap-4 z-10">
                      
                      {/* Animated Avatar + Status Dot */}
                      <div className="relative">
                        <FallbackAvatar 
                          name={agent.name || agent.agent_id} 
                          size={46} 
                          className="rounded-full shadow-inner border border-white/5 group-hover:scale-105 transition-transform duration-300" 
                        />
                        {/* Status Indicator */}
                        <div 
                          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a0514] transition-colors duration-300 group-hover:border-[#150a29] ${
                            isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                          }`} 
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg text-white group-hover:text-purple-100 transition-colors">
                          {agent.name || "Unknown Operative"}
                        </h3>
                        <p className="text-xs text-white/40 font-mono mt-0.5 tracking-wider">
                          {agent.agent_id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all group-hover:border-purple-500/40 group-hover:bg-purple-500/20 group-hover:text-purple-300">
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )} 
        </div>
      </main>
    </div>
  );
}