import { LampContainer } from "../ui/lamp";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <LampContainer>
      <motion.h1
  initial={{ opacity: 0.5, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{
    delay: 0.3,
    duration: 0.8,
  }}
  className="
  -mt-[500px]
  text-center
  text-7xl
  md:text-9xl
  font-black
  text-transparent
  bg-clip-text
"
  style={{
    backgroundImage:
      "linear-gradient(to top,#FFFFFF,#E9D5FF,#C084FC,#A855F7)",
  }}
>
  DRACARYX
</motion.h1>
    </LampContainer>
  );
}