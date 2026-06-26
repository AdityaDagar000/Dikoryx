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
const getUserTheme = (name) => {
  const THEMES = [
    "bg-[#3E065F]", // DRACARYX Deep Purple
    "bg-[#1e3a8a]", // Royal Blue
    "bg-[#064e3b]", // Emerald
    "bg-[#831843]", // Rose
    "bg-[#b45309]", // Amber
    "bg-[#0f172a]", // Slate
  ];
  if (!name) return THEMES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THEMES[Math.abs(hash) % THEMES.length];
};
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactExpanded, setContactExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useMemo(() => readUser(), [location.pathname, location.key]);
const userThemeBg = useMemo(() => getUserTheme(user?.name || user?.username), [user]);
  const initial = (user?.name?.[0] || user?.username?.[0] || "U").toUpperCase();
  const tabs = [
    { title: "Home", icon: Shield, path: "/" },
    { title: "Dashboard", icon: LayoutDashboard, path: "/welcome" },
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
          {/* THE SLEEK OUTER TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2.5 rounded-full border border-white/5 bg-[#0a0514]/90 pl-1.5 pr-3 py-1.5 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:bg-[#150a29]"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner ${userThemeBg}`}>
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">
              {user.name || user.username}
            </span>
            <ChevronDown size={16} className={`ml-1 text-white/50 transition ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* THE CLEANED UP DROPDOWN MENU */}
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-[280px] rounded-xl border border-white/10 bg-[#0a0514]/95 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(192,132,252,0.1)] backdrop-blur-3xl text-white">
              
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner ${userThemeBg}`}>
                  {initial}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-base font-bold">{user.name || user.username}</span>
                  <span className="truncate text-xs text-gray-500">{user.email || `${user.username}@dracaryx.local`}</span>
                </div>
              </div>

              <div className="my-1 mx-1 border-t border-white/5" />

              {/* Menu Items */}
              <div className="flex flex-col p-1 gap-1">
                {/* Read-only Department */}
                <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-300">
                  <Shield size={16} className="text-gray-500" />
                  <span className="flex-1">Department</span>
                  <span className="text-xs text-gray-500">{user.department || "Security"}</span>
                </div>

                {/* Dashboard Action */}
                <button
                  onClick={() => { setProfileOpen(false); navigate("/welcome"); }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LayoutDashboard size={16} className="text-gray-400" />
                  <span>Dashboard</span>
                </button>
              </div>

              <div className="my-1 mx-1 border-t border-white/5" />

              {/* Logout Action */}
              <div className="p-1">
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>

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
