import Link from "next/link";
import { cn } from "@/lib/utils";

export function RangeTabs({
  basePath,
  days,
  options,
  extra = {},
}: {
  basePath: string;
  days: number;
  options: number[];
  extra?: Record<string, string | undefined>;
}) {
  return (
    <div className="tabs">
      {options.map((option) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
        params.set("days", String(option));
        const query = params.toString();
        return (
          <Link
            key={option}
            href={query ? `${basePath}?${query}` : basePath}
            className={cn("tab", option === days && "active")}
          >
            {option}d
          </Link>
        );
      })}
    </div>
  );
}
