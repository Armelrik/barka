"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  House,
  UsersRound,
  CalendarDays,
  ShieldCheck,
  Settings,
  Activity,
} from "lucide-react";
export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "house"
    | "users"
    | "calendar"
    | "account"
    | "settings"
    | "activity";
};
const icons = {
  dashboard: LayoutDashboard,
  house: House,
  users: UsersRound,
  calendar: CalendarDays,
  account: ShieldCheck,
  settings: Settings,
  activity: Activity,
};
export function WorkspaceNavigation({ items }: { items: WorkspaceNavItem[] }) {
  const path = usePathname(),
    query = useSearchParams();
  return (
    <nav aria-label="Navigation de mon espace">
      {items.map((item) => {
        const target = new URL(item.href, "https://barka.example"),
          matches =
            target.pathname === "/espace"
              ? path === "/espace"
              : path === target.pathname ||
                path.startsWith(target.pathname + "/");
        const active =
          matches &&
          (target.pathname !== "/espace/visites" ||
            (target.searchParams.get("view") === "team") ===
              (query.get("view") === "team"));
        const Icon = icons[item.icon];
        return (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            key={item.href}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
