"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ExpandableTabs({
  tabs,
  activeColor = "text-purple-400",
}) {
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      className="
        flex items-center gap-2
        rounded-2xl
        border border-purple-500/20
        bg-black/70
        backdrop-blur-xl
        px-2 py-2
        shadow-lg
      "
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.title}
            onClick={() =>
              setSelected(selected === index ? null : index)
            }
            className={`
              flex items-center rounded-xl
              transition-all duration-300
              px-3 py-2
              ${
                selected === index
                  ? `bg-purple-500/10 ${activeColor}`
                  : "text-white"
              }
            `}
            animate={{
              width: selected === index ? "auto" : "48px",
            }}
          >
            <Icon size={20} />

            <AnimatePresence>
              {selected === index && (
                <motion.span
                  initial={{
                    opacity: 0,
                    width: 0,
                  }}
                  animate={{
                    opacity: 1,
                    width: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    width: 0,
                  }}
                  className="overflow-hidden whitespace-nowrap ml-2"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

