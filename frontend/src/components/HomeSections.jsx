import { motion } from "framer-motion";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import devanshImage from "../assets/devansh.png";
import adityaImage from "../assets/aditya.png";
import {
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { ScrollReelTestimonials } from "./ScrollReelTestimonials";

const fadeIn = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};
const ceoMessages = [
  {
    quote: "Big effort - high quality. Best Framer content out there.",
    author: "Devansh Goyal",
    image: devanshImage,
    alt: "Devansh Goyal",
  },
  {
    quote: "I'm building a new website and it's absolutely ridiculous how valuable your content has been.",
    author: "Aditya Dagar",
    image: adityaImage,
    alt: "Aditya Dagar",
  },
];

export default function HomeSections() {
  return (
    <div className="bg-slate-950 text-white">
      <StorySection />
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const sendMessage = async (e) => {
    e.preventDefault();

    try {
      await emailjs.send(
        "service_kq2tyhc",
        "template_9fxtqtt",
        {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: formData.message,
        },
        "jCnhkL9sJTZVuCLzS"
      );

      alert("Message sent successfully!");

      setFormData({
        name: "",
        email: "",
        company: "",
        message: "",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to send message");
    }
  };

  return (
    <section id="contact" className="px-6 pb-24">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] border border-purple-500/10 bg-gradient-to-b from-[#050816] to-[#02030b] p-10 lg:grid-cols-2"
      >
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm">
            Contact
          </span>

          <h2 className="mt-8 text-5xl font-black leading-tight">
            Let's secure your enterprise.
          </h2>

          <p className="mt-6 max-w-lg text-xl leading-10 text-gray-400">
            Talk to us about insider threat monitoring, endpoint visibility,
            risk analytics, and compliance workflows for your organization.
          </p>

          <div className="mt-12 space-y-8">
            <ContactItem
              icon={MapPin}
              title="Operations"
              text="Enterprise Security Command Center"
            />

            <ContactItem
              icon={Mail}
              title="Email Us"
              text="dracaryx0@gmail.com"
            />
          </div>
        </div>

        <form
          onSubmit={sendMessage}
          className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"
        >
          <h3 className="text-4xl font-black">Request a demo</h3>

          <p className="mt-3 text-gray-500">
            Send a message and the DIKORYX team will get back to you.
          </p>

          <div className="mt-8 space-y-5">
            <input
              className="ContactInput"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              className="ContactInput"
              type="email"
              placeholder="Work email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              required
            />

            <input
              className="ContactInput"
              placeholder="Company"
              value={formData.company}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  company: e.target.value,
                })
              }
            />

          <textarea
  style={{
    paddingTop: "45px",
    paddingLeft: "28px",
    textAlign: "left",
  }}
  className="ContactInput min-h-[130px] resize-none rounded-2xl"
  placeholder="How can we help?"
  value={formData.message}
  onChange={(e) =>
    setFormData({
      ...formData,
      message: e.target.value,
    })
  }
  required
/>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-full bg-gradient-to-r from-purple-700 to-fuchsia-600 px-6 py-4 text-lg font-bold transition hover:opacity-90"
          >
            Send Message
          </button>
        </form>
      </motion.div>
    </section>
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
