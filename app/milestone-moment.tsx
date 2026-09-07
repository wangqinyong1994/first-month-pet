"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isMilestoneId, milestoneImagePath } from "@/lib/milestones";

export function MilestoneMoment() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportedMilestone = searchParams.get("milestone");
  const [milestoneId, setMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!reportedMilestone || !isMilestoneId(reportedMilestone)) return;
    setMilestoneId(reportedMilestone);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("milestone");
    router.replace(nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname, { scroll: false });
  }, [pathname, reportedMilestone, router]);

  if (!milestoneId) return null;

  return (
    <aside className="milestone-moment" aria-label="Milestone unlocked" role="status">
      <Image alt="" height={72} src={milestoneImagePath(milestoneId)} width={72} />
      <div>
        <strong>New Milestone</strong>
        <p>Your thoughtful care is adding up.</p>
      </div>
      <button aria-label="Dismiss milestone message" className="milestone-moment-close" onClick={() => setMilestoneId(null)} type="button">
        Close
      </button>
    </aside>
  );
}
