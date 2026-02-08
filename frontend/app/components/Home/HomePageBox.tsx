"use client";

import React, { useEffect, useRef } from "react";

const HomePageBox = () => {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const updateWidth = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1) * 4;

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const width = 75 + 15 * easedProgress;
      box.style.width = `${width}%`;
    };

    window.addEventListener("scroll", updateWidth);
    updateWidth();

    return () => {
      window.removeEventListener("scroll", updateWidth);
    };
  }, []);

  return <div className="homeBox my-2 mb-4" ref={boxRef}>
    <img src="/images/dashboardImg.webp" className="rounded homeBoxIcon" alt="UpSkill Logo" />
  </div>;
};

export default HomePageBox;
