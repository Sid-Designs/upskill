"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollSmoother);

ScrollTrigger.defaults({
  markers: false,
  toggleActions: "play none none reverse",
});

export { gsap, ScrollTrigger, ScrollSmoother, useGSAP };
