import { getMe } from "@/lib/api";

export async function getMeName() {
  const data = await getMe();
  const name = data?.user?.displayName?.trim();
  return name || "Your";
}
