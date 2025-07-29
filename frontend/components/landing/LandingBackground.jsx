"use client";

import { motion } from "framer-motion";

export function LandingBackground({ darkMode }) {
  return (
    <>
      {/* Background principal avec points animés */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill={darkMode ? "#070000b3" : "#ececec"} />
          {[...Array(100)].map((_, i) => (
            <motion.circle
              key={i}
              cx={`${Math.random() * 100}%`}
              cy={`${Math.random() * 100}%`}
              r={Math.random() * 2}
              fill={darkMode ? "#ffffff58" : "#000000"}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 6 + 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </div>

      {/* Lignes de connexion animées */}
      <svg className="absolute inset-0 z-0" xmlns="http://www.w3.org/2000/svg">
        <g stroke={darkMode ? "#b9f542" : "#7cf503"} strokeWidth="0.5" fill="none">
          <motion.path
            d="M20,20 L40,40 L60,30 L80,50 L100,40"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 6, ease: "easeInOut" }}
          />
          <motion.circle
            cx="20"
            cy="20"
            r="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
          />
          <motion.circle
            cx="40"
            cy="40"
            r="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2 }}
          />
          <motion.circle
            cx="60"
            cy="30"
            r="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 3 }}
          />
          <motion.circle
            cx="80"
            cy="50"
            r="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 4 }}
          />
          <motion.circle
            cx="100"
            cy="40"
            r="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 5 }}
          />
        </g>
      </svg>

      {/* Vague animée continue */}
      <motion.div
        className="absolute inset-0 z-0 opacity-60"
        initial={{ pathLength: 0, pathOffset: 1 }}
        animate={{ pathLength: 1, pathOffset: 0 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M0,50 Q50,0 100,50 Q50,100 0,50"
            stroke={darkMode ? "#a3e635" : "#a3e635"}
            strokeWidth="0.5"
            fill="none"
            initial={{ pathLength: 0, pathOffset: 1 }}
            animate={{ pathLength: 1, pathOffset: 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>
    </>
  );
}