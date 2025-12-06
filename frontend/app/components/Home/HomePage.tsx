import React from "react";
import "../../../public/styles/HomePage.css";
import HomeAbout from "./HomeAbout";
import HeroSection from "./HeroSection";
import WorkSection from "./WorkSection";
import HomeService from "./HomeService";

const HomePage = () => {
  return (
    <div className="h-fit">
      <HeroSection />
      <WorkSection />
      <HomeAbout />
      <HomeService />
    </div>
  );
};

export default HomePage;
