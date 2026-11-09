import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/server/page-auth";
export default async function AdminPage() {
  await requirePageUser("properties.manage");
  redirect("/espace");
}
