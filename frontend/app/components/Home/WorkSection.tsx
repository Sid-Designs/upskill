"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { UserPlus, Rocket, Award, Sparkles } from "lucide-react"; // Changed GraduationCap → Award

const WorkSection = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set([".how-card", ".card-icon"], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    // Header animation
    gsap.fromTo(headerRef.current,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Cards stagger animation
    gsap.fromTo(".how-card",
      {
        opacity: 0,
        y: 60,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Icons animation
    gsap.fromTo(".card-icon",
      {
        scale: 0.8,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
      }
    );

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative w-full py-16 sm:py-20 lg:py-24"
      aria-labelledby="how-heading"
    >
      {/* White theme background */}
      <div className="absolute inset-0" />

      {/* Soft gradient tint (optional, very light) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-5 sm:mb-6">
            <Sparkles className="size-4 sm:size-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              AI-Powered Journey
            </span>
          </div>

          <h2
            id="how-heading"
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900"
          >
            How It Works
          </h2>
          <p className="mx-auto my-4 sm:my-6 max-w-2xl text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
            Three simple steps to unlock your career potential with our
            <span className="font-semibold text-gray-900">
              {" "}
              AI-powered platform
            </span>
            .
          </p>
        </div>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Card 1: Profile */}
          <article
            className="how-card bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
            tabIndex={0}
            aria-label="Create your profile"
          >
            <div className="flex h-full flex-col items-center text-center gap-4 sm:gap-5">
              <div className="card-icon flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                <UserPlus
                  className="size-7 sm:size-8 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Create Your Profile
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Sign up and build your career profile. Our AI analyzes your
                  skills and goals to craft a personalized roadmap.
                </p>
              </div>
            </div>
          </article>

          {/* Card 2: Smart Plan + Cover Letter */}
          <article
            className="how-card bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition"
            tabIndex={0}
            aria-label="Get a smart plan and cover letter"
          >
            <div className="flex h-full flex-col items-center text-center gap-4 sm:gap-5">
              <div className="card-icon flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100">
                <Rocket
                  className="size-7 sm:size-8 text-purple-600"
                  aria-hidden="true"
                />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Get a Smart Plan
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Receive a step-by-step learning plan with timelines,
                  milestones, resources, and an AI-generated cover letter tailored to your profile.
                </p>
              </div>
            </div>
          </article>

          {/* Card 3: Capstone + Certification (UPDATED) */}
          <article
            className="how-card bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500/60 transition"
            tabIndex={0}
            aria-label="Earn certification with capstone projects"
          >
            <div className="flex h-full flex-col items-center text-center gap-4 sm:gap-5">
              <div className="card-icon flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-green-50 border border-green-100">
                <Award
                  className="size-7 sm:size-8 text-green-600"
                  aria-hidden="true"
                />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Build & Certify
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Complete industry-aligned capstone projects, earn verified certificates,
                  and build a standout portfolio that showcases your expertise to employers.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;