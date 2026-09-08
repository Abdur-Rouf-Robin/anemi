"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

export function FilterToggle({
  children,
  defaultOpen = false
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <div className="mb-4 flex justify-end">
        <button type="button" className="filter-btn" onClick={() => setOpen((value) => !value)}>
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
      </div>
      {open ? <div className="card-panel p-4 sm:p-5">{children}</div> : null}
    </div>
  );
}
