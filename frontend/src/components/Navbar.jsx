import {
  ChevronDown,
  Download,
  DollarSign,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Shield,
  UserCircle,
  UserPlus,
} from "lucide-react";

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("itd_user") || "null");
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactExpanded, setContactExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useMemo(() => readUser(), [location.pathname, location.key]);

  const tabs = [
    { title: "Home", icon: Shield, path: "/" },
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Download", icon: Download, path: "/download-agent" },
    { title: "Pricing", icon: DollarSign, path: "/pricing" },
    ...(!user
      ? [
          { title: "Login", icon: LogIn, path: "/login" },
          { title: "Signup", icon: UserPlus, path: "/signup" },
        ]
      : []),
    { title: "Contact Us", icon: Mail, path: "#contact", isContact: true },
  ];

  const scrollToContact = () => {
    setContactExpanded(true);

    const scroll = () => {
      document.getElementById("contact")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    if (location.pathname !== "/") {
      navigate("/#contact");
      window.setTimeout(scroll, 120);
      return;
    }

    scroll();
  };

  const signOut = () => {
    localStorage.removeItem("itd_user");
    localStorage.removeItem("selected_agent");
    setProfileOpen(false);
    navigate("/login");
  };

  return (
    <>
      <nav className="fixed left-1/2 top-5 z-[99999] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-black/70 px-3 py-3 shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.path;
            const contactActive = tab.isContact && (contactExpanded || location.hash === "#contact");

            return (
              <button
                key={tab.title}
                onClick={() => {
                  if (tab.isContact) {
                    scrollToContact();
                    return;
                  }

                  setContactExpanded(false);
                  setProfileOpen(false);
                  navigate(tab.path);
                }}
                className={`flex h-11 items-center overflow-hidden rounded-xl transition-all duration-300 ${
                  active || contactActive
                    ? "gap-2 bg-purple-500/10 px-4 text-purple-400"
                    : "px-3 text-white hover:text-purple-300"
                }`}
              >
                <Icon size={20} />
                <span
                  className={`whitespace-nowrap transition-all duration-300 ${
                    active || contactActive ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
                  }`}
                >
                  {tab.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {user && (
        <div className="fixed right-6 top-5 z-[100000]">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-black/70 px-3 py-2 text-white shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-xl transition hover:border-purple-400/50"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-purple-500/10">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.name || user.username} className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-6 w-6 text-[#C084FC]" />
              )}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-semibold md:block">
              {user.name || user.username}
            </span>
            <ChevronDown size={16} className={`transition ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-purple-500/20 bg-black/90 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-purple-500/10">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.name || user.username} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle className="h-7 w-7 text-[#C084FC]" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{user.name || user.username}</p>
                  <p className="truncate text-sm text-gray-500">{user.email || user.department || "DIKORYX Analyst"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <ProfileLine label="Username" value={user.username} />
                <ProfileLine label="Agent ID" value={user.agent_id} />
                <ProfileLine label="Department" value={user.department || "Security Operations"} />
              </div>

              <button
                type="button"
                onClick={() => navigate("/download-agent")}
                className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-purple-400/50 hover:text-white"
              >
                <Info size={16} />
                More information and agent download
              </button>

              <button
                type="button"
                onClick={signOut}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ProfileLine({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-1 break-all font-mono text-xs text-gray-200">{value || "Not available"}</p>
    </div>
  );
}
