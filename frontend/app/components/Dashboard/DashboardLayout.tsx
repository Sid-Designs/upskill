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

// Define valid routes
const validRoutes = [
  "dashboard",
  "workspace",
  "ai-tools",
  "history",
  "chatbot",
  "resume-builder",
  "roadmap",
  "cover-letter"
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
      "Cover Letter": "cover-letter"
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
      "ChatBot": "chatbot"
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
        return <div>Roadmap</div>;
      case "cover-letter":
        return <CoverLetter />;
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

  return (
    <>
      <HideLayoutOnDashboard />
      <div className="dashLayout">
        <Sidebar
          selected={activeComponent}
          onSelect={handleSidebarSelect}
        />
        <div className="dashboard">
          {renderComponent()}
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;