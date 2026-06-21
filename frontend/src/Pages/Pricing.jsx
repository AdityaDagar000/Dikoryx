import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const benefits = [
  "Advanced insider threat analytics",
  "User behavior analytics and anomaly detection",
  "Data loss prevention and USB activity monitoring",
  "Enterprise risk scoring engine",
  "Compliance intelligence and audit evidence",
  "Unlimited endpoint agents",
  "Priority onboarding and support",
];

const metrics = [
  ["24/7", "Monitoring"],
  ["Custom", "Deployment"],
  ["SOC", "Ready"],
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-6 pb-20 pt-32 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(142,5,194,0.24),transparent_38%),linear-gradient(135deg,#020617_0%,#030712_48%,#000000_100%)]" />
      <div className="absolute left-1/2 top-24 h-px w-[min(920px,86vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8E05C2] to-transparent shadow-[0_0_38px_rgba(142,5,194,0.55)]" />

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
            <Sparkles size={16} />
            Enterprise pricing
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            Security pricing built around your organization.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            DIKORYX is tailored for enterprise insider threat programs, compliance teams, and SOC workflows. Talk to us
            and we will shape deployment, support, and monitoring around your environment.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {metrics.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-2xl font-black text-purple-200">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
          className="home-3d-card relative overflow-hidden rounded-[2rem] border border-purple-400/25 bg-black/55 p-7 shadow-[0_0_70px_rgba(142,5,194,0.18)] backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(142,5,194,0.28),transparent_42%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Corporate</p>
                <h2 className="mt-3 text-4xl font-black">Custom</h2>
                <p className="mt-2 text-gray-400">For enterprise organizations</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <ShieldCheck size={28} />
              </div>
            </div>

            <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/#contact")}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] px-5 py-4 font-semibold shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)]"
            >
              Contact Sales
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
