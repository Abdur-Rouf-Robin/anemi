"use client";

import { useRouter } from "next/navigation";

const SORTS = [
  { value: "popular", label: "Default" },
  { value: "newest", label: "Newest First" },
  { value: "updated", label: "Updated (Desc)" },
  { value: "score", label: "Weighted" },
  { value: "az", label: "Name (A-Z)" }
];

export function BrowseSort({
  value,
  params
}: {
  value: string;
  params: Record<string, string | undefined>;
}) {
  const router = useRouter();

  function href(sort: string) {
    const query = new URLSearchParams();
    for (const [key, next] of Object.entries(params)) {
      if (next && key !== "page" && key !== "sort") query.set(key, next);
    }
    if (sort && sort !== "popular") query.set("sort", sort);
    const qs = query.toString();
    return qs ? `/browse?${qs}` : "/browse";
  }

  return (
    <div className="mb-6 flex justify-end">
      <select
        aria-label="Sort by"
        value={value}
        onChange={(event) => router.push(href(event.target.value))}
        className="field-input h-10 w-full sm:w-[200px]"
      >
        {SORTS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
