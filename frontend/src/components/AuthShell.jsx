import { motion } from "framer-motion";
import logo from "../assets/logo.png";
import bgVideo from "../assets/bg.mp4";
import "../styles/login.css";

export default function AuthShell({ eyebrow, title, subtitle, children, maxWidth = "max-w-md" }) {
  return (
    <main className="auth-video-page relative flex min-h-screen overflow-hidden bg-[#020104] px-5 py-24 text-white">
      {/* 1. Unified Background: 75% brightness is the sweet spot for dark mode glass */}
      <video
        className="auth-bg-video brightness-75 saturate-[1.3] contrast-[1.15]"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      
      {/* Subtle vignette overlay instead of a heavy dark wash */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />

      <section className="relative z-10 mx-auto flex w-full flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          /* 2. Unified Card: 35% opacity deep purple, 24px blur (backdrop-blur-xl) */
          className={`auth-transparent-card w-full ${maxWidth} rounded-[24px] border border-white/10 border-t-white/20 bg-[#0f081e]/35 px-8 py-10 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl`}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 border-t-white/40 bg-white/[0.04] shadow-[0_8px_16px_rgba(0,0,0,0.4),0_0_30px_rgba(142,5,194,0.3)] backdrop-blur-md">
            <img src={logo} alt="DRACARYX Logo" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C084FC]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-lg font-light text-white/60">{subtitle}</p>

          <div className="mt-9">{children}</div>
        </motion.div>
      </section>
    </main>
  );
}

export function AuthField({ icon: Icon, label, value, onChange, type = "text", placeholder, autoComplete, action, required = true }) {
  return (
    <label className="block text-left mb-4">
      <span className="sr-only">{label}</span>
      <div
        className="
          group flex h-[50px] items-center rounded-xl
          border border-white/5
          bg-black/20
          px-4
          shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
          transition-all duration-200
          focus-within:border-[#C084FC]/50
          focus-within:bg-black/30
          focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_0_2px_rgba(192,132,252,0.15)]
        "
      >
        {Icon && <Icon className="mr-3 h-4 w-4 text-white/40 transition group-focus-within:text-[#C084FC]" />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/30"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        {action}
      </div>
    </label>
  );
}