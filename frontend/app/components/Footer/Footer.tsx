"use client";

import React, { useRef } from "react";
import {
  footerTagline,
  websiteLinks,
  legalLinks,
  socialLinks,
} from "../../constants";
import { FaGithub, FaTwitter, FaFacebookF } from "react-icons/fa";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const iconMap: Record<string, JSX.Element> = {
    Github: <FaGithub className="w-5 h-5" />,
    Twitter: <FaTwitter className="w-5 h-5" />,
    Facebook: <FaFacebookF className="w-5 h-5" />,
  };

  useGSAP(() => {
    if (!footerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top bottom-=100",
        end: "bottom bottom",
        toggleActions: "play none none none",
      },
    });

    // Simple fade up animation for entire container
    tl.fromTo(containerRef.current, 
      {
        y: 50,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      }
    );

    // Stagger animation for all links and social icons
    tl.fromTo(".footer-link, .social-icon",
      {
        y: 20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      },
      "-=0.4" // Overlap with previous animation
    );

  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-[var(--color-background)] text-gray-700 font-sans overflow-hidden"
    >
      <div ref={containerRef} className="container mx-auto px-4 py-12 lg:px-8 opacity-0">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Logo and Tagline Section */}
          <div className="md:col-span-5 lg:col-span-6">
            <div>
              <img
                src="/images/UpskillLogo.png"
                height={30}
                width={100}
                className="text-black"
                alt="Upskill Logo"
              />
            </div>
            <p className="mt-6 max-w-md text-sm">
              {footerTagline}
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="hidden md:block lg:hidden"></div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider">
                Tools
              </h3>
              <ul className="mt-4 space-y-2">
                {websiteLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="footer-link text-sm underline-offset-4 hover:text-[var(--color-primary)] hover:underline transition-colors duration-200 block opacity-0"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="footer-link text-sm underline-offset-4 hover:text-[var(--color-primary)] hover:underline transition-colors duration-200 block opacity-0"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
          <p className="text-xs text-center sm:text-left">
            &copy; UpSkill. All rights reserved. 2025–present.
          </p>
          <div className="flex space-x-3">
            {socialLinks.map((link) => {
              const iconKey = link["aria-label"];
              const IconComponent = iconMap[iconKey];
              return (
                <a
                  key={iconKey}
                  href={link.href}
                  aria-label={iconKey}
                  className="social-icon text-gray-500 hover:text-[var(--color-primary)] transition-all duration-200 p-2 border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 opacity-0"
                >
                  {IconComponent}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;