"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import "../../../public/styles/Navbar.css";
import { navbarItems, accountItems } from "../../constants";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "../../lib/gsap";
import { usePathname } from "next/navigation";
import MobileNavIcon from "./MobileNavIcon";
import { useMediaQuery } from "usehooks-ts";

const Navbar = () => {
  const pathname = usePathname();
  const backButtonRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [subMenuVisible, setSubMenuVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 878px)");

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll animations
  useEffect(() => {
    if (!isMounted) return;

    let lastScrollY = window.scrollY;
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          gsap.to(".navBar", {
            position: "fixed",
            top: "20px",
            borderRadius: "20px",
            duration: 0.3,
            ease: "power4.out",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: isMobile ? "10px 16px" : "15px 20px",
            width: "calc(100% - 40px)",
            left: "20px",
          });
        } else if (currentScrollY <= 50) {
          gsap.to(".navBar", {
            duration: 0.3,
            ease: "power4.out",
            top: "0px",
            borderRadius: "0px 0px 20px 20px",
            padding: isMobile ? "10px 16px" : "15px 20px",
            width: "100%",
            left: "0px",
          });
        }

        lastScrollY = currentScrollY;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMounted, isMobile]);

  // Handle submenu animations
  useEffect(() => {
    if (!isMounted) return;

    if (subMenuVisible) {
      gsap.to(".subMenu", {
        opacity: 1,
        display: "flex",
        duration: 0.35,
        ease: "power2.out",
      });
      gsap.to(".rotateArrow", {
        rotate: "-145deg",
        duration: 0.7,
        ease: "power4.out",
      });
    } else {
      gsap.to(".subMenu", {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          const subMenu = document.querySelector(".subMenu");
          if (subMenu) {
            (subMenu as HTMLElement).style.display = "none";
          }
        },
      });
      gsap.to(".rotateArrow", {
        rotate: "45deg",
        duration: 0.7,
        ease: "power4.out",
      });
    }
  }, [subMenuVisible, isMounted]);

  // Initial animation on mount
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

  // Update backbutton position
  const updateBackbuttonPosition = useCallback(
    (element: HTMLElement) => {
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

        if (element.textContent?.trim() === "Account") {
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

  // Hide backbutton
  const hideBackbutton = useCallback(() => {
    if (!backButtonRef.current || !isMounted) return;

    gsap.to(backButtonRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power4.out",
    });
  }, [isMounted]);

  // Update active link indicator on pathname change
  useEffect(() => {
    if (!isMounted) return;

    const activeItem = navbarItems.find((item) => item.href === pathname);
    if (activeItem && navContainerRef.current) {
      const timeoutId = setTimeout(() => {
        const activeLink = navContainerRef.current?.querySelector(
          `a[href="${pathname}"]`
        );
        if (activeLink) {
          updateBackbuttonPosition(activeLink as HTMLElement);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      hideBackbutton();
    }
  }, [pathname, isMounted, updateBackbuttonPosition, hideBackbutton]);

  // Mouse event handlers
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
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
        updateBackbuttonPosition(activeLink as HTMLElement);
      }
    } else {
      hideBackbutton();
    }
  }, [pathname, isMounted, updateBackbuttonPosition, hideBackbutton]);

  // Handle account menu mouse events
  const handleAccountMouseEnter = useCallback(() => {
    if (!isMounted) return;
    setSubMenuVisible(true);
  }, [isMounted]);

  const handleAccountMouseLeave = useCallback(() => {
    if (!isMounted) return;
    setSubMenuVisible(false);
  }, [isMounted]);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subMenuVisible &&
        !(event.target as Element).closest(".account-wrapper")
      ) {
        setSubMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [subMenuVisible]);

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
          <div className="mobNavIcon">
            <MobileNavIcon />
          </div>
          <div className="navItem relative" ref={navContainerRef}>
            {/* Static navbar items for SSR */}
            {navbarItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className={`nav-link w-full h-full center py-2 ${
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
              className={`nav-link w-full h-full center py-2 ${
                pathname === item.href ? "active" : ""
              }`}
              onMouseEnter={handleMouseEnter}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Account with dropdown */}
          {navbarItems.slice(-1).map((item, idx) => (
            <div
              key={`account-${idx}`}
              className="account-wrapper relative"
              onMouseEnter={handleAccountMouseEnter}
              onMouseLeave={handleAccountMouseLeave}
            >
              <Link
                href={item.href}
                className={`nav-link w-full h-full center py-2 lastItem ${
                  pathname === item.href ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setSubMenuVisible((prev) => !prev);
                }}
              >
                {item.label}
                {"icon" in item && item.icon && (
                  <item.icon size={16} className="rotateArrow ml-2" />
                )}
              </Link>
              <div 
                className="subMenu" 
                onMouseLeave={() => setSubMenuVisible(false)}
                style={{ display: "none", opacity: 0 }}
              >
                <div className="subMenu-content">
                  {accountItems.map((subItem) => (
                    <Link
                      key={subItem.label}
                      href={subItem.href}
                      className="flex justify-around items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded transition-colors"
                      onClick={() => setSubMenuVisible(false)}
                    >
                      {"icon" in subItem && subItem.icon && (
                        <subItem.icon size={16} />
                      )}
                      <span>{subItem.label}</span>
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