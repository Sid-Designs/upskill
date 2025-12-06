"use client";

import { useEffect } from "react";
import { gsap } from "../../lib/gsap";

const HideLayoutOnDashboard = () => {
  useEffect(() => {
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");

    if (navbar) {
      gsap.fromTo(
        navbar,
        {
          opacity: 1,
        },
        {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            navbar.style.display = "none";
          }
        }
      );
    }
    if (footer) {
      gsap.fromTo(
        footer,
        {
          opacity: 1,
        },
        {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            footer.style.display = "none";
          }
        }
      );
    }

    return () => {

    };
  }, []);

  return null;
};

export default HideLayoutOnDashboard;
