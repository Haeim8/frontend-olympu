"use client";

import React, { useEffect, useRef } from "react";

export function RippleBackground({ darkMode = true }) {
  const canvasRef = useRef(null);
  const ripples = useRef([]);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("❌ Canvas not found");
      return;
    }

    console.log("✅ Canvas found, initializing...");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth || window.innerWidth;
        canvas.height = parent.offsetHeight || window.innerHeight;
        console.log(`📐 Canvas resized: ${canvas.width}x${canvas.height}`);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse move handler - crée plus de ripples
    const handleMouseMove = (e) => {
      if (Math.random() > 0.85) { // Plus fréquent
        ripples.current.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: 200,
          alpha: 0.6,
          speed: 2,
        });
      }
    };

    // Auto-generate ripples toutes les secondes
    const autoRippleInterval = setInterval(() => {
      if (canvas.width > 0 && canvas.height > 0) {
        ripples.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 0,
          maxRadius: 150,
          alpha: 0.5,
          speed: 1.5,
        });
        console.log(`➕ Ripple added (total: ${ripples.current.length})`);
      }
    }, 1000);

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!canvas.width || !canvas.height) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      ripples.current = ripples.current.filter((ripple) => {
        ripple.radius += ripple.speed;
        ripple.alpha -= 0.003;

        if (ripple.alpha <= 0 || ripple.radius > ripple.maxRadius) {
          return false;
        }

        // Draw ripple
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = darkMode
          ? `rgba(132, 204, 22, ${ripple.alpha})`
          : `rgba(101, 163, 13, ${ripple.alpha})`;
        ctx.lineWidth = 3; // Très épais pour tester
        ctx.stroke();

        return true;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();
    console.log("🎬 Animation started");

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(autoRippleInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      console.log("🛑 Animation stopped");
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: 1, // 100% visible pour tester
        backgroundColor: darkMode ? "rgba(255, 0, 0, 0.1)" : "rgba(0, 255, 0, 0.1)", // Debug: fond rouge/vert
        zIndex: 1,
      }}
    />
  );
}
