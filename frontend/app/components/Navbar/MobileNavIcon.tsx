"use client";

import React, { useState, useRef, useEffect } from "react";
import { gsap } from "../../../lib/gsap";
import { navbarItems, accountItems as accountItemsConst } from "../../constants";
import Link from "next/link";

type MobileNavIconProps = {
  isAuthenticated: boolean;
  accountMenuItems: typeof accountItemsConst;
};

const MobileNavIcon = ({ isAuthenticated, accountMenuItems }: MobileNavIconProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const topLineRef = useRef(null);
  const middleLineRef = useRef(null);
  const bottomLineRef = useRef(null);
  const navItemRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (
      !topLineRef.current ||
      !middleLineRef.current ||
      !bottomLineRef.current ||
      !navItemRef.current
    )
      return;

    const tl = gsap.timeline({ paused: true });

    if (isOpen) {
      // Transform to X and open navigation
      tl.to(navItemRef.current, {
        height: "80vh",
        duration: 0.4,
        ease: "power2.inOut",
      })
        .to(
          topLineRef.current,
          {
            y: 6,
            rotate: 45,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          middleLineRef.current,
          {
            opacity: 0,
            duration: 0.2,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          bottomLineRef.current,
          {
            y: -6,
            rotate: -45,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0
        );
    } else {
      // Transform back to hamburger and close navigation
      tl.to(topLineRef.current, {
        y: 0,
        rotate: 0,
        duration: 0.3,
        ease: "power2.inOut",
      })
        .to(
          middleLineRef.current,
          {
            opacity: 1,
            duration: 0.2,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          bottomLineRef.current,
          {
            y: 0,
            rotate: 0,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          navItemRef.current,
          {
            height: "0vh",
            duration: 0.4,
            ease: "power2.inOut",
          },
          0
        );
    }
    tl.play();
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <div className="mobNavIcon" onClick={() => setIsOpen(!isOpen)}>
        <div className="hamburger-container">
          <div ref={topLineRef} className="hamburger-line top-line" />
          <div ref={middleLineRef} className="hamburger-line middle-line" />
          <div ref={bottomLineRef} className="hamburger-line bottom-line" />
        </div>
      </div>

      <div ref={navItemRef} className="mobNavItem tailwind-scrollbar-hide">
        <div className="nav-content-wrapper">
          <div className="nav-section">
            <h3 className="nav-section-title">Navigation</h3>
            <div className="nav-links-grid">
              {navbarItems.slice(0, -1).map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="nav-link-item"
                >
                  <span className="nav-link-text">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Account</h3>
            <div className="account-links">
              {accountMenuItems.map((subItem, idx) => (
                <Link
                  key={idx}
                  href={subItem.href}
                  onClick={handleLinkClick}
                  className="account-link-item"
                >
                  <div className="account-link-content">
                    <subItem.icon size={20} className="account-link-icon" />
                    <span className="account-link-text">{subItem.label}</span>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavIcon;
