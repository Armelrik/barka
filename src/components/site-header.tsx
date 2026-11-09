import { currentUser } from "@/lib/server/session";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader({ userName }: { userName?: string }) {
  const name = userName ?? (await currentUser())?.firstName;
  return <SiteHeaderClient userName={name} />;
}
