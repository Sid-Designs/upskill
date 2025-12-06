"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/app/lib/gsap";
import { CheckCircle } from "lucide-react";
import { aiFeatures, stats, benefits } from '@/app/constants';


const HomeAbout = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set([".about-header", ".about-content", ".about-image", ".benefit-item"], { 
        opacity: 1, 
        y: 0 
      });
      return;
    }

    // Header animation
    gsap.fromTo(".about-header", 
      {
        opacity: 0,
        y: 40,
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

    // Content animation (left side)
    gsap.fromTo(".about-content", 
      {
        opacity: 0,
        x: -30,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Image animation (right side)
    gsap.fromTo(".about-image", 
      {
        opacity: 0,
        x: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: imageRef.current,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Benefits list animation
    gsap.fromTo(".benefit-item", 
      {
        opacity: 0,
        x: -20,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".benefits-section",
          start: "top 85%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

  }, { scope: sectionRef });

  return (
    <div 
      ref={sectionRef}
      id="about" 
      className="w-full bg-white px-8 pt-26"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-10">
          <div className="about-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900">
              About{" "}
              <span className="bg-gradient-to-r bg-[var(--color-primary)] bg-clip-text text-transparent">
                UpSkill
              </span>
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
              A smart career-building platform designed to personalize growth,
              unlock opportunities, and make learning truly accessible.
            </p>
          </div>
        </div>

        {/* Main Content - Image Right & Content Left */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div ref={contentRef} className="space-y-8">
            {/* Introduction */}
            <div className="space-y-4 about-content">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Revolutionizing Career Development <br /> With AI
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                UpSkill leverages cutting-edge artificial intelligence to create
                personalized learning experiences that adapt to your unique
                needs and career aspirations.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our platform continuously evolves with the job market, ensuring
                you're always learning the most relevant and in-demand skills.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="space-y-3 benefits-section">
              <h4 className="text-xl font-bold text-gray-900 about-content">
                Why Choose UpSkill?
              </h4>
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item flex items-center gap-3">
                  <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image Section */}
          <div ref={imageRef} className="relative">
            {/* Main Image Container */}
            <div className="about-image relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/api/placeholder/600/400"
                alt="UpSkill AI Learning Platform"
                className="w-full h-[450px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAbout;