"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function WatchStage({
  player,
  sidebar
}: {
  player: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [theater, setTheater] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);

  useEffect(() => {
    function onTheater(event: Event) {
      setTheater(Boolean((event as CustomEvent<boolean>).detail));
    }
    function onLights(event: Event) {
      setLightsOff(Boolean((event as CustomEvent<boolean>).detail));
    }
    window.addEventListener("anemi-theater", onTheater);
    window.addEventListener("anemi-lights", onLights);
    return () => {
      window.removeEventListener("anemi-theater", onTheater);
      window.removeEventListener("anemi-lights", onLights);
    };
  }, []);

  return (
    <>
      {lightsOff ? <div className="fixed inset-0 z-40 bg-black/92" /> : null}
      <div
        className={cn(
          "relative z-50 grid items-stretch gap-3",
          !theater && "xl:grid-cols-[minmax(0,1fr)_min(22rem,30vw)]"
        )}
      >
        <div className="min-w-0">{player}</div>
        {theater ? null : <div className="min-h-[240px] xl:min-h-0">{sidebar}</div>}
      </div>
    </>
  );
}
