import { cn } from "@/lib/utils";

export function Logo({ size = 32, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#2f55f0" />
          <path d="M13.2 18.8a4.2 4.2 0 0 1 0-5.9l2.4-2.4a4.2 4.2 0 0 1 5.9 5.9l-1.2 1.2" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M18.8 13.2a4.2 4.2 0 0 1 0 5.9l-2.4 2.4a4.2 4.2 0 0 1-5.9-5.9l1.2-1.2" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="24.5" cy="7.5" r="2.5" fill="#c9f94e" />
        </svg>
      </span>
      {withText ? (
        <span className="font-display text-base font-semibold tracking-tight">
          Link<span className="brand-text">Short</span>
        </span>
      ) : null}
    </span>
  );
}
