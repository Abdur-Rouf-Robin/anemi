"use client";

import { cn } from "@/lib/utils";

import type { Cue } from "./captions";
import { cueAt } from "./captions";

export function CaptionOverlay({
  cues,
  time,
  offset,
  visible,
  size,
  color,
  outline,
  box,
  position,
  under,
  fade
}: {
  cues: Cue[];
  time: number;
  offset: number;
  visible: boolean;
  size: "sm" | "md" | "lg";
  color: "white" | "yellow" | "cyan";
  outline: boolean;
  box: boolean;
  position: "top" | "bottom";
  under: boolean;
  fade: boolean;
}) {
  if (!visible) return null;
  const cue = cueAt(cues, time + offset);
  const text = cue?.text ?? "";
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4",
        under ? "bottom-14" : position === "top" ? "top-16" : "bottom-20",
        fade && "transition-opacity duration-300",
        text ? "opacity-100" : "opacity-0"
      )}
    >
      <p
        className={cn(
          "max-w-[90%] text-center font-semibold whitespace-pre-line",
          size === "sm" && "text-sm",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl",
          color === "white" && "text-white",
          color === "yellow" && "text-yellow-300",
          color === "cyan" && "text-cyan-300",
          outline && "caption-outline",
          box && "rounded-md bg-black/70 px-3 py-1"
        )}
      >
        {text}
      </p>
    </div>
  );
}
