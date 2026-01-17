"use client";

import { useRef, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SwipeNavigationProps {
  children: ReactNode;
  backPath?: string; // Default is "/"
  threshold?: number; // Minimum swipe distance to trigger navigation (default 100px)
  enabled?: boolean; // Enable/disable swipe (default true)
}

export function SwipeNavigation({
  children,
  backPath = "/",
  threshold = 100,
  enabled = true,
}: SwipeNavigationProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diffX = touchEndX.current - touchStartX.current;
      const diffY = Math.abs(touchEndX.current - touchStartY.current);

      // Only trigger if horizontal swipe is more significant than vertical
      // and the swipe started from the left edge (within 50px)
      if (
        diffX > threshold &&
        diffX > diffY &&
        touchStartX.current < 50
      ) {
        router.push(backPath);
      }

      // Reset
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, backPath, router]);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", width: "100%" }}>
      {children}
    </div>
  );
}
