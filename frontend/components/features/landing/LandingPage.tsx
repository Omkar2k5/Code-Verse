"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Users,
  MapPin,
  Shield,
  AlertTriangle,
  Clock,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { HorizontalSlides, SplitText } from "@/components/common";

export default function LandingPage() {
  const problemSlides = [
    {
      id: "threats",
      title: "Rising Threats",
      description:
        "Weapon-related crimes are rising across public spaces, schools, religious gatherings, and transportation hubs. India reports 20K+ such incidents annually, while globally schools have faced 100+ shooting incidents in the last decade. Legacy CCTV systems detect <5% of events in real time.",
      icon: <AlertTriangle size={48} className="text-white" />,
      stats: [
        { label: "Weapon crimes in India annually", value: "20K+" },
        { label: "School shootings globally (last decade)", value: "100+" },
        { label: "Real-time detection in legacy CCTV", value: "<5%" },
      ],
    },
    {
      id: "consequences",
      title: "Tragic Consequences",
      description:
        "Delayed detection escalates situations into violence, loss of lives, and public panic. Slow manual monitoring and late police intervention compound the damage.",
      icon: <Clock size={48} className="text-white" />,
      stats: [
        { label: "Lives lost annually worldwide in public gatherings", value: "1000+" },
        { label: "Avg police response time", value: "10+ min" },
        { label: "Economic & social losses", value: "Billions" },
      ],
    },
    {
      id: "limitations",
      title: "Current Limitations",
      description:
        "Existing surveillance relies on manual observation with minimal automation, making it impossible to scale across hundreds of cameras or predict threats before they occur.",
      icon: <Users size={48} className="text-white" />,
      stats: [
        { label: "Detection delay with manual monitoring", value: "10–15 min" },
        { label: "Effective screens per guard", value: "4–5" },
        { label: "Predictive alerting in legacy systems", value: "None" },
      ],
    },
    {
      id: "solution",
      title: "AI-Powered Solution (SafeVision)",
      description:
        "SafeVision provides real-time weapon detection, automated escalation, and predictive analytics. It analyzes live CCTV/IP feeds, identifies weapons instantly, alerts security teams, and escalates to nearby police stations with geo-precision and annotated snapshots.",
      icon: <Users2 size={48} className="text-white" />,
      stats: [
        { label: "Detection time (YOLOv8)", value: "<1 sec" },
        { label: "Detection accuracy", value: "95%+" },
        { label: "Geo-aware escalation (SMS/Email/API)", value: "Instant" },
        { label: "Coverage", value: "Unlimited (Cloud/Kubernetes)" },
      ],
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Mass Gatherings",
      description:
        "Managing crowds in festivals, religious events, and public spaces",
    },
    {
      icon: MapPin,
      title: "Real-time Tracking",
      description: "Instant detection and monitoring of crowd density patterns",
    },
    {
      icon: Shield,
      title: "Safety Assurance",
      description: "Preventing stampedes and ensuring public safety through AI",
    },
  ];

  return (
    <div className="relative min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative z-20 min-h-screen flex flex-col pt-20">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-7xl px-6 lg:px-8 text-center">
            <div className="mb-6">
              <SplitText
                text="SafeVision"
                className="text-6xl md:text-8xl font-bold text-blue-400"
                splitType="chars"
                delay={150}
                duration={0.8}
                ease="power3.out"
                from={{ opacity: 0, y: 60 }}
                to={{ opacity: 1, y: 0 }}
                textAlign="center"
              />
            </div>
            <div className="max-w-3xl mx-auto mb-8">
              <SplitText
                text="SafeVision is an AI-powered real-time weapon detection and emergency escalation system designed to enhance public safety. By analyzing live CCTV/IP camera feeds, the system identifies weapons instantly, sends alerts to security teams, and escalates emergencies to nearby police stations with precise location and annotated snapshots. This ensures faster response times, reduced risks, and safer communities."
                className="text-xl md:text-2xl text-gray-300 leading-relaxed"
                splitType="words"
                delay={80}
                duration={0.6}
                ease="power2.out"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                textAlign="center"
              />
            </div>
          </div>
        </div>

        {/* Dive Deeper Button - Positioned at bottom of hero */}
        <div className="flex justify-center pb-8 md:pb-12">
          <motion.button
            onClick={() => {
              const problemSection = document.querySelector(
                ".horizontal-slides-section"
              );
              problemSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-600/30 hover:border-blue-400/50 hover:text-white transition-all duration-500 flex items-center gap-2 md:gap-3 shadow-lg hover:shadow-blue-500/25"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
          >
            <span className="text-sm md:text-base">Dive Deeper</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>
        </div>
      </div>

      {/* Problem Statement Horizontal Slides */}
      <div className="relative z-20 horizontal-slides-section">
        <HorizontalSlides slides={problemSlides} />
      </div>

      {/* Explore Working Button */}
      <div className="relative z-20 flex justify-center mt-6 md:mt-8 mb-4 md:mb-6">
        <Link href="/working">
          <motion.button
            className="group relative px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-600/30 hover:border-blue-400/50 hover:text-white transition-all duration-500 flex items-center gap-2 md:gap-3 shadow-lg hover:shadow-blue-500/25"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <span className="text-sm md:text-base">Explore Working</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
