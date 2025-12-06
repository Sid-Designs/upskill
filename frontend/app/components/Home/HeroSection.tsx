import React from "react";
import { WordRotate } from "../Elements/WordRotate";
import HomePageBox from "./HomePageBox";

const HeroSection = () => {
  return (
    <div className="w-full h-full center flex-col gap-6">
      <div className="text-center heroTextSec">
        <div className="flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
          <WordRotate
            words={["Start", "Build", "Evolve", "Succeed"]}
            className="inline-block mr-2 firstWord"
          />
          your journey
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-semibold">
          to master, impact & lead
        </div>
      </div>
      <div className="w-full h-full center">
        <HomePageBox />
      </div>
    </div>
  );
};

export default HeroSection;
