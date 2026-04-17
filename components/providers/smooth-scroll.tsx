"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenisInstance() {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let lenis: Lenis;

    async function init() {
      const LenisClass = (await import("lenis")).default;
      lenis = new LenisClass({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1.0 });
      lenisRef.current = lenis;

      // Sync GSAP ScrollTrigger if loaded
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        gsap.registerPlugin(ScrollTrigger);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      } catch {
        // GSAP not available, use RAF loop
        function raf(time: number) {
          lenis.raf(time);
          rafRef.current = requestAnimationFrame(raf);
        }
        rafRef.current = requestAnimationFrame(raf);
      }
    }

    init();

    return () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
