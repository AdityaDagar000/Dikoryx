import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const footerPages = {
  "/platform/insider-threat-detection": {
    eyebrow: "Platform",
    title: "Insider Threat Detection",
    intro:
      "Detect risky user behavior before it becomes a breach. DIKORYX correlates endpoint activity, identity context, file movement, and behavior signals into one analyst-ready view.",
    points: [
      "Behavioral baselines for users and endpoints",
      "Risk scoring for suspicious activity patterns",
      "Investigation context for SOC triage",
    ],
  },
  "/platform/user-behavior-analytics": {
    eyebrow: "Platform",
    title: "User Behavior Analytics",
    intro:
      "Understand how users interact with systems, files, networks, and devices so abnormal behavior can be reviewed quickly and consistently.",
    points: [
      "Activity summaries across monitored endpoints",
      "Signals for unusual process, clipboard, and file activity",
      "Clear context for compliance and security teams",
    ],
  },
  "/platform/risk-analytics": {
    eyebrow: "Platform",
    title: "Risk Analytics",
    intro:
      "Prioritize what matters with risk indicators built for operational security teams. Scores help analysts identify which endpoint or user needs attention first.",
    points: [
      "High-risk node identification",
      "Score drivers for faster investigations",
      "Fleet-level visibility for leadership reporting",
    ],
  },
  "/platform/dlp-monitoring": {
    eyebrow: "Platform",
    title: "DLP Monitoring",
    intro:
      "Monitor sensitive data movement and policy alerts from one place. DIKORYX helps security teams review potential exfiltration and risky file handling.",
    points: [
      "DLP alert visibility inside the SOC dashboard",
      "Severity-first review of policy events",
      "Evidence-friendly monitoring workflows",
    ],
  },
  "/company/about-dikoryx": {
    eyebrow: "Company",
    title: "About DIKORYX",
    intro:
      "DIKORYX is built for modern security teams that need clarity across user activity, endpoint telemetry, insider risk, and compliance posture.",
    points: [
      "Focused on enterprise insider threat detection",
      "Designed for SOC analysts and security leaders",
      "Built around visibility, speed, and operational trust",
    ],
  },
  "/company/security": {
    eyebrow: "Company",
    title: "Security",
    intro:
      "Security is treated as the product foundation. The platform is designed to support controlled access, auditable activity, and careful handling of security telemetry.",
    points: [
      "Authorized analyst access model",
      "Monitoring workflows aligned with SOC operations",
      "Security-first product architecture",
    ],
  },
  "/company/compliance": {
    eyebrow: "Company",
    title: "Compliance",
    intro:
      "DIKORYX helps teams keep compliance context close to operational activity, making it easier to review endpoint posture and policy enforcement.",
    points: [
      "Endpoint compliance indicators",
      "Policy status visibility for monitored systems",
      "Evidence support for audit preparation",
    ],
  },
  "/company/enterprise-support": {
    eyebrow: "Company",
    title: "Enterprise Support",
    intro:
      "Enterprise teams need reliable support for deployment, monitoring, and investigation workflows. This page can later hold your support plans and contact process.",
    points: [
      "Deployment and onboarding assistance",
      "Operational guidance for SOC teams",
      "Support paths for enterprise security programs",
    ],
  },
  "/resources/documentation": {
    eyebrow: "Resources",
    title: "Documentation",
    intro:
      "Use this page for setup guides, agent documentation, dashboard workflows, API notes, and operational runbooks for your DIKORYX deployment.",
    points: [
      "Agent setup and configuration guides",
      "Dashboard usage notes",
      "Troubleshooting and integration references",
    ],
  },
  "/resources/case-studies": {
    eyebrow: "Resources",
    title: "Case Studies",
    intro:
      "Show how DIKORYX can help teams reduce investigation time, improve endpoint visibility, and strengthen insider threat programs.",
    points: [
      "SOC triage workflow examples",
      "Insider risk detection scenarios",
      "Compliance visibility outcomes",
    ],
  },
  "/resources/privacy-policy": {
    eyebrow: "Resources",
    title: "Privacy Policy",
    intro:
      "This page is reserved for your final privacy policy. It should explain what information is collected, how it is used, and how your organization protects it.",
    points: [
      "Data collection and retention details",
      "User and organization privacy commitments",
      "Contact information for privacy questions",
    ],
  },
  "/resources/terms-of-service": {
    eyebrow: "Resources",
    title: "Terms of Service",
    intro:
      "This page is reserved for your final terms. It should describe acceptable use, access conditions, account responsibilities, and service limitations.",
    points: [
      "Authorized use requirements",
      "Account and access responsibilities",
      "Service scope and legal notices",
    ],
  },
};

export default function FooterPage() {
  const { pathname } = useLocation();
  const page = footerPages[pathname] ?? {
    eyebrow: "DIKORYX",
    title: "Information",
    intro:
      "This page is part of the DIKORYX information center. Add your final details here when the content is ready.",
    points: ["Enterprise security visibility", "SOC-ready workflows", "Risk and compliance context"],
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 pb-24 pt-36 text-white">
      <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-purple-500/20 bg-black/45 p-8 shadow-[0_0_70px_rgba(142,5,194,0.12)] md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,5,194,0.2),transparent_38%)]" />
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition hover:border-[#8E05C2]/70 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mt-14 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-[#C084FC] shadow-[0_0_32px_rgba(142,5,194,0.28)]">
            <ShieldCheck size={28} />
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.28em] text-purple-300">{page.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-normal md:text-6xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-400">
            {page.intro}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {page.points.map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2]" />
                <p className="text-sm leading-6 text-gray-300">{point}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[1.5rem] border border-purple-500/20 bg-black/35 p-6">
            <h2 className="text-2xl font-black">DIKORYX Security Operations</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
              This content is intentionally editable. Replace it later with your final product copy, screenshots,
              policy language, team details, or customer-ready documentation while keeping the page structure in place.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
