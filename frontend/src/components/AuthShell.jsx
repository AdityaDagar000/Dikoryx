import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import logo from "../assets/logo.png";

export default function AuthShell({ eyebrow, title, subtitle, children, maxWidth = "max-w-md" }) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-black px-5 py-24 text-white">
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(142,5,194,0.48) 1px, transparent 1.4px)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(circle at center, black 0%, black 28%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 0%, black 28%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.78) 60%, #000 100%)",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        animate={{ opacity: [0.18, 0.34, 0.18], scale: [0.94, 1.04, 0.94] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ backgroundColor: "#700B97" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, #000 0%, rgba(62,6,95,0.2) 48%, transparent 100%)",
        }}
      />

      <section className="relative z-10 mx-auto flex w-full flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={`w-full ${maxWidth} text-center`}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[0_0_44px_rgba(142,5,194,0.36)] backdrop-blur">
            <img
  src={logo}
  alt="DRACARYX Logo"
  className="h-10 w-10 object-contain"
/>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/45">{eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-normal text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-3 text-2xl font-light text-white/55 sm:text-3xl">{subtitle}</p>

          <div className="mt-9">{children}</div>
        </motion.div>
      </section>
    </main>
  );
}

export function AuthField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  action,
  required = true,
}) {
  return (
    <label className="block text-left">
      <span className="sr-only">{label}</span>
      <div className="group flex h-14 items-center rounded-full border border-white/10 bg-black/35 px-5 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)] backdrop-blur-md transition focus-within:border-[#8E05C2]/70 focus-within:bg-black/55 focus-within:shadow-[0_0_26px_rgba(142,5,194,0.18)]">
        {Icon && <Icon className="mr-3 h-4 w-4 text-white/35 transition group-focus-within:text-[#8E05C2]" />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full bg-transparent text-center text-white outline-none placeholder:text-white/35 sm:text-left"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        {action}
      </div>
    </label>
  );
}
