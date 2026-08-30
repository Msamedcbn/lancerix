"use client";

/**
 * Single GSAP registration point. Import animation primitives from here, never
 * from "gsap" directly, so plugins are guaranteed to be registered first.
 *
 *   import { gsap, ScrollTrigger } from "@/lib/gsap";
 *
 * Client-only by design: ScrollTrigger, ScrollSmoother, Draggable and the dev
 * tools all reach for window/document at import time, so a Server Component
 * that pulls this in would fail to render.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// ScrollSmoother depends on ScrollTrigger; both are registered in one call below.
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

// Registration mutates global GSAP state, so it must not run during the server
// render pass or during a module-graph import from a Server Component.
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    Draggable,
    DrawSVGPlugin,
    Flip,
    MotionPathPlugin,
    MorphSVGPlugin,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    ScrambleTextPlugin,
    ScrollTrigger,
    ScrollSmoother,
    ScrollToPlugin,
    SplitText,
    TextPlugin,
  );

  // Authoring tools only. Dynamic import keeps roughly 40kB of timeline UI and
  // path-editing code out of the production bundle entirely -- a static import
  // would ship it to every visitor.
  if (process.env.NODE_ENV !== "production") {
    void Promise.all([
      import("gsap/GSDevTools"),
      import("gsap/MotionPathHelper"),
    ]).then(([{ GSDevTools }, { MotionPathHelper }]) => {
      gsap.registerPlugin(GSDevTools, MotionPathHelper);
    });
  }
}

export {
  gsap,
  // Handles React 19 StrictMode double-invocation and scopes cleanup, so
  // animations are reverted on unmount instead of stacking.
  useGSAP,
  Draggable,
  DrawSVGPlugin,
  Flip,
  MotionPathPlugin,
  MorphSVGPlugin,
  Physics2DPlugin,
  PhysicsPropsPlugin,
  ScrambleTextPlugin,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText,
  TextPlugin,
};
