"use client";

import React, { useState } from "react";
import HideLayoutOnDashboard from "./HideLayoutOnDashboard";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Workspace from "./Workspace";
import AITools from "./AITools";
import { gsap, useGSAP } from "../../lib/gsap";

import "@/public/styles/dashboardLayout.css";

const DashboardLayout = () => {
  const [activeComponent, setActiveComponent] = useState("Dashboard");
  useGSAP(() => {
    gsap.fromTo(
      ".dashboard",
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power3.inOut" }
    );
  });
  const renderComponent = () => {
    console.log(activeComponent);
    switch (activeComponent) {
      case "Dashboard":
        return <Dashboard />;
      case "Workspace":
        return <Workspace />;
      case "AI Tools":
        return <AITools/>;
      case "History":
        return <div>History Component</div>;
      default:
        return <Dashboard />;
    }
  };
  return (
    <>
      <HideLayoutOnDashboard />
      <div className="dashLayout">
        <Sidebar selected={activeComponent} onSelect={setActiveComponent} />
        <div className="dashboard">{renderComponent()}</div>
      </div>
    </>
  );
};

export default DashboardLayout;
