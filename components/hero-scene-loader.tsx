"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

const Scene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
});

// A failed optional chunk must never take down the hero's copy or links.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function HeroSceneLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Phones: the 3D line is unreadable at that size and costly to load, so the Three chunk is never requested.
    const phone = window.matchMedia("(max-width: 767px)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let secondFrame = 0;
    // Let the server-rendered heading paint before requesting the Three chunk.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (phone.matches) return;
        if ("requestIdleCallback" in window) {
          idle = window.requestIdleCallback(() => setReady(true), { timeout: 1800 });
        } else {
          timer = setTimeout(() => setReady(true), 100);
        }
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  return <div className="hero-scene">
    <SceneBoundary>{ready ? <Scene /> : null}</SceneBoundary>
  </div>;
}
