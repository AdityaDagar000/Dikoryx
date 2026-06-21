import {
  Shield,
  LayoutDashboard,
  DollarSign,
  LogIn,
  Mail,
} from "lucide-react";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactExpanded, setContactExpanded] = useState(false);

  const tabs = [
    { title: "Home", icon: Shield, path: "/" },
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Pricing", icon: DollarSign, path: "/pricing" },
    { title: "Login", icon: LogIn, path: "/login" },
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

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999]">
      <div
        className="
          flex items-center gap-2
          px-3 py-3
          rounded-2xl
          bg-black/70
          backdrop-blur-xl
          border border-purple-500/20
          shadow-[0_0_25px_rgba(168,85,247,0.15)]
        "
      >
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
                navigate(tab.path);
              }}
              className={`
                flex items-center
                overflow-hidden
                transition-all
                duration-300
                rounded-xl
                h-11
                ${
                  active || contactActive
                    ? "bg-purple-500/10 text-purple-400 px-4 gap-2"
                    : "text-white px-3 hover:text-purple-300"
                }
              `}
            >
              <Icon size={20} />

              <span
                className={`
                  whitespace-nowrap
                  transition-all
                  duration-300
                  ${
                    active || contactActive
                      ? "max-w-[120px] opacity-100"
                      : "max-w-0 opacity-0"
                  }
                `}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
