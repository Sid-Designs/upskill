"use client";

import React, { useEffect, useRef } from "react";
import CardSwap, { Card } from './CardSwap'

const HomePageBox = () => {
  const boxRef = useRef(null);
  const animationFrameRef = useRef();
  
  useEffect(() => {    
    const box = boxRef.current;
    
    const updateWidth = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (Math.min(scrollY / maxScroll, 1)*4);
      
      // Easing function for smoother animation
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const width = 75 + (15 * easedProgress);
      box.style.width = `${width}%`;
      
      animationFrameRef.current = requestAnimationFrame(updateWidth);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateWidth);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <div className="homeBox" ref={boxRef}></div>;
};

export default HomePageBox;