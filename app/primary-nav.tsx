"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/home", "Home"],
  ["/plan", "Plan"],
  ["/profile", "Profile"]
] as const;

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      {links.map(([href, label]) => {
        const isCurrent = pathname === href;
        return <Link aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "current" : undefined} href={href} key={href}>{label}</Link>;
      })}
    </nav>
  );
}
