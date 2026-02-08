"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import HideLayoutOnDashboard from "./HideLayoutOnDashboard";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Workspace from "./Workspace";
import AITools from "./AITools";
import { gsap, useGSAP } from "../../../lib/gsap";
import "../../../public/styles/dashboardLayout.css";
import ChatBot from "../Tools/ChatBot";
import History from "../Tools/History";
import CoverLetter from "../Tools/CoverLetter";
import Roadmap from "../Tools/Roadmap";
import Credits from "../Tools/Credits";
import { Menu } from "lucide-react";

// Define valid routes
const validRoutes = [
  "dashboard",
  "workspace",
  "ai-tools",
  "history",
  "chatbot",
  "resume-builder",
  "roadmap",
  "cover-letter",
  "credits"
];

const DashboardLayout = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Extract the route from the URL
  const extractRoute = () => {
    const segments = pathname.split('/').filter(Boolean);

    // Find the dashboard segment and get the next one
    const dashboardIndex = segments.indexOf("dashboard");

    if (dashboardIndex === -1 || dashboardIndex === segments.length - 1) {
      return "dashboard";
    }

    const route = segments[dashboardIndex + 1];

    // Validate the route
    if (validRoutes.includes(route)) {
      return route;
    }

    return "dashboard";
  };

  const currentRoute = extractRoute();
  const [activeComponent, setActiveComponent] = useState(currentRoute);

  // Sync component state with URL changes
  useEffect(() => {
    const route = extractRoute();
    if (route !== activeComponent) {
      setActiveComponent(route);
    }
  }, [pathname]);

  useGSAP(() => {
    gsap.fromTo(
      ".dashboard",
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power3.inOut" }
    );
  });

  // Handle sidebar selection - update URL
  const handleSidebarSelect = (component: string) => {
    // Convert component names to URL-friendly slugs
    const routeMap: Record<string, string> = {
      "Dashboard": "pannel",
      "Workspace": "workspace",
      "AI Tools": "ai-tools",
      "History": "history",
      "chatBot": "chatbot",
      "ChatBot": "chatbot",
      "resumeBuilder": "resume-builder",
      "Resume Builder": "resume-builder",
      "roadmap": "roadmap",
      "Roadmap": "roadmap",
      "coverLetter": "cover-letter",
      "Cover Letter": "cover-letter",
      "credits": "credits",
      "Credits": "credits"
    };

    const route = routeMap[component] || "dashboard";
    router.push(`/dashboard/${route}`);
  };

  // Handle dashboard tile clicks
  const handleDashboardTileClick = (componentName: string) => {
    // Convert component name to route
    const routeMap: Record<string, string> = {
      "Dashboard": "pannel",
      "Workspace": "workspace",
      "AI Tools": "ai-tools",
      "History": "history",
      "chatBot": "chatbot",
      "resumeBuilder": "resume-builder",
      "roadmap": "roadmap",
      "coverLetter": "cover-letter",
      "Resume": "resume-builder",
      "Cover Letter": "cover-letter",
      "Roadmap": "roadmap",
      "ChatBot": "chatbot",
      "credits": "credits",
      "Credits": "credits"
    };

    const route = routeMap[componentName] || "dashboard";
    router.push(`/dashboard/${route}`);
  };

  const renderComponent = () => {
    switch (currentRoute) {
      case "pannel":
        return <Dashboard onChangeComponent={handleDashboardTileClick} />;
      case "workspace":
        return <Workspace />;
      case "ai-tools":
        return <AITools />;
      case "history":
        return <History />;
      case "chatbot":
        return <ChatBot />;
      case "resume-builder":
        return <div>Resume Builder</div>;
      case "roadmap":
        return <Roadmap />;
      case "cover-letter":
        return <CoverLetter />;
      case "credits":
        return <Credits />;
      default:
        return <Dashboard onChangeComponent={handleDashboardTileClick} />;
    }
  };

  // Redirect invalid routes
  useEffect(() => {
    if (!validRoutes.includes(currentRoute)) {
      router.replace("/dashboard/pannel");
    }
  }, [currentRoute, router]);

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  const handleSidebarToggle = (isOpen: boolean) => {
    setSidebarOpenMobile(isOpen);
  };

  const closeSidebar = () => {
    setSidebarOpenMobile(false);
  };

  const openSidebar = () => {
    setSidebarOpenMobile(true);
  };

  return (
    <>
      <HideLayoutOnDashboard />
      <div className="dashLayout">
        <Sidebar
          selected={activeComponent}
          onSelect={(cmp) => {
            handleSidebarSelect(cmp);
            // Auto-close sidebar on mobile after selecting an item
            setSidebarOpenMobile(false);
          }}
          onSidebarToggle={handleSidebarToggle}
          isOpenMobile={sidebarOpenMobile}
        />
        {/* Blur overlay for mobile when sidebar is open */}
        {sidebarOpenMobile && (
          <div
            className="sidebar-overlay"
            onClick={closeSidebar}
          />
        )}
        <div className={`dashboard ${sidebarOpenMobile ? 'dashboard-blurred' : ''}`}>
          {/* Mobile hamburger menu button */}
          <button
            className="mobile-menu-btn"
            onClick={openSidebar}
            aria-label="Open menu"
          >
            <img src="/images/UpSkillLogoIcon.png" alt="U" className="h-6 w-6" />
          </button>
          {renderComponent()}
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;