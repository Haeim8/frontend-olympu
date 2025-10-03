"use client";

import { motion } from "framer-motion";

export function LandingBackground({ darkMode }) {
  // Générer des cercles concentriques avec progression exponentielle
  const generateCircles = (count, baseRadius, centerX, centerY) => {
    return Array.from({ length: count }, (_, i) => {
      const radius = baseRadius * Math.pow(1.5, i); // Progression exponentielle
      return {
        cx: centerX,
        cy: centerY,
        r: radius,
      };
    });
  };

  // Créer plusieurs groupes de cercles concentriques à différentes positions
  const circleGroups = [
    { circles: generateCircles(12, 50, 30, 20), opacity: 0.15 },
    { circles: generateCircles(12, 50, 70, 60), opacity: 0.10 },
    { circles: generateCircles(12, 50, 50, 90), opacity: 0.20 },
  ];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Background de base */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`} />

      {/* SVG avec animation douce */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1, opacity: 1 }}
        animate={{
          scale: 1.3,
          x: 100,
          opacity: 0.9,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {circleGroups.map((group, groupIndex) => (
          <g key={groupIndex} opacity={group.opacity}>
            {group.circles.map((circle, i) => (
              <circle
                key={i}
                cx={`${circle.cx}%`}
                cy={`${circle.cy}%`}
                r={`${circle.r}%`}
                fill="none"
                stroke={darkMode ? "#a3e635" : "#84cc16"} // Vert lime plus vif
                strokeWidth="0.15"
              />
            ))}
          </g>
        ))}
      </motion.svg>

      {/* Dégradé subtil par-dessus */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(17, 24, 39, 0.3) 100%)'
            : 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(249, 250, 251, 0.3) 100%)',
        }}
      />
    </div>
  );
}
