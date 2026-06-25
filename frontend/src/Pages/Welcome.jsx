import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShaderAnimation } from "../components/ui/ShaderAnimation";

export default function Welcome() {
  const navigate = useNavigate();
  const [name, setName] = useState("Analyst");

  useEffect(() => {
    // 1. Attempt to get the user's name from your existing auth storage
    try {
      const user = JSON.parse(localStorage.getItem("itd_user"));
      if (user && (user.name || user.username)) {
        setName(user.name || user.username);
      }
    } catch (e) {
      console.error("Failed to parse user data");
    }

    // 2. Set the 5-second timer
    const timer = setTimeout(() => {
      navigate("/agents");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      <ShaderAnimation />
      <div className="absolute inset-0 bg-black/40" /> {/* Slight dark wash so text pops */}
      
      <h1 className="z-10 text-center text-6xl font-black tracking-tighter text-white sm:text-8xl mix-blend-plus-lighter">
        Welcome, {name}.
      </h1>
      <p className="z-10 mt-4 text-lg text-white/50 tracking-widest uppercase">
        Initializing secure connection...
      </p>
    </div>
  );
}