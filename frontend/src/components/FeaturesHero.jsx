import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function FeaturesHero() {
  const [titleNumber, setTitleNumber] = useState(0);

  const titles = useMemo(
    () => [
      "Insider Threat Detection",
      "User Behavior Analytics",
      "Data Loss Prevention",
      "USB Activity Monitoring",
      "Compliance Intelligence",
      "Risk Analytics",
    ],
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTitleNumber((prev) =>
        prev === titles.length - 1 ? 0 : prev + 1
      );
    }, 2500);

    return () => clearTimeout(timeout);
  }, [titleNumber, titles]);

  return (
    <section
      className="
        w-full
        bg-slate-950
        flex
        flex-col
        items-center
        text-center
        -mt-[340px]
        pb-4
        relative
        z-50
      "
    >
      {/* Heading */}
      <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
        Enterprise Protection
        <br />
        Through
      </h2>

      {/* Animated Text */}
      <div className="relative h-16 md:h-20 w-full mt-1 overflow-hidden">
        {titles.map((title, index) => (
          <motion.div
            key={index}
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              text-center
              text-purple-400
              font-bold
              text-3xl
              md:text-5xl
            "
            initial={{ opacity: 0, y: 80 }}
            animate={
              titleNumber === index
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    y: titleNumber > index ? -80 : 80,
                  }
            }
            transition={{ duration: 0.6 }}
          >
            {title}
          </motion.div>
        ))}
      </div>

      {/* Description */}
      <p className="max-w-3xl mt-4 text-base md:text-lg text-gray-400 leading-relaxed px-6">
        Dikoryx provides real-time insider threat detection,
        user behavior analytics, data loss prevention,
        compliance monitoring and risk intelligence across
        enterprise environments from a single platform.
      </p>
    </section>
  );
}