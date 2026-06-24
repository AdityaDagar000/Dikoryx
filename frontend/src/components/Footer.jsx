import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MapPin, Phone, ShieldCheck, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Insider Threat Detection", to: "/platform/insider-threat-detection" },
      { label: "User Behavior Analytics", to: "/platform/user-behavior-analytics" },
      { label: "Risk Analytics", to: "/platform/risk-analytics" },
      { label: "DLP Monitoring", to: "/platform/dlp-monitoring" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About DIKORYX", to: "/company/about-dikoryx" },
      { label: "Security", to: "/company/security" },
      { label: "Compliance", to: "/company/compliance" },
      { label: "Enterprise Support", to: "/company/enterprise-support" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/resources/documentation" },
      { label: "Case Studies", to: "/resources/case-studies" },
      { label: "Privacy Policy", to: "/resources/privacy-policy" },
      { label: "Terms of Service", to: "/resources/terms-of-service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      id="contact-footer"
      className="relative overflow-hidden border-t border-purple-500/20 bg-black px-6 py-16 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(142,5,194,0.2),transparent_42%)]" />
      <div className="absolute left-1/2 top-0 h-px w-[min(900px,86vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8E05C2] to-transparent shadow-[0_0_32px_rgba(142,5,194,0.5)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_1fr_1fr]"
      >
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 shadow-[0_0_32px_rgba(142,5,194,0.28)] overflow-hidden">
    <img
      src={logo}
      alt="DIKORYX Logo"
      className="h-7 w-7 object-contain"
    />
  </span>

  <span className="text-2xl font-black tracking-normal">
    DIKORYX
  </span>
</Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-gray-400">
            Enterprise insider threat detection, user behavior analytics, and compliance intelligence for modern
            security teams.
          </p>

          <div className="mt-7 space-y-4 text-sm text-gray-300">
            <ContactLine icon={Mail} label="dracaryx0@gmail.com" />
            <ContactLine icon={MapPin} label="Enterprise Security Operations" />
          </div>

          <div className="mt-7 flex gap-3">
            {[Twitter, Linkedin, Github].map((Icon, index) => (
              <a
                key={index}
                href="#contact-footer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gray-400 transition hover:border-[#8E05C2]/70 hover:text-white hover:shadow-[0_0_22px_rgba(142,5,194,0.26)]"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 lg:col-span-2">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-white">{group.title}</h3>
              <nav className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
                {group.links.map((item) => (
                  <Link key={item.to} to={item.to} className="transition hover:text-[#C084FC]">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} DRACARYX. All rights reserved.</p>
        <p>Built for enterprise monitoring, risk visibility, and secure operations.</p>
      </div>
    </footer>
  );
}

function ContactLine({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3E065F]/60 text-[#C084FC]">
        <Icon size={16} />
      </span>
      <span>{label}</span>
    </div>
  );
}
