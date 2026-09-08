import Link from "next/link";

import { cn } from "@/lib/utils";

export function SegmentedLinks({
  items
}: {
  items: { href: string; label: string; active?: boolean }[];
}) {
  return (
    <div className="seg-track inline-flex h-9 items-center p-0.5">
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={cn("seg-item", item.active && "seg-item-on")}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
