"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function ThemeToggle3D() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 shadow-lg" />
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      aria-label="Toggle Theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative w-12 h-12 md:w-14 md:h-14 cursor-pointer [perspective:800px] focus:outline-none"
    >
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotateY: isDark ? 180 : 0, rotateX: isDark ? 5 : 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        style={{ transformOrigin: "center" }}
      >
        {/* Front (Light) */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-400 shadow-[0_10px_25px_rgba(251,191,36,0.35)] border border-white/40 flex items-center justify-center [transform:translateZ(16px)]"
        >
          {/* Sun */}
          <div className="relative w-6 h-6 md:w-7 md:h-7 rounded-full bg-yellow-300 shadow-inner">
            <div className="absolute inset-[-6px] animate-pulse opacity-40 rounded-full bg-yellow-300 blur-md" />
          </div>
        </div>

        {/* Back (Dark) */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-800 shadow-[0_10px_25px_rgba(99,102,241,0.35)] border border-white/10 flex items-center justify-center [transform:rotateY(180deg)_translateZ(16px)]"
        >
          {/* Moon */}
          <div className="relative w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-200">
            <div className="absolute -left-1 -top-1 w-6 h-6 md:w-7 md:h-7 rounded-full bg-indigo-800" />
            <div className="absolute inset-[-6px] opacity-30 rounded-full bg-indigo-300 blur-md" />
          </div>
        </div>

        {/* Left */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/80 to-white/60 dark:from-indigo-900/70 dark:to-indigo-800/60 border border-white/20 dark:border-white/10 [transform:rotateY(-90deg)_translateZ(16px)]" />
        {/* Right */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/70 to-white/50 dark:from-purple-900/60 dark:to-purple-800/50 border border-white/20 dark:border-white/10 [transform:rotateY(90deg)_translateZ(16px)]" />
        {/* Top */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-indigo-800/70 dark:to-purple-800/60 border border-white/20 dark:border-white/10 [transform:rotateX(90deg)_translateZ(16px)]" />
        {/* Bottom */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/70 to-white/50 dark:from-indigo-900/60 dark:to-purple-900/50 border border-white/20 dark:border-white/10 [transform:rotateX(-90deg)_translateZ(16px)]" />
      </motion.div>

      {/* Glow */}
      <div className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg bg-gradient-to-br from-amber-300/40 via-blue-400/30 to-purple-500/40" />
    </button>
  );
}
