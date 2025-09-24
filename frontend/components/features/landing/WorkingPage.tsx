"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  Camera,
  Cloud,
  Monitor,
  ArrowRight,
  Bell,
  Crosshair,
  MapPin,
  Server,
} from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

export default function WorkingPage() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  const { scrollYProgress } = useScroll({
    target: pipelineRef,
    offset: ["start 0.1", "end 0.9"],
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      if (pipelineRef.current) {
        setContainerWidth(pipelineRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Weapon Detection pipeline steps
  const workflowSteps = [
    {
      icon: Camera,
      title: "Live Feed Capture",
      description:
        "Video streams from CCTV/IP cameras are ingested using OpenCV.",
      color: "from-green-500 to-emerald-600",
      svg: (
        <svg className="w-16 h-16 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 2v-7l-4 2z" />
        </svg>
      ),
    },
    {
      icon: Play,
      title: "Frame Processing",
      description:
        "Each frame is processed and sent to the trained YOLOv8 detection model.",
      color: "from-blue-500 to-cyan-600",
      svg: (
        <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="8" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <path d="M4 6h16v12H4z" opacity="0.3" />
        </svg>
      ),
    },
    {
      icon: Crosshair,
      title: "Weapon Detection & Classification",
      description:
        "Model identifies presence and type of weapon (gun, knife, rifle).",
      color: "from-purple-500 to-pink-600",
      svg: (
        <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" opacity="0.3" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      icon: Bell,
      title: "Alert Trigger",
      description:
        "If weapon detected → immediate alert sent to security team via mobile app, SMS, or dashboard notification.",
      color: "from-amber-500 to-orange-600",
      svg: (
        <svg className="w-16 h-16 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" />
          <path d="M18 16H6l2-2v-3a4 4 0 118 0v3l2 2z" />
          <path d="M4 8l2 2M20 8l-2 2" opacity="0.6" />
        </svg>
      ),
    },
    {
      icon: MapPin,
      title: "Geo-Location Mapping",
      description:
        "The camera’s location is reverse-geocoded using Google Maps API to find the nearest police station.",
      color: "from-indigo-500 to-violet-600",
      svg: (
        <svg className="w-16 h-16 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      icon: Server,
      title: "Emergency Escalation",
      description:
        "Annotated snapshot, timestamp, and location details are automatically sent to police via REST API, SMS, or email.",
      color: "from-rose-500 to-red-600",
      svg: (
        <svg className="w-16 h-16 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="6" rx="2" />
          <rect x="4" y="13" width="16" height="6" rx="2" opacity="0.6" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="8" cy="16" r="1" />
        </svg>
      ),
    },
    {
      icon: Monitor,
      title: "Dashboard Monitoring",
      description:
        "Security staff view live alerts, analytics, and threat history through a React.js web dashboard.",
      color: "from-pink-500 to-rose-600",
      svg: (
        <svg className="w-16 h-16 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20h8M12 16v4" />
          <rect x="4" y="6" width="4" height="3" rx="1" opacity="0.7" />
          <rect x="9" y="6" width="6" height="2" rx="1" opacity="0.5" />
          <rect x="16" y="6" width="4" height="4" rx="1" opacity="0.8" />
        </svg>
      ),
    },
    {
      icon: Cloud,
      title: "Scalable Deployment",
      description:
        "System runs on Docker/Kubernetes for multi-camera real-time surveillance.",
      color: "from-cyan-500 to-blue-600",
      svg: (
        <svg className="w-16 h-16 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.5 12A2.5 2.5 0 0016 9.5a3 3 0 00-5.5-1.5A4 4 0 006 12a2 2 0 000 4h12.5a2.5 2.5 0 000-5z" />
          <rect x="7" y="13" width="3" height="2" rx="1" opacity="0.5" />
          <rect x="11" y="13" width="3" height="2" rx="1" opacity="0.7" />
          <rect x="15" y="13" width="3" height="2" rx="1" opacity="0.9" />
        </svg>
      ),
    },
  ];

  // Calculate transforms for synchronized scroll animation
  const stepProgresses = workflowSteps.map((_, index) => {
    const stepStart = index / workflowSteps.length;
    const stepEnd = (index + 1) / workflowSteps.length;
    return useTransform(scrollYProgress, [stepStart, stepEnd], [0, 1]);
  });

  const pathProgresses = workflowSteps.slice(0, -1).map((_, index) => {
    const pathStart = index / workflowSteps.length;
    const pathEnd = (index + 1) / workflowSteps.length;
    return useTransform(scrollYProgress, [pathStart, pathEnd], [0, 1]);
  });

  const stepTransforms = workflowSteps.map((_, index) => {
    const progress = stepProgresses[index];
    const isLeft = index % 2 === 0;
    return {
      opacity: index === 0 ? 1 : useTransform(progress, [0, 0.5], [0, 1]),
      x: index === 0 ? 0 : useTransform(progress, [0, 0.5], [isLeft ? -200 : 200, 0]),
      scale: index === 0 ? 1 : useTransform(progress, [0, 0.5], [0.8, 1]),
    };
  });

  return (
    <div className="min-h-screen from-gray-900 via-blue-900/10 to-purple-900/10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            How SafeVision Works
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A sophisticated AI pipeline that transforms raw camera feeds into
            actionable intelligence
          </p>
        </motion.div>

        {/* Weapon Detection Pipeline */}
        <motion.div
          ref={pipelineRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
            Weapon Detection Pipeline
          </h2>

          {/* Pipeline Container */}
          <div className="overflow-hidden" style={{ minHeight: "500vh" }}>
            {/* Animated Path */}
            {containerWidth > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {workflowSteps.map((_, index) => {
                  if (index === workflowSteps.length - 1) return null;

                  const progress = pathProgresses[index];
                  const cardWidth = 384;
                  const cardHeight = 280;

                  // Calculate positions for each block (centered in viewport area)
                  const currentBlockY = index === 0 ? viewportHeight * 0.35 : viewportHeight * (0.5 + index * 0.6);
                  const nextBlockY = index === 0 ? viewportHeight * (0.5 + 1 * 0.6) : viewportHeight * (0.5 + (index + 1) * 0.6);

                  const isCurrentLeft = index % 2 === 0;
                  const isNextLeft = (index + 1) % 2 === 0;

                  const usableWidth = Math.min(containerWidth, 1200);

                  // Card centers
                  const currentBlockX = isCurrentLeft ? 100 + cardWidth / 2 : usableWidth - 100 - cardWidth / 2;
                  const nextBlockX = isNextLeft ? 100 + cardWidth / 2 : usableWidth - 100 - cardWidth / 2;

                  // Start at bottom center of current block for cleaner alignment
                  const startX = currentBlockX;
                  const startY = currentBlockY + cardHeight / 2;

                  // End at top center of next block
                  const endX = nextBlockX;
                  const endY = nextBlockY - cardHeight / 2;

                  // Smooth curve between centers
                  const controlX1 = startX + (isCurrentLeft ? 120 : -120);
                  const controlY1 = startY + 80;
                  const controlX2 = endX + (isNextLeft ? -120 : 120);
                  const controlY2 = endY - 80;

                  const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${endX} ${endY}`;

                  return (
                    <g key={index}>
                      <motion.path
                        d={pathData}
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        filter="url(#glow)"
                        style={{ pathLength: progress }}
                        strokeLinecap="round"
                        strokeDasharray="8 8"
                        opacity="0.7"
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Pipeline Steps */}
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const transforms = stepTransforms[index];

              const isLeft = index % 2 === 0;
              const topPosition = (index === 0 ? viewportHeight * 0.35 : viewportHeight * (0.5 + index * 0.6)) - 140;

              const cardWidth = 384;
              const usableWidth = Math.min(containerWidth, 1200);

              const leftPosition = isLeft ? 100 : usableWidth - cardWidth - 100;

              return (
                <motion.div
                  key={index}
                  className="absolute w-96"
                  style={{
                    top: `${topPosition}px`,
                    left: `${leftPosition}px`,
                    zIndex: 2,
                    opacity: transforms.opacity,
                    x: transforms.x,
                    scale: transforms.scale,
                  }}
                >
                  <motion.div
                    className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 hover:border-blue-400/60 transition-all duration-500 shadow-2xl"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 rounded-3xl`} />

                    <div className="relative flex items-start mb-6">
                      <motion.div
                        className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mr-6 shadow-lg`}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon size={28} className="text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.div className="text-sm text-blue-400 font-semibold mb-2 tracking-wider">
                          STEP {index + 1}
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white leading-tight mb-2">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex justify-center mb-6">
                      <motion.div className="p-4 bg-gray-800/50 rounded-2xl" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                        {step.svg}
                      </motion.div>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-lg mb-6 text-center">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Technical Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 hover:border-blue-400/60 transition-all duration-500 shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl" />
          <h2 className="text-2xl font-bold text-center mb-8 text-blue-400">Key Technical Features</h2>

          {/* Infinite Scrolling Features */}
          <div className="space-y-8">
            {/* First Row - Moving Left to Right */}
            <div className="relative overflow-hidden">
              <motion.div
                className="flex space-x-6"
                animate={{ x: [0, -1000] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {/* Repeat the features 3 times for seamless loop */}
                {[...Array(3)].map((_, repeatIndex) => (
                  <div key={`row1-${repeatIndex}`} className="flex space-x-6">
                    {[
                      { color: "from-blue-500 to-cyan-500", title: "Real-time Processing", description: "Sub-second latency processing", icon: "⚡" },
                      { color: "from-purple-500 to-pink-500", title: "Multi-camera Sync", description: "Kafka-based synchronization", icon: "📹" },
                      { color: "from-green-500 to-emerald-500", title: "Advanced Clustering", description: "Crowd pattern analysis", icon: "🔍" },
                    ].map((feature, index) => (
                      <motion.div
                        key={`feature1-${repeatIndex}-${index}`}
                        className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-400/60 transition-all duration-300 shadow-lg min-w-[280px]"
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.4)" }}
                      >
                        {/* Glowing background effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-2xl`} />
                        <div className="relative">
                          <div className="flex items-center mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mr-4 text-2xl`}>
                              {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                          </div>
                          <p className="text-gray-300 text-sm">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Second Row - Moving Right to Left */}
            <div className="relative overflow-hidden">
              <motion.div
                className="flex space-x-6"
                animate={{ x: [-1000, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                {/* Repeat the features 3 times for seamless loop */}
                {[...Array(3)].map((_, repeatIndex) => (
                  <div key={`row2-${repeatIndex}`} className="flex space-x-6">
                    {[
                      { color: "from-orange-500 to-red-500", title: "Heatmap Generation", description: "Dynamic visualization", icon: "🗺️" },
                      { color: "from-pink-500 to-rose-500", title: "Route Optimization", description: "Smart escape routes", icon: "🛣️" },
                      { color: "from-cyan-500 to-blue-500", title: "Scalable Architecture", description: "Large-scale deployments", icon: "🏗️" },
                    ].map((feature, index) => (
                      <motion.div
                        key={`feature2-${repeatIndex}-${index}`}
                        className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-400/60 transition-all duration-300 shadow-lg min-w-[280px]"
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.4)" }}
                      >
                        {/* Glowing background effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-2xl`} />
                        <div className="relative">
                          <div className="flex items-center mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mr-4 text-2xl`}>
                              {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                          </div>
                          <p className="text-gray-300 text-sm">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="flex justify-center"
        >
          <Link href="/dashboard">
            <motion.button
              className="group relative px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-600/30 hover:border-blue-400/50 hover:text-white transition-all duration-500 flex items-center gap-2 md:gap-3 shadow-lg hover:shadow-blue-500/25"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-sm md:text-base">View Live Dashboard</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
