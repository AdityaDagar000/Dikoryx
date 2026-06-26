"use client";

import React, { useEffect, useRef, useMemo } from "react";

export default function FallbackAvatar({ name = "Unknown", size = 40, className }) {
  const canvasRef = useRef(null);

  // 1. Create a stable, deterministic hash from the user's name
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = name.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }, [name]);

  // 2. Render the animated WebGL-style canvas gradient
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let time = 0;

    // Pick two deep, cyberpunk-themed colors based on the name hash
    const baseHues = [260, 280, 310, 190, 220]; // Purples, Pinks, Blues
    const hue1 = baseHues[hash % baseHues.length];
    const hue2 = baseHues[(hash + 1) % baseHues.length];

    const render = () => {
      time += 0.015; // Animation speed

      // Handle high-DPI (retina) displays cleanly
      const width = canvas.width;
      const height = canvas.height;

      // Calculate swirling coordinates for the gradient
      const x0 = width / 2 + Math.cos(time) * width * 0.3;
      const y0 = height / 2 + Math.sin(time) * height * 0.3;
      const x1 = width / 2 + Math.cos(time + Math.PI) * width * 0.3;
      const y1 = height / 2 + Math.sin(time + Math.PI) * height * 0.3;

      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      
      // Deep space/cyberpunk color stops
      gradient.addColorStop(0, `hsl(${hue1}, 80%, 35%)`);
      gradient.addColorStop(0.5, `hsl(${hue2}, 60%, 15%)`);
      gradient.addColorStop(1, `#020104`); // Fades into deep DRACARYX black

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [hash]);

  return (
    <div 
      // Changed to standard template literal - no utils needed!
      className={`relative overflow-hidden shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size * 2} // Render at 2x resolution for sharpness
        height={size * 2}
        className="absolute inset-0 w-full h-full"
      />
      <div 
        className="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-md z-10 mix-blend-overlay" 
        style={{ fontSize: size * 0.4 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}