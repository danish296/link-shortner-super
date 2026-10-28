"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label,
  className,
  small = true,
}: {
  text: string;
  label?: string;
  className?: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("btn btn-outline", small && "btn-sm", className)}
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label ? (copied ? "Copied" : label) : null}
    </button>
  );
}
