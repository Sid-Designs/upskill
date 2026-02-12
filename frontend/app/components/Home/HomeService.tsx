"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  Map,
  FileText,
  Award,
  Briefcase,
  Target,
  Sparkles,
  GraduationCap,
  PenTool,
} from "lucide-react";

const HomeService = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // ✅ Your actual services – clean, accurate, and ready to impress
  const services = [
    {
      id: 1,
      title: "AI Career Roadmap",
      description:
        "Get a personalized step-by-step learning path tailored to your skills, goals, and target role.",
      icon: Map,
      color: "from-blue-600 to-indigo-600",
      features: ["Skill gap analysis", "Timeline & milestones", "Resource recommendations"],
    },
    {
      id: 2,
      title: "Cover Letter Generator",
      description:
        "Generate professional, AI-crafted cover letters that highlight your strengths and match job descriptions.",
      icon: FileText,
      color: "from-purple-600 to-pink-600",
      features: ["Job-specific tailoring", "Multiple tone options", "Export to PDF"],
    },
    {
      id: 3,
      title: "Capstone Project Studio",
      description:
        "Build real‑world, industry‑aligned projects that demonstrate your skills and become portfolio‑ready.",
      icon: Briefcase,
      color: "from-green-600 to-emerald-600",
      features: ["Guided project roadmap", "Code reviews", "Portfolio integration"],
    },
    {
      id: 4,
      title: "Professional Certification",
      description:
        "Earn verified certificates upon completion – shareable on LinkedIn and trusted by employers.",
      icon: Award,
      color: "from-yellow-600 to-orange-600",
      features: ["Blockchain‑verified", "Employer‑recognized", "Lifetime access"],
    },
    {
      id: 5,
      title: "Skill Gap Analysis",
      description:
        "AI‑powered assessment that identifies missing skills and suggests precise learning paths.",
      icon: Target,
      color: "from-red-600 to-rose-600",
      features: ["Real‑time market data", "Personalized recommendations", "Progress tracking"],
    },
    {
      id: 6,
      title: "Portfolio Builder",
      description:
        "Transform your capstone projects into a stunning portfolio that stands out to recruiters.",
      icon: PenTool,
      color: "from-indigo-600 to-blue-600",
      features: ["Customizable templates", "Live demo hosting", "Shareable link"],
    },
    {
      id: 7,
      title: "Interview Preparation",
      description:
        "Practice with AI‑generated mock interviews tailored to your target companies and roles.",
      icon: GraduationCap,
      color: "from-teal-600 to-cyan-600",
      features: ["Role‑specific questions", "Feedback & scoring", "Behavioral & technical"],
    },
    {
      id: 8,
      title: "Career Coaching",
      description:
        "One‑on‑one mentorship sessions with industry experts to refine your strategy and confidence.",
      icon: Sparkles,
      color: "from-violet-600 to-purple-600",
      features: ["Resume reviews", "Networking tips", "Offer negotiation"],
    },
  ];

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        gsap.set([".service-header", ".service-card"], {
          opacity: 1,
          y: 0,
          scale: 1,
        });
        return;
      }

      gsap.defaults({ ease: "power3.out" });

      // Header animation
      gsap.fromTo(
        ".service-header",
        { opacity: 0, y: 24, force3D: true },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Cards stagger animation
      gsap.fromTo(
        ".service-card",
        { opacity: 0, y: 36, scale: 0.96, force3D: true },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: { each: 0.06, from: "start" },
          ease: "expo.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <div
      ref={sectionRef}
      className="w-full py-16 pt-26 px-4 sm:px-6 lg:px-8"
      id="services"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header – completely rewritten to match your brand */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="service-header">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Career‑Building Services

            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to go from where you are to where you want to be—
              powered by AI and built for results.
            </p>
          </div>
        </div>

        {/* Services Grid – clean, filter‑free, 8 core offerings */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {services.map((service) => (
            <div
              key={service.id}
              className="service-card group bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-2xl transition-all duration-300 transform-gpu hover:-translate-y-2"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Icon with brand‑consistent gradient */}
              <div
                className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${service.color} text-white shadow-lg mb-4`}
              >
                <service.icon className="size-6" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                {service.description}
              </p>

              {/* Feature list */}
              <div className="space-y-2">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="size-1.5 bg-gray-400 rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeService;