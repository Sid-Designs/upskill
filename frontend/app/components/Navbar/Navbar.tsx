"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import "@/public/styles/Navbar.css";
import { navbarItems, accountItems } from "../../constants";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "../../lib/gsap";
import { usePathname } from "next/navigation";
import MobileNavIcon from "./MobileNavIcon";
import { useMediaQuery } from "usehooks-ts";

const Navbar = () => {
  const pathname = usePathname();
  const backButtonRef = useRef(null);
  const navBarRef = useRef(null);
  const navContainerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [subMenuVisible, setSubMenuVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 878px)");

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        gsap.to(".navBar", {
          position: "fixed",
          top: "20px",
          borderRadius: "20px",
          duration: 0.3,
          ease: "power4.out",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: isMobile ? "10px 16px" : "15px 20px",
        });
      } else if (currentScrollY === 0) {
        gsap.to(".navBar", {
          duration: 0.3,
          ease: "power4.out",
          top: "0px",
          borderRadius: "0px 0px 20px 20px",
          padding: isMobile ? "10px 16px" : "15px 20px",
        });
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMounted, isMobile]);

  useEffect(() => {
    if (!isMounted) return;

    if (subMenuVisible) {
      gsap.fromTo(
        ".subMenu",
        {
          opacity: 0,
        },
        {
          opacity: 1,
          display: "flex",
          duration: 0.35,
          ease: "power2.out",
          top: "0px",
        }
      );
      gsap.to(".rotateArrow", {
        transform: "rotate(-145deg)",
        duration: 0.7,
        ease: "power4.out",
      });
    } else {
      gsap.fromTo(
        ".subMenu",
        {
          opacity: 1,
        },
        {
          opacity: 0,
          display: "none",
          duration: 0.3,
          ease: "power2.out",
        }
      );
      gsap.to(".rotateArrow", {
        transform: "rotate(45deg)",
        duration: 0.7,
        delay: 0.2,
        ease: "power4.out",
      });
    }
  }, [subMenuVisible, isMounted]);

  // GSAP animations - only run on client after mount
  useEffect(() => {
    if (!isMounted || !navBarRef.current) return;

    gsap.fromTo(
      navBarRef.current,
      { y: -100 },
      {
        y: 0,
        duration: 0.5,
        ease: "sine.inOut",
      }
    );
  }, [isMounted]);

  // Rest of your functions remain the same...
  const updateBackbuttonPosition = useCallback(
    (element) => {
      if (
        !backButtonRef.current ||
        !element ||
        !navContainerRef.current ||
        !isMounted
      )
        return;

      try {
        const itemRect = element.getBoundingClientRect();
        const parentRect = navContainerRef.current.getBoundingClientRect();
        const leftPosition = itemRect.left - parentRect.left;

        if (element.innerHTML.trim() === "Account") {
          setSubMenuVisible(true);
          return;
        }
        gsap.to(backButtonRef.current, {
          left: `${leftPosition}px`,
          width: `${itemRect.width}px`,
          opacity: 1,
          duration: 0.3,
          ease: "power4.out",
        });
      } catch (error) {
        console.error("Error updating backbutton position:", error);
      }
    },
    [isMounted]
  );

  const hideBackbutton = useCallback(() => {
    if (!backButtonRef.current || !isMounted) return;

    gsap.to(backButtonRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power4.out",
    });
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const activeItem = navbarItems.find((item) => item.href === pathname);
    if (activeItem && navContainerRef.current) {
      setTimeout(() => {
        const activeLink = navContainerRef.current?.querySelector(
          `a[href="${pathname}"]`
        );
        if (activeLink) {
          updateBackbuttonPosition(activeLink);
        }
      }, 100);
    } else {
      hideBackbutton();
    }
  }, [pathname, isMounted, updateBackbuttonPosition, hideBackbutton]);

  const handleMouseEnter = useCallback(
    (event) => {
      if (!isMounted) return;
      updateBackbuttonPosition(event.currentTarget);
    },
    [isMounted, updateBackbuttonPosition]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isMounted) return;

    const activeItem = navbarItems.find((item) => item.href === pathname);
    if (activeItem && navContainerRef.current) {
      const activeLink = navContainerRef.current.querySelector(
        `a[href="${pathname}"]`
      );
      if (activeLink) {
        updateBackbuttonPosition(activeLink);
      }
    } else {
      hideBackbutton();
    }
  }, [pathname, isMounted, updateBackbuttonPosition, hideBackbutton]);

  // Use conditional rendering for initial mount to avoid hydration mismatch
  if (!isMounted) {
    return (
      <nav className="center">
        <div className="navBar" style={{ transform: "translateY(-100px)" }}>
          <div className="logo-container">
            <Image
              src="/images/UpSkillLogo.png"
              alt="UpSkill Logo"
              width={100}
              height={30}
              priority
              style={{
                width: "auto",
                height: "auto",
              }}
            />
          </div>
          <div className="mobNavIconPar">
            <MobileNavIcon />
          </div>
          <div className="navItem relative" ref={navContainerRef}>
            {/* Static navbar items for SSR */}
            {navbarItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className={`nav-link w-full h-full center py-2${
                  pathname === item.href ? "active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="backButton" style={{ opacity: 0 }}></div>
          </div>
        </div>
        <div className="mobNavItem"></div>
      </nav>
    );
  }

  return (
    <nav className="center">
      <div className="navBar" ref={navBarRef}>
        <div className="logo-container">
          <Image
            src="/images/UpSkillLogo.png"
            alt="UpSkill Logo"
            width={100}
            height={30}
            priority
            style={{
              width: "auto",
              height: "auto",
            }}
          />
        </div>
        <div className="mobNavIcon">
          <MobileNavIcon />
        </div>
        <div
          className="navItem relative"
          ref={navContainerRef}
          onMouseLeave={handleMouseLeave}
        >
          {navbarItems.slice(0, -1).map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className={`nav-link w-full h-full center py-2${
                pathname === item.href ? "active" : ""
              }`}
              onMouseEnter={handleMouseEnter}
            >
              {item.label}
            </Link>
          ))}
          {navbarItems.slice(-1).map((item, idx) => (
            <div
              key={`account-${idx}`}
              className="account-wrapper"
              onMouseEnter={() => setSubMenuVisible(true)}
              onMouseLeave={() => setSubMenuVisible(false)}
            >
              <Link
                href={item.href}
                className={`nav-link w-full h-full center py-2 lastItem ${
                  pathname === item.href ? "active" : ""
                }`}
                onClick={() => setSubMenuVisible((prev) => !prev)}
              >
                {item.label}
                <item.icon size={16} className="rotateArrow ml-2" />
              </Link>
              <div className="subMenu" onClick={() => setSubMenuVisible(false)}>
                <div>
                  {accountItems.map((subItem) => (
                    <Link
                      key={subItem.label}
                      href={subItem.href}
                      className="flex justify-around items-center gap-2"
                    >
                      <subItem.icon size={16} />
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="backButton" ref={backButtonRef}></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
