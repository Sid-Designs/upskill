"use client";

import React, { useState, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/app/lib/gsap";
import {
  Sparkles,
  Bot,
  Users,
  Database,
  Code,
  Palette,
  Cloud,
  Smartphone,
} from "lucide-react";

type ServiceCategory = "all" | "workspace" | "ai-tools";

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  category: ServiceCategory[];
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
}

const HomeService = () => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all");
  const [isAnimating, setIsAnimating] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const services: ServiceItem[] = [
    {
      id: 1,
      title: "AI Assistant Pro",
      description:
        "Intelligent AI assistant that helps you automate tasks and make data-driven decisions.",
      category: ["ai-tools", "workspace"],
      icon: Bot,
      color: "from-purple-500 to-pink-500",
      features: ["Natural Language Processing", "Task Automation", "Data Analysis"],
    },
    {
      id: 2,
      title: "Smart Workspace",
      description:
        "Collaborative workspace with integrated tools for team productivity and project management.",
      category: ["workspace"],
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      features: ["Real-time Collaboration", "Project Tracking", "Team Management"],
    },
    {
      id: 3,
      title: "Data Analytics Suite",
      description:
        "Advanced analytics platform with machine learning capabilities for business intelligence.",
      category: ["ai-tools"],
      icon: Database,
      color: "from-green-500 to-emerald-500",
      features: ["Predictive Analytics", "Data Visualization", "ML Models"],
    },
    {
      id: 4,
      title: "Code Generator AI",
      description:
        "AI-powered code generation and review system for developers and teams.",
      category: ["ai-tools"],
      icon: Code,
      color: "from-orange-500 to-red-500",
      features: ["Code Completion", "Bug Detection", "Auto Documentation"],
    },
    {
      id: 5,
      title: "Design Studio",
      description:
        "Creative suite with AI-enhanced design tools and collaboration features.",
      category: ["workspace"],
      icon: Palette,
      color: "from-pink-500 to-rose-500",
      features: ["AI Design Assistant", "Prototyping", "Team Collaboration"],
    },
    {
      id: 6,
      title: "Cloud Platform",
      description:
        "Scalable cloud infrastructure with AI optimization and automated deployment.",
      category: ["workspace", "ai-tools"],
      icon: Cloud,
      color: "from-indigo-500 to-purple-500",
      features: ["Auto Scaling", "AI Optimization", "Secure Deployment"],
    },
    {
      id: 7,
      title: "Mobile AI SDK",
      description:
        "Mobile development toolkit with pre-built AI models and optimization tools.",
      category: ["ai-tools"],
      icon: Smartphone,
      color: "from-cyan-500 to-blue-500",
      features: ["Pre-trained Models", "On-device AI", "Performance Optimization"],
    },
    {
      id: 8,
      title: "Team Analytics",
      description:
        "Comprehensive analytics for team performance and productivity insights.",
      category: ["workspace"],
      icon: Sparkles,
      color: "from-yellow-500 to-orange-500",
      features: ["Performance Metrics", "Productivity Insights", "Team Analytics"],
    },
  ];

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        gsap.set([".service-header", ".filter-buttons", ".service-card"], {
          opacity: 1,
          y: 0,
          scale: 1,
        });
        return;
      }

      // Smoother defaults for all tweens in this scope
      gsap.defaults({ ease: "power3.out" });

      // Header animation (faster & softer)
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

      // Filter buttons animation
      gsap.fromTo(
        ".filter-buttons",
        { opacity: 0, y: 16, force3D: true },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          scrollTrigger: {
            trigger: filterRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Initial service cards animation (snappier)
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

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter((service) => service.category.includes(selectedCategory));

  const handleCategorySelect = async (category: ServiceCategory) => {
    if (isAnimating || category === selectedCategory) return;
    setIsAnimating(true);

    const gridEl = gridRef.current;
    if (!gridEl) return;

    // Animate OUT current cards (quick & clean)
    const currentCards = Array.from(gridEl.querySelectorAll(".service-card"));
    await gsap.to(currentCards, {
      opacity: 0,
      y: -14,
      scale: 0.97,
      duration: 0.25,
      stagger: 0.04,
      ease: "power2.inOut",
      force3D: true,
    });

    // Switch category
    setSelectedCategory(category);

    // Give React a tick to paint the new DOM
    await new Promise((r) => setTimeout(r, 0));

    // Animate IN new cards
    const newCards = Array.from(gridEl.querySelectorAll(".service-card"));
    gsap.fromTo(
      newCards,
      { opacity: 0, y: 28, scale: 0.96, force3D: true },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "expo.out",
        stagger: 0.06,
        onComplete: () => setIsAnimating(false),
      }
    );
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case "all":
        return "All Services";
      case "workspace":
        return "Workspace Tools";
      case "ai-tools":
        return "AI Tools";
      default:
        return "Services";
    }
  };

  return (
    <div
      ref={sectionRef}
      className="w-full py-16 pt-26 px-4 sm:px-6 lg:px-8"
      id="services"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <div className="service-header">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Our{" "}
              <span className="bg-gradient-to-r bg-gray-900 bg-clip-text text-transparent">
                Services
              </span>
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Discover powerful tools and solutions to accelerate your workflow
              and boost productivity
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div
          ref={filterRef}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
        >
          <div className={`filter-buttons flex flex-wrap gap-3 mx-auto w-full center`}>
            {[
              { key: "all", label: "All Services" },
              { key: "workspace", label: "Workspace" },
              { key: "ai-tools", label: "AI Tools" },
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => handleCategorySelect(category.key as ServiceCategory)}
                disabled={isAnimating}
                className={`cursor-pointer px-6 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedCategory === category.key
                    ? "bg-gradient-to-r bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-lg"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Category Title */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">
            {getCategoryTitle()}
            <span className="text-gray-400 ml-2">({filteredServices.length})</span>
          </h3>
        </div>

        {/* Services Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="service-card group bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-2xl transition-all duration-300 transform-gpu hover:-translate-y-2"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Icon */}
              <div
                className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${service.color} text-white shadow-lg mb-4`}
              >
                <service.icon className="size-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                {service.title}
              </h3>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
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

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="size-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="size-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">We're working on new services in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeService;
