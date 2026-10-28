"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function TaglineReveal({ lines, className }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const trigger = window.innerHeight * 0.55;
      const spans = node.querySelectorAll<HTMLSpanElement>("[data-word]");
      let count = 0;
      for (const span of spans) {
        if (span.getBoundingClientRect().top < trigger) count += 1;
        else break;
      }
      setActive((current) => (current === count ? current : count));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  let wordIndex = 0;

  return (
    <div ref={ref} className={cn("tagline", className)}>
      {lines.map((line) => (
        <p key={line}>
          {line.split(" ").map((word) => {
            const index = wordIndex;
            wordIndex += 1;
            return (
              <span
                key={`${word}-${index}`}
                data-word
                data-active={index < active ? "true" : "false"}
                className="tagline-word inline-block"
              >
                {word}&nbsp;
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
