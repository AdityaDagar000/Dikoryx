import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";
import { ScrollReelTestimonials } from "./ScrollReelTestimonials";

const fadeIn = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const team = [
  {
    name: "Alex Johnson",
    role: "Threat Intelligence Lead",
    image: "/team/alex-johnson.jpg",
  },
  {
    name: "Sam Taylor",
    role: "Security Product Architect",
    image: "/team/sam-taylor.jpg",
  },
  {
    name: "Jordan Smith",
    role: "Endpoint Analytics Engineer",
    image: "/team/jordan-smith.jpg",
  },
  {
    name: "Casey Brown",
    role: "Compliance Operations Manager",
    image: "/team/casey-brown.jpg",
  },
];

const ceoMessages = [
  {
    quote: "Big effort - high quality. Best Framer content out there.",
    author: "CEO One",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
    alt: "Portrait of CEO One",
  },
  {
    quote:
      "I'm building a new website and it's absolutely ridiculous how valuable your content has been.",
    author: "CEO Two",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
    alt: "Portrait of CEO Two",
  },
];

export default function HomeSections() {
  return (
    <div className="bg-slate-950 text-white">
      <StorySection />
      <TeamSection />
      <CeoMessageSection />
      <ContactSection />
    </div>
  );
}

function StorySection() {
  return (
    <section id="about" className="relative overflow-hidden px-6 py-24">
      <Glow />
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="relative mx-auto max-w-6xl border-t border-purple-500/15 pt-16"
      >
        <p className="mb-4 inline-flex rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-1 text-sm text-purple-200">
          Our Story
        </p>
        <h2 className="max-w-3xl text-5xl font-black tracking-normal text-white md:text-6xl">
          Built for enterprise insider threat visibility.
        </h2>
        <div className="mt-8 max-w-4xl space-y-6 text-xl leading-9 text-gray-400">
          <p>
            DIKORYX was shaped around a simple problem: security teams need to understand risky user behavior before it
            becomes a breach. The platform brings endpoint activity, user behavior analytics, DLP signals, and risk
            scoring into one operational view.
          </p>
          <p>
            Every part of the system is designed for enterprise monitoring: fast triage, clean evidence, compliance
            intelligence, and meaningful alerts that help teams act with confidence.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {["Insider Threats", "Risk Scoring", "Compliance"].map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
              {item}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="px-6 pb-24">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-6xl"
      >
        <motion.h2 variants={fadeIn} className="text-4xl font-black md:text-5xl">
          Meet Our Team
        </motion.h2>
        <motion.p variants={fadeIn} className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">
          Add your team photos in <span className="text-purple-200">public/team</span> using the filenames below, and
          these cards will pick them up automatically.
        </motion.p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CeoMessageSection() {
  return (
    <section className="overflow-hidden px-6 pb-24">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-6xl"
      >
        <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Leadership Signal</p>
        <h2 className="mt-4 text-4xl font-black md:text-5xl">A message from our CEO</h2>
      </motion.div>

      <div className="mx-auto mt-10 flex max-w-6xl justify-center">
        <ScrollReelTestimonials testimonials={ceoMessages} />
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="px-6 pb-24">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="home-3d-card mx-auto grid max-w-6xl gap-10 rounded-[2rem] border border-purple-500/20 bg-black/45 p-8 shadow-[0_0_70px_rgba(142,5,194,0.12)] lg:grid-cols-[1fr_0.95fr]"
      >
        <div>
          <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm">Contact</p>
          <h2 className="mt-6 text-5xl font-black">Let's secure your enterprise.</h2>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-gray-400">
            Talk to us about insider threat monitoring, endpoint visibility, risk analytics, and compliance workflows
            for your organization.
          </p>
          <div className="mt-8 space-y-5">
            <ContactItem icon={MapPin} title="Operations" text="Enterprise Security Command Center" />
            <ContactItem icon={Mail} title="Email Us" text="security@dikoryx.com" />
            <ContactItem icon={Phone} title="Call Us" text="+1 (555) 012-4587" />
          </div>
        </div>

        <form className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-2xl font-bold">Request a demo</h3>
          <p className="mt-2 text-sm text-gray-500">Send a message and the DIKORYX team will get back to you.</p>
          <div className="mt-6 space-y-4">
            <input className="ContactInput" placeholder="Full name" />
            <input className="ContactInput" type="email" placeholder="Work email" />
            <input className="ContactInput" placeholder="Company" />
            <textarea className="ContactInput min-h-[130px] resize-none rounded-2xl py-4" placeholder="How can we help?" />
            <button
              type="button"
              className="w-full rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] px-5 py-4 font-semibold shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)]"
            >
              Send Message
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
}

function TeamCard({ member, index }) {
  return (
    <motion.article
      variants={fadeIn}
      whileHover={{ y: -10, rotateX: 5, rotateY: index % 2 === 0 ? -4 : 4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="home-3d-card group relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/35 to-black/75" />
      <img
        src={member.image}
        alt={member.name}
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center text-white/12">
        <UserCheck size={64} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-2xl font-black">{member.name}</h3>
        <p className="mt-1 text-gray-200">{member.role}</p>
        <p className="mt-3 text-xs text-purple-200/80">{member.image}</p>
      </div>
    </motion.article>
  );
}

function ContactItem({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-purple-200">
        <Icon size={22} />
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function Glow() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-[#700B97]/20 blur-[120px]" />
  );
}
